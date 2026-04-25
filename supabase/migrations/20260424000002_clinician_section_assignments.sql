-- =============================================================================
-- Migration: 20260424000002_clinician_section_assignments.sql
-- Description: Many-to-many assignments between clinicians and sections,
--              enabling admins to assign multiple forms (sections) to a clinician.
--
-- New Table: clinician_section_assignments
-- New Functions: assign_section_to_clinician, unassign_section_from_clinician,
--                get_clinician_assignments, get_available_sections_for_assignment
--
-- Compatible with: PostgreSQL 17 (remote database)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: clinician_section_assignments
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clinician_section_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinician_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  section_number SMALLINT NOT NULL REFERENCES public.section_definitions(section_number) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinician_id, clinic_id, section_number)
);

-- Add comment
COMMENT ON TABLE public.clinician_section_assignments IS 'Assigns specific form sections to clinicians for a clinic; enables multiple section assignments per clinician';
COMMENT ON COLUMN public.clinician_section_assignments.clinician_id IS 'The clinician user (profile id)';
COMMENT ON COLUMN public.clinician_section_assignments.clinic_id IS 'The clinic this assignment belongs to (for scoping)';
COMMENT ON COLUMN public.clinician_section_assignments.section_number IS 'The section number assigned to the clinician';
COMMENT ON COLUMN public.clinician_section_assignments.assigned_by IS 'Admin user who created the assignment';
COMMENT ON COLUMN public.clinician_section_assignments.assigned_at IS 'When the assignment was made';

-- Index for fast lookups by clinician and clinic
CREATE INDEX IF NOT EXISTS idx_clinician_section_assignments_clinician
  ON public.clinician_section_assignments(clinician_id);
CREATE INDEX IF NOT EXISTS idx_clinician_section_assignments_clinic
  ON public.clinician_section_assignments(clinic_id);

-- Enable RLS
ALTER TABLE public.clinician_section_assignments ENABLE ROW LEVEL SECURITY;

-- Super-admins can do everything
CREATE POLICY "clinician_assignments_superadmin_all"
  ON public.clinician_section_assignments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'super-admin'
  ));

-- Clinic admins can manage assignments for their own clinic
CREATE POLICY "clinician_assignments_clinic_admin"
  ON public.clinician_section_assignments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.clinic_id = clinician_section_assignments.clinic_id
  ));

-- Clinicians can read their own assignments
CREATE POLICY "clinician_assignments_clinician_read"
  ON public.clinician_section_assignments FOR SELECT
  USING (clinician_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: assign_section_to_clinician
-- Admin assigns a section to a clinician. Idempotent (Upsert).
-- Returns JSON: { success: true, assignment: { ... } } or { error: "..." }
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.assign_section_to_clinician(
  p_clinician_id UUID,
  p_section_number SMALLINT,
  p_clinic_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_admin_role TEXT;
  v_admin_clinic_id UUID;
  v_admin_id UUID := auth.uid();
  v_clinician_clinic_id UUID;
  v_target_clinic_id UUID;
  v_assignment RECORD;
BEGIN
  -- Get caller profile
  SELECT p.role, p.clinic_id INTO v_admin_role, v_admin_clinic_id
  FROM public.profiles p
  WHERE p.id = v_admin_id;

  IF v_admin_id IS NULL OR v_admin_role IS NULL THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  IF v_admin_role NOT IN ('admin', 'super-admin') THEN
    RETURN jsonb_build_object('error', 'Insufficient permissions');
  END IF;

  -- Get clinician profile to check existence and derive clinic
  SELECT clinic_id INTO v_clinician_clinic_id
  FROM public.profiles
  WHERE id = p_clinician_id
    AND role = 'clinician';

  IF v_clinician_clinic_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Clinician not found or invalid role');
  END IF;

  v_target_clinic_id := COALESCE(p_clinic_id, v_clinician_clinic_id);

  -- Admin must belong to same clinic (unless super-admin)
  IF v_admin_role = 'admin' AND v_admin_clinic_id IS DISTINCT FROM v_target_clinic_id THEN
    RETURN jsonb_build_object('error', 'Cannot assign across clinics');
  END IF;

  -- Validate section exists and is active
  IF NOT EXISTS (SELECT 1 FROM public.section_definitions WHERE section_number = p_section_number AND is_active = TRUE) THEN
    RETURN jsonb_build_object('error', 'Section does not exist');
  END IF;

  -- Upsert assignment
  INSERT INTO public.clinician_section_assignments (clinician_id, clinic_id, section_number, assigned_by, assigned_at)
  VALUES (p_clinician_id, v_target_clinic_id, p_section_number, v_admin_id, NOW())
  ON CONFLICT (clinician_id, clinic_id, section_number)
  DO UPDATE SET assigned_by = v_admin_id, assigned_at = NOW()
  RETURNING * INTO v_assignment;

  RETURN jsonb_build_object(
    'success', true,
    'assignment', jsonb_build_object(
      'id', v_assignment.id,
      'clinician_id', v_assignment.clinician_id,
      'clinic_id', v_assignment.clinic_id,
      'section_number', v_assignment.section_number,
      'assigned_by', v_assignment.assigned_by,
      'assigned_at', v_assignment.assigned_at
    )
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: unassign_section_from_clinician
-- Admin removes a section assignment.
-- Returns success or error.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.unassign_section_from_clinician(
  p_assignment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_admin_role TEXT;
  v_admin_clinic_id UUID;
  v_admin_id UUID := auth.uid();
  v_target_clinic_id UUID;
BEGIN
  SELECT p.role, p.clinic_id INTO v_admin_role, v_admin_clinic_id
  FROM public.profiles p
  WHERE p.id = v_admin_id;

  IF v_admin_id IS NULL OR v_admin_role IS NULL THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  IF v_admin_role NOT IN ('admin', 'super-admin') THEN
    RETURN jsonb_build_object('error', 'Insufficient permissions');
  END IF;

  -- Get the assignment's clinic to check permissions
  SELECT clinic_id INTO v_target_clinic_id
  FROM public.clinician_section_assignments
  WHERE id = p_assignment_id;

  IF v_target_clinic_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Assignment not found');
  END IF;

  -- Admin must belong to same clinic
  IF v_admin_role = 'admin' AND v_admin_clinic_id IS DISTINCT FROM v_target_clinic_id THEN
    RETURN jsonb_build_object('error', 'Cannot modify assignments across clinics');
  END IF;

  DELETE FROM public.clinician_section_assignments
  WHERE id = p_assignment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Assignment not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: get_clinician_assignments
-- Returns all section assignments for a given clinician, including section details
-- and whether a template is activated for that section in the current cycle.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_clinician_assignments(
  p_clinician_id UUID,
  p_cycle_id UUID DEFAULT NULL
)
RETURNS TABLE (
  assignment_id UUID,
  section_number SMALLINT,
  section_name TEXT,
  short_name TEXT,
  color TEXT,
  template_id UUID,
  template_name TEXT,
  template_version TEXT,
  is_activated BOOLEAN,
  assigned_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    csa.id,
    csa.section_number,
    sd.name,
    sd.short_name,
    sd.color,
    ct.template_id,
    ft.name AS template_name,
    ft.version AS template_version,
    CASE WHEN ct.id IS NOT NULL THEN TRUE ELSE FALSE END AS is_activated,
    csa.assigned_at
  FROM public.clinician_section_assignments csa
  JOIN public.section_definitions sd ON sd.section_number = csa.section_number
  LEFT JOIN public.clinic_templates ct
    ON ct.clinic_id = csa.clinic_id
    AND ct.cycle_id = p_cycle_id
    AND ct.section_number = csa.section_number
  LEFT JOIN public.form_templates ft ON ft.id = ct.template_id
  WHERE csa.clinician_id = p_clinician_id
    AND sd.is_active = TRUE
  ORDER BY csa.section_number;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: get_available_sections_for_assignment
-- Returns all sections with activated templates for a clinic/cycle, along with
-- assignment status for a given clinician (if provided). For assignment UI.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_available_sections_for_assignment(
  p_clinic_id UUID,
  p_cycle_id UUID,
  p_include_inactive BOOLEAN DEFAULT FALSE,
  p_existing_assignments UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS TABLE (
  section_number SMALLINT,
  section_name TEXT,
  short_name TEXT,
  color TEXT,
  template_id UUID,
  template_name TEXT,
  template_version TEXT,
  is_assignable BOOLEAN,
  already_assigned UUID
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    sd.section_number,
    sd.name,
    sd.short_name,
    sd.color,
    ft.id AS template_id,
    ft.name AS template_name,
    ft.version AS template_version,
    CASE
      WHEN ft.id IS NULL THEN FALSE
      WHEN csa.id IS NOT NULL THEN FALSE
      ELSE TRUE
    END AS is_assignable,
    csa.id AS already_assigned
  FROM public.section_definitions sd
  LEFT JOIN public.clinic_templates ct
    ON ct.clinic_id = p_clinic_id
    AND ct.cycle_id = p_cycle_id
    AND ct.section_number = sd.section_number
  LEFT JOIN public.form_templates ft ON ft.id = ct.template_id
  LEFT JOIN public.clinician_section_assignments csa
    ON csa.clinic_id = p_clinic_id
    AND csa.section_number = sd.section_number
    AND csa.id = ANY(p_existing_assignments)
  WHERE sd.is_active = TRUE
    AND (p_include_inactive OR ft.id IS NOT NULL)  -- only templates that are activated unless including inactive
  ORDER BY sd.section_number;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: bulk_assign_sections_to_clinician
-- Assigns multiple sections at once (array of section numbers)
-- Useful for UI when admin selects several sections.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bulk_assign_sections_to_clinician(
  p_clinician_id UUID,
  p_section_numbers SMALLINT[],
  p_clinic_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_admin_role TEXT;
  v_admin_clinic_id UUID;
  v_admin_id UUID := auth.uid();
  v_clinician_clinic_id UUID;
  v_target_clinic_id UUID;
  v_section SMALLINT;
  v_result JSONB := '[]'::JSONB;
  v_assignment JSONB;
BEGIN
  -- Get admin role
  SELECT p.role, p.clinic_id INTO v_admin_role, v_admin_clinic_id
  FROM public.profiles p
  WHERE p.id = v_admin_id;

  IF v_admin_id IS NULL OR v_admin_role IS NULL THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  IF v_admin_role NOT IN ('admin', 'super-admin') THEN
    RETURN jsonb_build_object('error', 'Insufficient permissions');
  END IF;

  -- Get clinician profile
  SELECT clinic_id INTO v_clinician_clinic_id
  FROM public.profiles
  WHERE id = p_clinician_id AND role = 'clinician';

  IF v_clinician_clinic_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Clinician not found');
  END IF;

  v_target_clinic_id := COALESCE(p_clinic_id, v_clinician_clinic_id);

  IF v_admin_role = 'admin' AND v_admin_clinic_id IS DISTINCT FROM v_target_clinic_id THEN
    RETURN jsonb_build_object('error', 'Cannot assign across clinics');
  END IF;

  -- Loop through sections and upsert
  FOREACH v_section IN ARRAY p_section_numbers LOOP
    -- Validate section exists
    IF NOT EXISTS (SELECT 1 FROM public.section_definitions WHERE section_number = v_section AND is_active = TRUE) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.clinician_section_assignments (clinician_id, clinic_id, section_number, assigned_by, assigned_at)
    VALUES (p_clinician_id, v_target_clinic_id, v_section, v_admin_id, NOW())
    ON CONFLICT (clinician_id, clinic_id, section_number)
    DO UPDATE SET assigned_by = v_admin_id, assigned_at = NOW()
    RETURNING jsonb_build_object(
      'id', id,
      'section_number', section_number,
      'assigned_at', assigned_at
    ) INTO v_assignment;

    v_result := v_result || v_assignment;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'assignments', v_result);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: get_all_assignments_for_clinic
-- Admin view: list all assignments for a clinic with clinician names.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_all_assignments_for_clinic(
  p_clinic_id UUID
)
RETURNS TABLE (
  assignment_id UUID,
  clinician_id UUID,
  clinician_name TEXT,
  section_number SMALLINT,
  section_name TEXT,
  assigned_at TIMESTAMPTZ,
  assigned_by_name TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    csa.id,
    csa.clinician_id,
    p.full_name AS clinician_name,
    csa.section_number,
    sd.name AS section_name,
    csa.assigned_at,
    ab.full_name AS assigned_by_name
  FROM public.clinician_section_assignments csa
  JOIN public.profiles p ON p.id = csa.clinician_id
  JOIN public.section_definitions sd ON sd.section_number = csa.section_number
  LEFT JOIN public.profiles ab ON ab.id = csa.assigned_by
  WHERE csa.clinic_id = p_clinic_id
  ORDER BY csa.section_number, p.full_name;
$$;
