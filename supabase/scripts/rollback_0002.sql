-- =============================================================================
-- Rollback Script: rollback_0002.sql
-- Description: Safely rolls back migration 20260304000002.
--              Removes the normalized screening_sections structure.
--
-- ⚠️  CRITICAL WARNINGS:
--   1. This script DROPS tables and views. Data in screening_sections will be
--      PERMANENTLY LOST unless you have a backup.
--   2. The flat columns in screenings (section1_complete, section1_data, …)
--      are PRESERVED — they were never modified.
--   3. Run ONLY after confirming the flat columns still contain all data.
--   4. Requires explicit confirmation step (see below).
--   5. NEVER run this in production without a full database backup.
--
-- ROLLBACK STRATEGY:
--   Since migration 0002 is purely ADDITIVE (no existing columns were modified),
--   rollback is safe: we simply drop the new objects.
--   The original screenings table with flat columns remains intact.
--
-- EXECUTION:
--   1. Take a full database backup first:
--      supabase db dump --linked > backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql
--   2. Verify flat columns still have data:
--      SELECT COUNT(*) FROM screenings WHERE section1_data IS NOT NULL;
--   3. Run this script in Supabase SQL Editor
--   4. Verify application still works with flat columns
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- SAFETY CHECK: Verify flat columns still have data before rollback
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_flat_count    BIGINT;
  v_section_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_flat_count
  FROM public.screenings
  WHERE section1_data IS NOT NULL
     OR section2_data IS NOT NULL
     OR section3_data IS NOT NULL;

  SELECT COUNT(*) INTO v_section_count
  FROM public.screening_sections;

  RAISE NOTICE '=== ROLLBACK PRE-CHECK ===';
  RAISE NOTICE 'Screenings with flat column data: %', v_flat_count;
  RAISE NOTICE 'Rows in screening_sections (will be DROPPED): %', v_section_count;

  IF v_flat_count = 0 AND v_section_count > 0 THEN
    RAISE EXCEPTION
      'ROLLBACK BLOCKED: Flat columns are empty but screening_sections has % rows. '
      'Data would be lost. Migrate data back to flat columns first.', v_section_count;
  END IF;

  RAISE NOTICE 'Safety check passed. Proceeding with rollback...';
END;
$$;

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Drop functions
-- ─────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.upsert_screening_section(UUID, UUID, SMALLINT, JSONB, BOOLEAN);
DROP FUNCTION IF EXISTS public.get_cycle_queue(UUID, SMALLINT);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Drop view
-- ─────────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.v_screening_status;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Drop triggers on screening_sections
-- ─────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS screening_sections_completion ON public.screening_sections;
DROP TRIGGER IF EXISTS screening_sections_updated_at ON public.screening_sections;
DROP FUNCTION IF EXISTS public.handle_section_completion();

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Drop screening_sections table (CASCADE removes indexes + policies)
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.screening_sections CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Drop section_definitions table
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.section_definitions CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 6: Remove clinic_id columns (added in migration 0002)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.cycles   DROP COLUMN IF EXISTS clinic_id;
ALTER TABLE public.children DROP COLUMN IF EXISTS clinic_id;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 7: Drop clinics table
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.clinics CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION: Confirm screenings table is intact
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.screenings;
  RAISE NOTICE '=== ROLLBACK COMPLETE ===';
  RAISE NOTICE 'screenings table intact: % rows', v_count;
  RAISE NOTICE 'screening_sections: DROPPED';
  RAISE NOTICE 'section_definitions: DROPPED';
  RAISE NOTICE 'clinics: DROPPED';
  RAISE NOTICE 'v_screening_status view: DROPPED';
  RAISE NOTICE 'upsert_screening_section function: DROPPED';
  RAISE NOTICE 'get_cycle_queue function: DROPPED';
  RAISE NOTICE 'Flat columns (section1_complete, section1_data, etc.) are INTACT.';
END;
$$;

COMMIT;

-- =============================================================================
-- POST-ROLLBACK CHECKLIST:
-- [ ] Verify application works with flat columns
-- [ ] Confirm no frontend code references screening_sections directly
-- [ ] Remove migration 0002 from version control if not re-applying
-- [ ] Update supabase/migrations/ to reflect current state
-- =============================================================================
