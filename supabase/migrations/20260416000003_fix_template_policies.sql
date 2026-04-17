-- =============================================================================
-- Migration: 20260416000003_fix_template_policies.sql
-- Description: Drop and recreate RLS policies for clinic_templates.
--              Used to fix duplicate policy errors from previous migration.
--
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS clinic_templates_superadmin_all ON public.clinic_templates;
DROP POLICY IF EXISTS clinic_templates_clinic_admin ON public.clinic_templates;
DROP POLICY IF EXISTS clinic_templates_clinician_read ON public.clinic_templates;

-- Recreate policies
CREATE POLICY "clinic_templates_superadmin_all"
  ON public.clinic_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super-admin'));

CREATE POLICY "clinic_templates_clinic_admin"
  ON public.clinic_templates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.clinic_id = clinic_templates.clinic_id
  ));

CREATE POLICY "clinic_templates_clinician_read"
  ON public.clinic_templates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'clinician'
      AND p.clinic_id = clinic_templates.clinic_id
  ));
