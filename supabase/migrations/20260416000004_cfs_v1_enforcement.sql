-- =============================================================================
-- Migration: 20260416000004_cfs_v1_enforcement.sql
-- Description: Enforce CFS v1 compliance in RPC functions.
--              Updates functions to handle fully nested section structures.
--
-- CFS v1 Structure:
-- sectionName: {
--   groups: {
--     groupName: {
--       fields: {
--         fieldName: {
--           value: null,
--           type: "text|number|checkbox|radio|textarea|date",
--           meta: { label: "", required: false, computed: false, options: [] }
--         }
--       }
--     }
--   }
-- }
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: get_section_template (UPDATED FOR CFS v1)
-- Returns the full CFS v1 compliant template schema for a section
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_section_template(p_section_number SMALLINT)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    jsonb_build_object(
      sd.name,
      jsonb_build_object(
        'groups',
        sd.field_schema->'groups'
      )
    )
  FROM public.section_definitions sd
  WHERE sd.section_number = p_section_number
    AND sd.is_active = TRUE
    AND sd.is_template = TRUE;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: save_section_template (UPDATED FOR CFS v1)
-- Saves a full CFS v1 compliant section template
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
  v_section_name TEXT;
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

  -- Extract section name from template data
  v_section_name := (SELECT jsonb_object_keys(p_template_data) LIMIT 1);

  -- Validate CFS v1 structure
  IF NOT (
    p_template_data ? v_section_name AND
    p_template_data->v_section_name ? 'groups' AND
    jsonb_typeof(p_template_data->v_section_name->'groups') = 'object'
  ) THEN
    RAISE EXCEPTION 'Template data must follow CFS v1 structure: section.groups.group.fields.field';
  END IF;

  -- Update the section with CFS v1 compliant template data
  UPDATE public.section_definitions
  SET
    name = v_section_name,
    field_schema = jsonb_build_object('groups', p_template_data->v_section_name->'groups'),
    is_template = TRUE,
    updated_by = v_user_id,
    updated_at = NOW()
  WHERE section_number = p_section_number;

  RETURN TRUE;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: get_clinic_templates (UPDATED FOR CFS v1)
-- Returns available CFS v1 templates for a clinic in a cycle
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
-- FUNCTION: validate_form_response (UPDATED FOR CFS v1)
-- Validates CFS v1 form responses recursively across section.groups.fields
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
  v_section_name TEXT;
  v_groups JSONB;
  v_group_name TEXT;
  v_group_data JSONB;
  v_fields JSONB;
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

  -- Extract section name from response
  v_section_name := (SELECT jsonb_object_keys(p_response_data) LIMIT 1);

  -- Validate section structure
  IF NOT (p_response_data ? v_section_name AND p_response_data->v_section_name ? 'groups') THEN
    RETURN jsonb_build_array(
      jsonb_build_object('field', 'general', 'message', 'Response must follow CFS v1 structure')
    );
  END IF;

  v_groups := p_response_data->v_section_name->'groups';

  -- Iterate through groups
  FOR v_group_name IN SELECT jsonb_object_keys(v_groups)
  LOOP
    v_group_data := v_groups->v_group_name;

    IF jsonb_typeof(v_group_data) != 'object' OR NOT (v_group_data ? 'fields') THEN
      v_validation_errors := v_validation_errors || jsonb_build_object(
        'field', v_group_name,
        'message', 'Group must contain fields object'
      );
      CONTINUE;
    END IF;

    v_fields := v_group_data->'fields';

    -- Iterate through fields
    FOR v_field_name IN SELECT jsonb_object_keys(v_fields)
    LOOP
      v_field_config := v_fields->v_field_name;

      -- Check required fields
      IF v_field_config->>'required' = 'true' AND
         (v_field_config->'value' IS NULL OR v_field_config->'value' = 'null'::jsonb) THEN
        v_validation_errors := v_validation_errors || jsonb_build_object(
          'field', format('%s.%s', v_group_name, v_field_name),
          'message', 'Required field is empty'
        );
      END IF;

      -- Type validation
      v_field_value := v_field_config->'value';
      CASE v_field_config->>'type'
        WHEN 'number' THEN
          IF jsonb_typeof(v_field_value) != 'number' AND v_field_value IS NOT NULL THEN
            v_validation_errors := v_validation_errors || jsonb_build_object(
              'field', format('%s.%s', v_group_name, v_field_name),
              'message', 'Field must be a number'
            );
          END IF;
        WHEN 'date' THEN
          IF v_field_value IS NOT NULL AND NOT (v_field_value #>> '{}' ~ '^\d{4}-\d{2}-\d{2}') THEN
            v_validation_errors := v_validation_errors || jsonb_build_object(
              'field', format('%s.%s', v_group_name, v_field_name),
              'message', 'Field must be a valid date'
            );
          END IF;
        -- Add more type validations as needed
      END CASE;
    END LOOP;
  END LOOP;

  RETURN v_validation_errors;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: get_user_accessible_sections (NEW FOR CFS v1)
-- Returns sections accessible to the current user based on role and clinic
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_accessible_sections()
RETURNS TABLE (
  section_number SMALLINT,
  section_name TEXT,
  short_name TEXT,
  description TEXT,
  color TEXT,
  is_template BOOLEAN
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    sd.section_number,
    sd.name,
    sd.short_name,
    sd.description,
    sd.color,
    sd.is_template
  FROM public.section_definitions sd
  WHERE sd.is_active = TRUE
    AND (
      -- Superadmins see all
      EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super-admin')
      OR
      -- Admins see their clinic's sections
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
          AND p.clinic_id IN (
            SELECT clinic_id FROM public.clinic_templates
            WHERE section_number = sd.section_number
          )
      )
      OR
      -- Clinicians see their clinic's sections
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'clinician'
          AND p.clinic_id IN (
            SELECT clinic_id FROM public.clinic_templates
            WHERE section_number = sd.section_number
          )
      )
    )
  ORDER BY sd.section_number;
$$;
