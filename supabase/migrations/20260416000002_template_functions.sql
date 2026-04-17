-- =============================================================================
-- Migration: 20260416000002_template_functions.sql
-- Description: RPC functions for template-driven form management.
--              Extends existing functions with template capabilities.
--
-- New Functions:
--   get_section_template(section_number) — Get template schema for a section
--   save_section_template(section_data) — Save/update template schema
--   get_clinic_templates(clinic_id, cycle_id) — Get available templates
--   validate_form_response(section_number, response_data) — Validate responses
--
-- Compatible with: PostgreSQL 17 (remote database)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: get_section_template
-- Returns the template schema for a given section number
-- Used by frontend to dynamically render forms
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_section_template(p_section_number SMALLINT)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    jsonb_build_object(
      'sectionNumber', sd.section_number,
      'sectionName', sd.name,
      'shortName', sd.short_name,
      'description', sd.description,
      'color', sd.color,
      'templateName', sd.template_name,
      'templateVersion', sd.template_version,
      'templateCategory', sd.template_category,
      'tabsConfig', sd.tabs_config,
      'fieldSchema', sd.field_schema
    )
  FROM public.section_definitions sd
  WHERE sd.section_number = p_section_number
    AND sd.is_active = TRUE;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: save_section_template
-- Saves or updates a section template schema
-- Only superadmins can modify templates
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.save_section_template(
  p_section_number SMALLINT,
  p_template_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_role TEXT;
  v_user_id UUID := auth.uid();
BEGIN
  -- Check if user is superadmin
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_user_id IS NULL OR v_user_role IS DISTINCT FROM 'super-admin' THEN
    RAISE EXCEPTION 'Only superadmins can modify templates';
  END IF;

  -- Validate section exists
  IF NOT EXISTS (SELECT 1 FROM public.section_definitions WHERE section_number = p_section_number) THEN
    RAISE EXCEPTION 'Section % does not exist', p_section_number;
  END IF;

  -- Update the section with template data
  UPDATE public.section_definitions
  SET
    template_name = p_template_data->>'templateName',
    template_version = COALESCE(p_template_data->>'templateVersion', '1.0'),
    template_category = COALESCE(p_template_data->>'templateCategory', 'screening'),
    field_schema = p_template_data->'fieldSchema',
    is_template = TRUE,
    updated_by = v_user_id,
    updated_at = NOW()
  WHERE section_number = p_section_number;

  RETURN TRUE;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- CREATE clinic_templates TABLE
-- Tracks which templates are activated for which clinics/cycles
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clinic_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  section_number SMALLINT NOT NULL REFERENCES public.section_definitions(section_number) ON DELETE CASCADE,
  activated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, cycle_id, section_number)
);

-- Enable RLS for clinic_templates (policies will be added in a separate migration)
ALTER TABLE public.clinic_templates ENABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE public.clinic_templates IS 'Tracks which templates are activated for specific clinic/cycle combinations';

COMMENT ON COLUMN public.clinic_templates.clinic_id IS 'The clinic this template is activated for';
COMMENT ON COLUMN public.clinic_templates.cycle_id IS 'The cycle this template is activated for';
COMMENT ON COLUMN public.clinic_templates.section_number IS 'The section number of the activated template';
COMMENT ON COLUMN public.clinic_templates.activated_by IS 'User who activated this template';
COMMENT ON COLUMN public.clinic_templates.activated_at IS 'When this template was activated';

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: get_clinic_templates
-- Returns available templates for a clinic in a cycle
-- Used by clinic admins to select templates
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_clinic_templates(p_clinic_id UUID, p_cycle_id UUID)
RETURNS TABLE (
  section_number SMALLINT,
  template_name TEXT,
  template_version TEXT,
  template_category TEXT,
  is_activated BOOLEAN,
  activated_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    sd.section_number,
    sd.template_name,
    sd.template_version,
    sd.template_category,
    CASE WHEN ct.id IS NOT NULL THEN TRUE ELSE FALSE END as is_activated,
    ct.activated_at
  FROM public.section_definitions sd
  LEFT JOIN public.clinic_templates ct
    ON ct.section_number = sd.section_number
    AND ct.clinic_id = p_clinic_id
    AND ct.cycle_id = p_cycle_id
  WHERE sd.is_template = TRUE
    AND sd.is_active = TRUE
  ORDER BY sd.section_number;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: activate_clinic_template
-- Activates a template for a specific clinic and cycle
-- Only clinic admins can activate templates
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.activate_clinic_template(
  p_clinic_id UUID,
  p_cycle_id UUID,
  p_section_number SMALLINT
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

  IF v_user_id IS NULL OR
     v_user_role IS NULL OR
     v_user_role NOT IN ('super-admin', 'admin') OR
     (v_user_role = 'admin' AND v_user_clinic_id IS DISTINCT FROM p_clinic_id) THEN
    RAISE EXCEPTION 'Insufficient permissions to activate templates';
  END IF;

  -- Validate template exists
  IF NOT EXISTS (
    SELECT 1 FROM public.section_definitions
    WHERE section_number = p_section_number AND is_template = TRUE
  ) THEN
    RAISE EXCEPTION 'Template for section % does not exist', p_section_number;
  END IF;

  -- Insert or update clinic template activation
  INSERT INTO public.clinic_templates (clinic_id, cycle_id, section_number, activated_by, activated_at)
  VALUES (p_clinic_id, p_cycle_id, p_section_number, v_user_id, NOW())
  ON CONFLICT (clinic_id, cycle_id, section_number)
  DO UPDATE SET
    activated_by = v_user_id,
    activated_at = NOW();

  RETURN TRUE;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: validate_form_response
-- Validates form responses against the template schema
-- Returns validation errors or empty array if valid
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.validate_form_response(
  p_section_number SMALLINT,
  p_response_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_field_schema JSONB;
  v_validation_errors JSONB := '[]'::JSONB;
  v_field_name TEXT;
  v_field_config JSONB;
  v_field_value JSONB;
BEGIN
  -- Get the field schema for this section
  SELECT field_schema INTO v_field_schema
  FROM public.section_definitions
  WHERE section_number = p_section_number AND is_template = TRUE;

  IF v_field_schema IS NULL THEN
    RETURN jsonb_build_array(
      jsonb_build_object('field', 'general', 'message', 'No template schema found for this section')
    );
  END IF;

  -- Validate each field in the schema
  FOR v_field_name IN SELECT jsonb_object_keys(v_field_schema)
  LOOP
    v_field_config := v_field_schema->v_field_name;
    v_field_value := p_response_data->v_field_name;

    -- Check required fields
    IF (v_field_config->>'required')::BOOLEAN = TRUE THEN
      IF v_field_value IS NULL OR v_field_value = 'null'::JSONB OR
         (jsonb_typeof(v_field_value) = 'string' AND v_field_value->>0 = '') THEN
        v_validation_errors := v_validation_errors || jsonb_build_object(
          'field', v_field_name,
          'message', format('%s is required', v_field_config->>'label')
        );
        CONTINUE;
      END IF;
    END IF;

    -- Type-specific validation
    CASE v_field_config->>'type'
      WHEN 'number' THEN
        IF v_field_value IS NOT NULL AND jsonb_typeof(v_field_value) = 'number' THEN
          DECLARE
            v_num_val NUMERIC := (v_field_value->>0)::NUMERIC;
            v_min_val NUMERIC := (v_field_config->'validation'->>'min')::NUMERIC;
            v_max_val NUMERIC := (v_field_config->'validation'->>'max')::NUMERIC;
          BEGIN
            IF v_min_val IS NOT NULL AND v_num_val < v_min_val THEN
              v_validation_errors := v_validation_errors || jsonb_build_object(
                'field', v_field_name,
                'message', format('Must be at least %s', v_min_val)
              );
            END IF;
            IF v_max_val IS NOT NULL AND v_num_val > v_max_val THEN
              v_validation_errors := v_validation_errors || jsonb_build_object(
                'field', v_field_name,
                'message', format('Must be at most %s', v_max_val)
              );
            END IF;
          END;
        END IF;
      ELSE
        -- No additional validation for other types
        NULL;
    END CASE;
  END LOOP;

  RETURN v_validation_errors;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: get_user_accessible_sections
-- Returns sections a user can access based on their role and clinic
-- Used for navigation and access control
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_accessible_sections(p_clinic_id UUID, p_cycle_id UUID)
RETURNS TABLE (
  section_number SMALLINT,
  section_name TEXT,
  short_name TEXT,
  color TEXT,
  template_name TEXT,
  is_accessible BOOLEAN,
  access_reason TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    sd.section_number,
    sd.name,
    sd.short_name,
    sd.color,
    sd.template_name,
    CASE
      WHEN p.role = 'super-admin' THEN TRUE
      WHEN p.role = 'admin' AND p.clinic_id = p_clinic_id THEN TRUE
      WHEN p.role = 'clinician' AND p.clinic_id = p_clinic_id THEN
        CASE WHEN ct.id IS NOT NULL THEN TRUE ELSE FALSE END
      ELSE FALSE
    END as is_accessible,
    CASE
      WHEN p.role = 'super-admin' THEN 'Super-admin access'
      WHEN p.role = 'admin' AND p.clinic_id = p_clinic_id THEN 'Clinic admin access'
      WHEN p.role = 'clinician' AND p.clinic_id = p_clinic_id AND ct.id IS NOT NULL THEN 'Assigned to clinician'
      WHEN p.role = 'clinician' AND p.clinic_id = p_clinic_id THEN 'Not assigned to this clinician'
      ELSE 'Access denied'
    END as access_reason
  FROM public.section_definitions sd
  CROSS JOIN public.profiles p
  LEFT JOIN public.clinic_templates ct
    ON ct.section_number = sd.section_number
    AND ct.clinic_id = p_clinic_id
    AND ct.cycle_id = p_cycle_id
  WHERE p.id = auth.uid()
    AND sd.is_active = TRUE
  ORDER BY sd.section_number;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- CREATE clinic_templates TABLE
-- Tracks which templates are activated for which clinics/cycles
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clinic_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  section_number SMALLINT NOT NULL REFERENCES public.section_definitions(section_number) ON DELETE CASCADE,
  activated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, cycle_id, section_number)
);

-- Add RLS policies for clinic_templates
ALTER TABLE public.clinic_templates ENABLE ROW LEVEL SECURITY;

-- Superadmins can see all
CREATE POLICY "clinic_templates_superadmin_all"
  ON public.clinic_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super-admin'));

-- Clinic admins can see their clinic's templates
CREATE POLICY "clinic_templates_clinic_admin"
  ON public.clinic_templates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.clinic_id = clinic_templates.clinic_id
  ));

-- Clinicians can see templates assigned to their clinic
CREATE POLICY "clinic_templates_clinician_read"
  ON public.clinic_templates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'clinician'
      AND p.clinic_id = clinic_templates.clinic_id
  ));

-- Add comments
COMMENT ON TABLE public.clinic_templates IS 'Tracks which templates are activated for specific clinic/cycle combinations';
COMMENT ON COLUMN public.clinic_templates.clinic_id IS 'The clinic this template is activated for';
COMMENT ON COLUMN public.clinic_templates.cycle_id IS 'The cycle this template is activated for';
COMMENT ON COLUMN public.clinic_templates.section_number IS 'The section number of the activated template';
COMMENT ON COLUMN public.clinic_templates.activated_by IS 'User who activated this template';
COMMENT ON COLUMN public.clinic_templates.activated_at IS 'When this template was activated';
