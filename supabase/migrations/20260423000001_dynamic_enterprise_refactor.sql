-- =============================================================================
-- Migration: 20260423000001_dynamic_enterprise_refactor.sql
-- Description: Aligns the enterprise template workflow with cycle-scoped section
--              activation, draft/publish status, and clinician section mapping.
-- =============================================================================

-- Canonical clinician section assignment.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS section_number SMALLINT;

UPDATE public.profiles
SET section_number = NULLIF(section, '')::SMALLINT
WHERE section_number IS NULL
  AND NULLIF(section, '') ~ '^[0-9]+$';

COMMENT ON COLUMN public.profiles.section_number IS
  'Canonical clinician section assignment. Mirrors the active cycle section_number.';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_section_text TEXT := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'section_number', ''),
    NULLIF(NEW.raw_user_meta_data->>'section', '')
  );
BEGIN
  INSERT INTO public.profiles (id, full_name, role, section, section_number)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'clinician'),
    v_section_text,
    CASE
      WHEN v_section_text ~ '^[0-9]+$' THEN v_section_text::SMALLINT
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Template lifecycle metadata.
ALTER TABLE public.form_templates
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft', 'published')),
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

COMMENT ON COLUMN public.form_templates.status IS
  'Template lifecycle state. Drafts are private to super-admins until published.';
COMMENT ON COLUMN public.form_templates.published_at IS
  'When the template most recently entered the published state.';

UPDATE public.form_templates
SET status = CASE WHEN is_active = TRUE THEN 'published' ELSE 'draft' END
WHERE status IS NULL;

-- Allow per-section template activation again.
DO $$
DECLARE
  record_item RECORD;
BEGIN
  FOR record_item IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'clinic_templates'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) ILIKE '%(clinic_id, cycle_id)%'
      AND pg_get_constraintdef(c.oid) NOT ILIKE '%section_number%'
  LOOP
    EXECUTE format('ALTER TABLE public.clinic_templates DROP CONSTRAINT %I', record_item.conname);
  END LOOP;

  FOR record_item IN
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'clinic_templates'
      AND indexdef ILIKE 'CREATE UNIQUE INDEX%'
      AND indexdef ILIKE '%(clinic_id, cycle_id)%'
      AND indexdef NOT ILIKE '%section_number%'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', record_item.indexname);
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS clinic_templates_cycle_section_unique
  ON public.clinic_templates (clinic_id, cycle_id, section_number)
  WHERE section_number IS NOT NULL;

COMMENT ON COLUMN public.clinic_templates.section_number IS
  'Section number in the active cycle that this template is mapped to.';

-- Save template as draft or publish.
DROP FUNCTION IF EXISTS public.save_template(TEXT, JSONB, TEXT, TEXT, UUID);
CREATE OR REPLACE FUNCTION public.save_template(
  p_name TEXT,
  p_field_schema JSONB,
  p_description TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'draft',
  p_template_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
  v_user_id UUID := auth.uid();
  v_template_id UUID;
  v_current_version TEXT;
  v_next_version NUMERIC;
BEGIN
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_user_id IS NULL OR v_user_role IS DISTINCT FROM 'super-admin' THEN
    RAISE EXCEPTION 'Only superadmins can create templates';
  END IF;

  IF p_status NOT IN ('draft', 'published') THEN
    RAISE EXCEPTION 'Invalid template status: %', p_status;
  END IF;

  IF p_template_id IS NOT NULL THEN
    SELECT id, version INTO v_template_id, v_current_version
    FROM public.form_templates
    WHERE id = p_template_id;
  ELSE
    SELECT id, version INTO v_template_id, v_current_version
    FROM public.form_templates
    WHERE name = p_name
    ORDER BY updated_at DESC
    LIMIT 1;
  END IF;

  IF v_template_id IS NOT NULL THEN
    v_next_version := COALESCE(NULLIF(v_current_version, '')::NUMERIC, 1.0);

    IF p_status = 'published' THEN
      v_next_version := ROUND((v_next_version + 0.1)::NUMERIC, 1);
    END IF;

    UPDATE public.form_templates
    SET
      name = p_name,
      description = p_description,
      field_schema = COALESCE(p_field_schema, '{}'::JSONB),
      status = p_status,
      version = CASE
        WHEN p_status = 'published' THEN to_char(v_next_version, 'FM999999990.0')
        ELSE COALESCE(v_current_version, '1.0')
      END,
      published_at = CASE
        WHEN p_status = 'published' THEN NOW()
        ELSE published_at
      END,
      updated_at = NOW()
    WHERE id = v_template_id;
  ELSE
    INSERT INTO public.form_templates (
      name,
      description,
      field_schema,
      version,
      status,
      published_at,
      created_by
    )
    VALUES (
      p_name,
      p_description,
      COALESCE(p_field_schema, '{}'::JSONB),
      '1.0',
      p_status,
      CASE WHEN p_status = 'published' THEN NOW() ELSE NULL END,
      v_user_id
    )
    RETURNING id INTO v_template_id;
  END IF;

  RETURN v_template_id;
END;
$$;

DROP FUNCTION IF EXISTS public.get_template_by_id(UUID);
CREATE OR REPLACE FUNCTION public.get_template_by_id(p_template_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
SELECT jsonb_build_object(
  'id', id,
  'name', name,
  'description', description,
  'fieldSchema', field_schema,
  'version', version,
  'status', status,
  'publishedAt', published_at,
  'createdAt', created_at,
  'updatedAt', updated_at
)
FROM public.form_templates
WHERE id = p_template_id;
$$;

DROP FUNCTION IF EXISTS public.list_templates();
CREATE OR REPLACE FUNCTION public.list_templates()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  version TEXT,
  status TEXT,
  field_schema JSONB,
  activation_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
SELECT
  ft.id,
  ft.name,
  ft.description,
  ft.version,
  ft.status,
  ft.field_schema,
  COUNT(ct.id)::BIGINT AS activation_count,
  ft.created_at,
  ft.updated_at,
  ft.published_at
FROM public.form_templates ft
LEFT JOIN public.clinic_templates ct
  ON ct.template_id = ft.id
GROUP BY ft.id
ORDER BY ft.updated_at DESC, ft.created_at DESC;
$$;

DROP FUNCTION IF EXISTS public.delete_template(UUID);
CREATE OR REPLACE FUNCTION public.delete_template(p_template_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
  v_user_id UUID := auth.uid();
BEGIN
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_user_id IS NULL OR v_user_role IS DISTINCT FROM 'super-admin' THEN
    RAISE EXCEPTION 'Only superadmins can delete templates';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.form_templates WHERE id = p_template_id) THEN
    RAISE EXCEPTION 'Template not found';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.clinic_templates
    WHERE template_id = p_template_id
  ) THEN
    RAISE EXCEPTION 'Template is active in at least one clinic and cannot be deleted';
  END IF;

  DELETE FROM public.form_templates
  WHERE id = p_template_id;

  RETURN TRUE;
END;
$$;

DROP FUNCTION IF EXISTS public.activate_template(UUID, UUID, UUID, SMALLINT);
CREATE OR REPLACE FUNCTION public.activate_template(
  p_clinic_id UUID,
  p_cycle_id UUID,
  p_template_id UUID,
  p_section_number SMALLINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
  v_user_clinic_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  SELECT p.role, p.clinic_id INTO v_user_role, v_user_clinic_id
  FROM public.profiles p
  WHERE p.id = v_user_id;

  IF v_user_id IS NULL OR v_user_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_user_role NOT IN ('super-admin', 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  IF v_user_role = 'admin' AND v_user_clinic_id IS DISTINCT FROM p_clinic_id THEN
    RAISE EXCEPTION 'Cannot activate template for other clinic';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.form_templates
    WHERE id = p_template_id
      AND status = 'published'
      AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Template not found or not published';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.cycles c
    WHERE c.id = p_cycle_id
      AND c.clinic_id = p_clinic_id
      AND COALESCE(c.section_order, '[]'::JSONB) @> to_jsonb(ARRAY[p_section_number])
  ) THEN
    RAISE EXCEPTION 'Section % is not enabled for this cycle', p_section_number;
  END IF;

  INSERT INTO public.clinic_templates (
    clinic_id,
    cycle_id,
    section_number,
    template_id,
    activated_by,
    activated_at
  )
  VALUES (
    p_clinic_id,
    p_cycle_id,
    p_section_number,
    p_template_id,
    v_user_id,
    NOW()
  )
  ON CONFLICT (clinic_id, cycle_id, section_number)
  DO UPDATE SET
    template_id = EXCLUDED.template_id,
    activated_by = EXCLUDED.activated_by,
    activated_at = EXCLUDED.activated_at;

  RETURN TRUE;
END;
$$;

DROP FUNCTION IF EXISTS public.get_clinic_template(UUID, UUID, SMALLINT);
CREATE OR REPLACE FUNCTION public.get_clinic_template(
  p_clinic_id UUID,
  p_cycle_id UUID,
  p_section_number SMALLINT
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
SELECT jsonb_build_object(
  'templateId', ft.id,
  'templateName', ft.name,
  'templateDescription', ft.description,
  'fieldSchema', ft.field_schema,
  'version', ft.version,
  'status', ft.status,
  'sectionNumber', ct.section_number,
  'activatedAt', ct.activated_at
)
FROM public.clinic_templates ct
JOIN public.form_templates ft ON ft.id = ct.template_id
WHERE ct.clinic_id = p_clinic_id
  AND ct.cycle_id = p_cycle_id
  AND (ct.section_number = p_section_number OR ct.section_number IS NULL)
  AND ft.status = 'published'
  AND ft.is_active = TRUE
ORDER BY CASE WHEN ct.section_number = p_section_number THEN 0 ELSE 1 END
LIMIT 1;
$$;
