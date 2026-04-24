-- =============================================================================
-- Migration: 20260421000001_form_templates_global.sql
-- Description: Creates global form_templates table for enterprise template system
--              Templates are now global, not tied to sections
--
-- Architecture:
--   form_templates: Global master templates (Super-Admin creates)
--   clinic_templates: Links templates to clinic/cycle (Clinic Admin activates)
--   profiles.section: Maps clinician to their assigned form
--
-- Compatible with: PostgreSQL 17 (remote database)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: form_templates
-- Global templates created by Super-Admin
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.form_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  field_schema JSONB NOT NULL DEFAULT '{}'::JSONB,
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.form_templates IS 
  'Global form templates. Super-Admins create master templates here.';
COMMENT ON COLUMN public.form_templates.name IS 
  'Template name (e.g., "Child Health Screening")';
COMMENT ON COLUMN public.form_templates.description IS 
  'Optional description for admins';
COMMENT ON COLUMN public.form_templates.field_schema IS 
  'JSONB schema with groups and fields';

-- ─────────────────────────────────────────────────────────────────────────────
-- Enable RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;

-- RLS: Everyone can read templates (needed for dynamic rendering)
DROP POLICY IF EXISTS "form_templates_read_all" ON public.form_templates;
CREATE POLICY "form_templates_read_all"
  ON public.form_templates FOR SELECT
  TO authenticated
  USING (TRUE);

-- RLS: Only super-admins can insert/update/delete
DROP POLICY IF EXISTS "form_templates_superadmin_all" ON public.form_templates;
CREATE POLICY "form_templates_superadmin_all"
  ON public.form_templates FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'super-admin'
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger for updated_at
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS form_templates_updated_at ON public.form_templates;
CREATE TRIGGER form_templates_updated_at
  BEFORE UPDATE ON public.form_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: save_template
-- Saves a new template or updates existing
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.save_template(
  p_name TEXT,
  p_field_schema JSONB,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_role TEXT;
  v_user_id UUID := auth.uid();
  v_template_id UUID;
BEGIN
  -- Check if user is superadmin
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_user_id IS NULL OR v_user_role IS DISTINCT FROM 'super-admin' THEN
    RAISE EXCEPTION 'Only superadmins can create templates';
  END IF;

  -- Check if template with same name exists
  SELECT id INTO v_template_id
  FROM public.form_templates
  WHERE name = p_name;

  IF v_template_id IS NOT NULL THEN
    -- Update existing template
    UPDATE public.form_templates
    SET 
      description = COALESCE(p_description, description),
      field_schema = p_field_schema,
      version = (version::numeric + 0.1)::TEXT,
      updated_at = NOW()
    WHERE id = v_template_id;
  ELSE
    -- Insert new template
    INSERT INTO public.form_templates (name, description, field_schema, created_by)
    VALUES (p_name, p_description, p_field_schema, v_user_id)
    RETURNING id INTO v_template_id;
  END IF;

  RETURN v_template_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: get_template_by_id
-- Returns template by ID
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_template_by_id(p_template_id UUID)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER AS $$
SELECT jsonb_build_object(
  'id', id,
  'name', name,
  'description', description,
  'fieldSchema', field_schema,
  'version', version,
  'isActive', is_active,
  'createdAt', created_at,
  'updatedAt', updated_at
)
FROM public.form_templates
WHERE id = p_template_id AND is_active = TRUE;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: list_templates
-- Returns all active templates
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.list_templates()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  version TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
SELECT id, name, description, version, is_active, created_at, updated_at
FROM public.form_templates
WHERE is_active = TRUE
ORDER BY created_at DESC;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Update clinic_templates to reference form_templates
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.clinic_templates
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.form_templates(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.clinic_templates.template_id IS 
  'The form_template this clinic has activated';

-- Make section_number optional now (templates are global)
ALTER TABLE public.clinic_templates
ALTER COLUMN section_number DROP NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: activate_template
-- Activates a template for a clinic/cycle
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.activate_template(
  p_clinic_id UUID,
  p_cycle_id UUID,
  p_template_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_role TEXT;
  v_user_clinic_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  -- Check user permissions
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

  -- Validate template exists
  IF NOT EXISTS (SELECT 1 FROM public.form_templates WHERE id = p_template_id AND is_active = TRUE) THEN
    RAISE EXCEPTION 'Template not found or inactive';
  END IF;

  -- Insert or update activation
  INSERT INTO public.clinic_templates (clinic_id, cycle_id, template_id, activated_by, activated_at)
  VALUES (p_clinic_id, p_cycle_id, p_template_id, v_user_id, NOW())
  ON CONFLICT (clinic_id, cycle_id) 
  DO UPDATE SET template_id = p_template_id, activated_by = v_user_id, activated_at = NOW();

  RETURN TRUE;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: get_clinic_template
-- Gets activated template for a clinic/cycle
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_clinic_template(
  p_clinic_id UUID,
  p_cycle_id UUID
)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER AS $$
SELECT jsonb_build_object(
  'templateId', ft.id,
  'templateName', ft.name,
  'templateDescription', ft.description,
  'fieldSchema', ft.field_schema,
  'version', ft.version,
  'activatedAt', ct.activated_at
)
FROM public.clinic_templates ct
JOIN public.form_templates ft ON ft.id = ct.template_id
WHERE ct.clinic_id = p_clinic_id 
  AND ct.cycle_id = p_cycle_id
  AND ft.is_active = TRUE;
$$;
