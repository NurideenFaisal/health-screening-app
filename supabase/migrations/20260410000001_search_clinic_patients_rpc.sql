-- =============================================================================
-- Migration: 20260410000001_search_clinic_patients_rpc.sql
-- Description: Adds the clinic-scoped search_clinic_patients RPC used by the
--              clinician queue and remote patient search.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.search_clinic_patients(
  search_term text,
  target_cycle_id uuid,
  target_clinic_id uuid
)
RETURNS TABLE (
  id uuid,
  db_id uuid,
  child_code text,
  first_name text,
  last_name text,
  gender text,
  birthdate date,
  community text,
  clinic_id uuid,
  section_data jsonb,
  last_updated timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH auth_profile AS (
  SELECT role, clinic_id FROM public.get_auth_profile()
),
effective_clinic AS (
  SELECT
    role,
    CASE
      WHEN role = 'super-admin' THEN target_clinic_id
      ELSE clinic_id
    END AS clinic_id
  FROM auth_profile
)
SELECT
  c.id,
  c.id AS db_id,
  c.child_code,
  c.first_name,
  c.last_name,
  c.gender,
  c.birthdate,
  c.community,
  c.clinic_id,
  COALESCE(
    jsonb_object_agg('s' || ss.section_number, ss.is_complete) FILTER (WHERE ss.section_number IS NOT NULL),
    '{}'::jsonb
  ) AS section_data,
  GREATEST(
    COALESCE(MAX(ss.updated_at), 'epoch'::timestamptz),
    COALESCE(MAX(s.updated_at), 'epoch'::timestamptz)
  ) AS last_updated
FROM public.children c
CROSS JOIN effective_clinic ec
LEFT JOIN public.screenings s
  ON s.child_id = c.id
  AND (target_cycle_id IS NULL OR s.cycle_id = target_cycle_id)
LEFT JOIN public.screening_sections ss
  ON ss.screening_id = s.id
WHERE (
    ec.role = 'super-admin' AND (ec.clinic_id IS NULL OR c.clinic_id = ec.clinic_id)
  )
  OR (
    ec.role <> 'super-admin' AND c.clinic_id = ec.clinic_id
  )
  AND (
    search_term = '' OR
    c.child_code ILIKE '%' || search_term || '%' OR
    c.first_name ILIKE '%' || search_term || '%' OR
    c.last_name ILIKE '%' || search_term || '%'
  )
GROUP BY c.id, c.child_code, c.first_name, c.last_name, c.gender, c.birthdate, c.community, c.clinic_id, ec.role, ec.clinic_id
ORDER BY last_updated DESC NULLS LAST, c.last_name, c.first_name;
$$;
