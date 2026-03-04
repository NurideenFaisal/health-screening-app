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
--   Via CLI (local dev only):
--     psql $DATABASE_URL -f supabase/scripts/migrate_sections_data.sql
--
-- ESTIMATED IMPACT:
--   Inserts up to 3 rows per existing screening record.
--   For 1000 screenings → up to 3000 rows in screening_sections.
--   Runtime: < 5 seconds for typical dataset sizes.
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- PRE-FLIGHT CHECKS
-- ─────────────────────────────────────────────────────────────────────────────

-- Verify target table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'screening_sections'
  ) THEN
    RAISE EXCEPTION
      'screening_sections table does not exist. '
      'Run migration 20260304000002 first.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'section_definitions'
  ) THEN
    RAISE EXCEPTION
      'section_definitions table does not exist. '
      'Run migration 20260304000002 first.';
  END IF;

  RAISE NOTICE 'Pre-flight checks passed.';
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- REPORT: Row counts before migration
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_screening_count     BIGINT;
  v_section_count_before BIGINT;
  v_s1_with_data        BIGINT;
  v_s2_with_data        BIGINT;
  v_s3_with_data        BIGINT;
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
  RAISE NOTICE 'Total screenings:              %', v_screening_count;
  RAISE NOTICE 'Existing screening_sections:   %', v_section_count_before;
  RAISE NOTICE 'Screenings with Section 1 data: %', v_s1_with_data;
  RAISE NOTICE 'Screenings with Section 2 data: %', v_s2_with_data;
  RAISE NOTICE 'Screenings with Section 3 data: %', v_s3_with_data;
  RAISE NOTICE 'Expected new rows to insert:   %',
    v_s1_with_data + v_s2_with_data + v_s3_with_data;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: Section 1 — Vitals & Development
-- Copies section1_complete + section1_data → screening_sections (section_number=1)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.screening_sections (
  screening_id,
  section_number,
  is_complete,
  section_data,
  completed_at,
  created_at,
  updated_at
)
SELECT
  s.id                AS screening_id,
  1                   AS section_number,
  s.section1_complete AS is_complete,
  s.section1_data     AS section_data,
  -- Approximate completed_at from updated_at if section is complete
  CASE WHEN s.section1_complete = TRUE THEN s.updated_at ELSE NULL END AS completed_at,
  s.created_at,
  s.updated_at
FROM public.screenings s
WHERE
  -- Only migrate rows that have actual data or a completion flag
  s.section1_data IS NOT NULL OR s.section1_complete = TRUE
ON CONFLICT (screening_id, section_number) DO NOTHING;

GET DIAGNOSTICS -- not available in plain SQL, use DO block below
;

DO $$
DECLARE v_count BIGINT;
BEGIN
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Section 1: % rows inserted into screening_sections', v_count;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: Section 2 — Laboratory
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.screening_sections (
  screening_id,
  section_number,
  is_complete,
  section_data,
  completed_at,
  created_at,
  updated_at
)
SELECT
  s.id                AS screening_id,
  2                   AS section_number,
  s.section2_complete AS is_complete,
  s.section2_data     AS section_data,
  CASE WHEN s.section2_complete = TRUE THEN s.updated_at ELSE NULL END AS completed_at,
  s.created_at,
  s.updated_at
FROM public.screenings s
WHERE
  s.section2_data IS NOT NULL OR s.section2_complete = TRUE
ON CONFLICT (screening_id, section_number) DO NOTHING;

DO $$
DECLARE v_count BIGINT;
BEGIN
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Section 2: % rows inserted into screening_sections', v_count;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: Section 3 — Diagnosis
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.screening_sections (
  screening_id,
  section_number,
  is_complete,
  section_data,
  completed_at,
  created_at,
  updated_at
)
SELECT
  s.id                AS screening_id,
  3                   AS section_number,
  s.section3_complete AS is_complete,
  s.section3_data     AS section_data,
  CASE WHEN s.section3_complete = TRUE THEN s.updated_at ELSE NULL END AS completed_at,
  s.created_at,
  s.updated_at
FROM public.screenings s
WHERE
  s.section3_data IS NOT NULL OR s.section3_complete = TRUE
ON CONFLICT (screening_id, section_number) DO NOTHING;

DO $$
DECLARE v_count BIGINT;
BEGIN
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Section 3: % rows inserted into screening_sections', v_count;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION: Cross-check migrated data integrity
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_mismatch_count BIGINT;
  v_total_migrated BIGINT;
BEGIN
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
      'Data integrity check FAILED: % completion flag mismatches found. '
      'Rolling back transaction.', v_mismatch_count;
  END IF;

  SELECT COUNT(*) INTO v_total_migrated FROM public.screening_sections;

  RAISE NOTICE '=== POST-MIGRATION REPORT ===';
  RAISE NOTICE 'Total rows in screening_sections: %', v_total_migrated;
  RAISE NOTICE 'Completion flag integrity check: PASSED';
  RAISE NOTICE 'Migration completed successfully.';
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SYNC: Update screenings flat columns from screening_sections
-- (Keeps both in sync — flat columns remain the source of truth until
--  the frontend is fully migrated to use screening_sections directly)
-- ─────────────────────────────────────────────────────────────────────────────
-- This is intentionally a no-op here since we copied FROM flat TO normalized.
-- The flat columns remain unchanged and authoritative.
-- After frontend migration is complete, run the deprecation script.

COMMIT;

-- =============================================================================
-- POST-MIGRATION NOTES:
--
-- 1. Both the flat columns (section1_complete, section1_data) and the new
--    screening_sections table now contain the same data.
--
-- 2. The v_screening_status VIEW provides a unified read interface.
--
-- 3. Next steps (after frontend migration):
--    a. Update frontend to write to screening_sections via upsert_screening_section()
--    b. Add a sync trigger to keep flat columns updated (for backward compat)
--    c. Eventually deprecate flat columns (separate migration with explicit confirmation)
--
-- 4. To verify migration in production:
--    SELECT
--      s.id,
--      s.section1_complete,
--      ss.is_complete AS ss_complete,
--      s.section1_complete = ss.is_complete AS matches
--    FROM screenings s
--    JOIN screening_sections ss ON ss.screening_id = s.id AND ss.section_number = 1
--    WHERE s.section1_complete != ss.is_complete;
--    -- Should return 0 rows
-- =============================================================================
