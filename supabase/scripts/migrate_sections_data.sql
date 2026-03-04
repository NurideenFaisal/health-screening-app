-- =============================================================================
-- Script: migrate_sections_data.sql
-- Description: Data migration — copies existing section data from the flat
--              screenings columns (section1_complete, section1_data, …) into
--              the new normalized screening_sections table.
--
-- PREREQUISITES:
--   Migration 20260304000002_normalized_screening_sections.sql must be applied first.
--
-- SAFETY GUARANTEES:
--   1. Wrapped in a single transaction — all-or-nothing.
--   2. Uses INSERT ... ON CONFLICT DO NOTHING — idempotent, safe to re-run.
--   3. Does NOT drop or modify any existing columns.
--   4. Existing data in screenings table is untouched.
--   5. A pre-flight check verifies the target table exists before proceeding.
--   6. Row counts are reported before and after for verification.
--
-- EXECUTION:
--   Via Supabase SQL Editor (recommended for production):
--     Paste this script and run it.
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- PRE-FLIGHT CHECKS
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'screening_sections'
  ) THEN
    RAISE EXCEPTION 'screening_sections table does not exist. Run migration 20260304000002 first.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'section_definitions'
  ) THEN
    RAISE EXCEPTION 'section_definitions table does not exist. Run migration 20260304000002 first.';
  END IF;

  RAISE NOTICE 'Pre-flight checks passed.';
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- REPORT: Row counts before migration
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_screening_count      BIGINT;
  v_section_count_before BIGINT;
  v_s1_with_data         BIGINT;
  v_s2_with_data         BIGINT;
  v_s3_with_data         BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_screening_count FROM public.screenings;
  SELECT COUNT(*) INTO v_section_count_before FROM public.screening_sections;

  SELECT COUNT(*) INTO v_s1_with_data
    FROM public.screenings
    WHERE section1_data IS NOT NULL OR section1_complete = TRUE;

  SELECT COUNT(*) INTO v_s2_with_data
    FROM public.screenings
    WHERE section2_data IS NOT NULL OR section2_complete = TRUE;

  SELECT COUNT(*) INTO v_s3_with_data
    FROM public.screenings
    WHERE section3_data IS NOT NULL OR section3_complete = TRUE;

  RAISE NOTICE '=== PRE-MIGRATION REPORT ===';
  RAISE NOTICE 'Total screenings:               %', v_screening_count;
  RAISE NOTICE 'Existing screening_sections:    %', v_section_count_before;
  RAISE NOTICE 'Screenings with Section 1 data: %', v_s1_with_data;
  RAISE NOTICE 'Screenings with Section 2 data: %', v_s2_with_data;
  RAISE NOTICE 'Screenings with Section 3 data: %', v_s3_with_data;
  RAISE NOTICE 'Expected new rows to insert:    %', v_s1_with_data + v_s2_with_data + v_s3_with_data;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: All 3 sections in one atomic DO block
-- Uses INSERT ... ON CONFLICT DO NOTHING for idempotency
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_s1_inserted BIGINT := 0;
  v_s2_inserted BIGINT := 0;
  v_s3_inserted BIGINT := 0;
  v_s1_skipped  BIGINT := 0;
  v_s2_skipped  BIGINT := 0;
  v_s3_skipped  BIGINT := 0;
  v_s1_eligible BIGINT;
  v_s2_eligible BIGINT;
  v_s3_eligible BIGINT;
BEGIN
  -- Count eligible rows per section
  SELECT COUNT(*) INTO v_s1_eligible FROM public.screenings
    WHERE section1_data IS NOT NULL OR section1_complete = TRUE;
  SELECT COUNT(*) INTO v_s2_eligible FROM public.screenings
    WHERE section2_data IS NOT NULL OR section2_complete = TRUE;
  SELECT COUNT(*) INTO v_s3_eligible FROM public.screenings
    WHERE section3_data IS NOT NULL OR section3_complete = TRUE;

  -- ── Section 1 ──────────────────────────────────────────────────────────────
  INSERT INTO public.screening_sections (
    screening_id, section_number, is_complete, section_data, completed_at, created_at, updated_at
  )
  SELECT
    s.id, 1, s.section1_complete, s.section1_data,
    CASE WHEN s.section1_complete = TRUE THEN s.updated_at ELSE NULL END,
    s.created_at, s.updated_at
  FROM public.screenings s
  WHERE s.section1_data IS NOT NULL OR s.section1_complete = TRUE
  ON CONFLICT (screening_id, section_number) DO NOTHING;

  GET DIAGNOSTICS v_s1_inserted = ROW_COUNT;
  v_s1_skipped := v_s1_eligible - v_s1_inserted;

  -- ── Section 2 ──────────────────────────────────────────────────────────────
  INSERT INTO public.screening_sections (
    screening_id, section_number, is_complete, section_data, completed_at, created_at, updated_at
  )
  SELECT
    s.id, 2, s.section2_complete, s.section2_data,
    CASE WHEN s.section2_complete = TRUE THEN s.updated_at ELSE NULL END,
    s.created_at, s.updated_at
  FROM public.screenings s
  WHERE s.section2_data IS NOT NULL OR s.section2_complete = TRUE
  ON CONFLICT (screening_id, section_number) DO NOTHING;

  GET DIAGNOSTICS v_s2_inserted = ROW_COUNT;
  v_s2_skipped := v_s2_eligible - v_s2_inserted;

  -- ── Section 3 ──────────────────────────────────────────────────────────────
  INSERT INTO public.screening_sections (
    screening_id, section_number, is_complete, section_data, completed_at, created_at, updated_at
  )
  SELECT
    s.id, 3, s.section3_complete, s.section3_data,
    CASE WHEN s.section3_complete = TRUE THEN s.updated_at ELSE NULL END,
    s.created_at, s.updated_at
  FROM public.screenings s
  WHERE s.section3_data IS NOT NULL OR s.section3_complete = TRUE
  ON CONFLICT (screening_id, section_number) DO NOTHING;

  GET DIAGNOSTICS v_s3_inserted = ROW_COUNT;
  v_s3_skipped := v_s3_eligible - v_s3_inserted;

  RAISE NOTICE '=== MIGRATION RESULTS ===';
  RAISE NOTICE 'Section 1: % rows inserted, % conflicts skipped (already existed)',
    v_s1_inserted, v_s1_skipped;
  RAISE NOTICE 'Section 2: % rows inserted, % conflicts skipped (already existed)',
    v_s2_inserted, v_s2_skipped;
  RAISE NOTICE 'Section 3: % rows inserted, % conflicts skipped (already existed)',
    v_s3_inserted, v_s3_skipped;
  RAISE NOTICE 'Total new rows inserted: %', v_s1_inserted + v_s2_inserted + v_s3_inserted;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION: Cross-check migrated data integrity
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_mismatch_count BIGINT;
  v_total_migrated BIGINT;
  v_s1_count       BIGINT;
  v_s2_count       BIGINT;
  v_s3_count       BIGINT;
BEGIN
  -- Count rows per section
  SELECT COUNT(*) INTO v_s1_count FROM public.screening_sections WHERE section_number = 1;
  SELECT COUNT(*) INTO v_s2_count FROM public.screening_sections WHERE section_number = 2;
  SELECT COUNT(*) INTO v_s3_count FROM public.screening_sections WHERE section_number = 3;
  SELECT COUNT(*) INTO v_total_migrated FROM public.screening_sections;

  -- Check: completion flags match between old and new tables
  SELECT COUNT(*) INTO v_mismatch_count
  FROM public.screenings s
  JOIN public.screening_sections ss ON ss.screening_id = s.id
  WHERE
    (ss.section_number = 1 AND ss.is_complete != s.section1_complete)
    OR (ss.section_number = 2 AND ss.is_complete != s.section2_complete)
    OR (ss.section_number = 3 AND ss.is_complete != s.section3_complete);

  IF v_mismatch_count > 0 THEN
    RAISE EXCEPTION
      'Data integrity check FAILED: % completion flag mismatches found. Rolling back.',
      v_mismatch_count;
  END IF;

  RAISE NOTICE '=== POST-MIGRATION REPORT ===';
  RAISE NOTICE 'Section 1 rows in screening_sections: %', v_s1_count;
  RAISE NOTICE 'Section 2 rows in screening_sections: %', v_s2_count;
  RAISE NOTICE 'Section 3 rows in screening_sections: %', v_s3_count;
  RAISE NOTICE 'Total rows in screening_sections:     %', v_total_migrated;
  RAISE NOTICE 'Completion flag integrity check:      PASSED (0 mismatches)';
  RAISE NOTICE '';
  RAISE NOTICE 'Migration completed successfully.';
  RAISE NOTICE '';
  RAISE NOTICE '=== NEXT STEPS FOR SECTIONS 4-7 ===';
  RAISE NOTICE 'No schema changes needed. Just:';
  RAISE NOTICE '  1. INSERT INTO section_definitions (section_number=4, name=..., ...)';
  RAISE NOTICE '  2. Add section to src/config/sections.js';
  RAISE NOTICE '  3. Create src/components/ScreeningSection4/ component';
  RAISE NOTICE '  4. Register route in App.jsx';
END;
$$;

COMMIT;
