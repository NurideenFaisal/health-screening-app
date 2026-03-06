-- =============================================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- https://supabase.com/dashboard/project/klxhsbawtdcftfqirtcw/sql/new
--
-- This script:
--   1. Runs the data migration (flat columns → screening_sections)
--   2. Verifies integrity
--   3. Reports row counts per section
-- =============================================================================

BEGIN;

-- ── Pre-flight ────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'screening_sections'
  ) THEN
    RAISE EXCEPTION 'screening_sections table does not exist. Run migration 20260304000002 first.';
  END IF;
  RAISE NOTICE 'Pre-flight checks passed.';
END;
$$;

-- ── Pre-migration counts ──────────────────────────────────────────────────────
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
  SELECT COUNT(*) INTO v_s1_with_data FROM public.screenings WHERE section1_data IS NOT NULL OR section1_complete = TRUE;
  SELECT COUNT(*) INTO v_s2_with_data FROM public.screenings WHERE section2_data IS NOT NULL OR section2_complete = TRUE;
  SELECT COUNT(*) INTO v_s3_with_data FROM public.screenings WHERE section3_data IS NOT NULL OR section3_complete = TRUE;

  RAISE NOTICE '=== PRE-MIGRATION REPORT ===';
  RAISE NOTICE 'Total screenings:               %', v_screening_count;
  RAISE NOTICE 'Existing screening_sections:    %', v_section_count_before;
  RAISE NOTICE 'Screenings with Section 1 data: %', v_s1_with_data;
  RAISE NOTICE 'Screenings with Section 2 data: %', v_s2_with_data;
  RAISE NOTICE 'Screenings with Section 3 data: %', v_s3_with_data;
END;
$$;

-- ── Migrate all 3 sections ────────────────────────────────────────────────────
DO $$
DECLARE
  v_s1_inserted BIGINT := 0;
  v_s2_inserted BIGINT := 0;
  v_s3_inserted BIGINT := 0;
  v_s1_eligible BIGINT;
  v_s2_eligible BIGINT;
  v_s3_eligible BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_s1_eligible FROM public.screenings WHERE section1_data IS NOT NULL OR section1_complete = TRUE;
  SELECT COUNT(*) INTO v_s2_eligible FROM public.screenings WHERE section2_data IS NOT NULL OR section2_complete = TRUE;
  SELECT COUNT(*) INTO v_s3_eligible FROM public.screenings WHERE section3_data IS NOT NULL OR section3_complete = TRUE;

  INSERT INTO public.screening_sections (screening_id, section_number, is_complete, section_data, completed_at, created_at, updated_at)
  SELECT s.id, 1, s.section1_complete, s.section1_data,
    CASE WHEN s.section1_complete = TRUE THEN s.updated_at ELSE NULL END,
    s.created_at, s.updated_at
  FROM public.screenings s
  WHERE s.section1_data IS NOT NULL OR s.section1_complete = TRUE
  ON CONFLICT (screening_id, section_number) DO NOTHING;
  GET DIAGNOSTICS v_s1_inserted = ROW_COUNT;

  INSERT INTO public.screening_sections (screening_id, section_number, is_complete, section_data, completed_at, created_at, updated_at)
  SELECT s.id, 2, s.section2_complete, s.section2_data,
    CASE WHEN s.section2_complete = TRUE THEN s.updated_at ELSE NULL END,
    s.created_at, s.updated_at
  FROM public.screenings s
  WHERE s.section2_data IS NOT NULL OR s.section2_complete = TRUE
  ON CONFLICT (screening_id, section_number) DO NOTHING;
  GET DIAGNOSTICS v_s2_inserted = ROW_COUNT;

  INSERT INTO public.screening_sections (screening_id, section_number, is_complete, section_data, completed_at, created_at, updated_at)
  SELECT s.id, 3, s.section3_complete, s.section3_data,
    CASE WHEN s.section3_complete = TRUE THEN s.updated_at ELSE NULL END,
    s.created_at, s.updated_at
  FROM public.screenings s
  WHERE s.section3_data IS NOT NULL OR s.section3_complete = TRUE
  ON CONFLICT (screening_id, section_number) DO NOTHING;
  GET DIAGNOSTICS v_s3_inserted = ROW_COUNT;

  RAISE NOTICE '=== MIGRATION RESULTS ===';
  RAISE NOTICE 'Section 1: % inserted, % skipped (already existed)', v_s1_inserted, v_s1_eligible - v_s1_inserted;
  RAISE NOTICE 'Section 2: % inserted, % skipped (already existed)', v_s2_inserted, v_s2_eligible - v_s2_inserted;
  RAISE NOTICE 'Section 3: % inserted, % skipped (already existed)', v_s3_inserted, v_s3_eligible - v_s3_inserted;
  RAISE NOTICE 'Total new rows: %', v_s1_inserted + v_s2_inserted + v_s3_inserted;
END;
$$;

-- ── Integrity check ───────────────────────────────────────────────────────────
DO $$
DECLARE
  v_mismatch_count BIGINT;
  v_total          BIGINT;
  v_s1             BIGINT;
  v_s2             BIGINT;
  v_s3             BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_s1 FROM public.screening_sections WHERE section_number = 1;
  SELECT COUNT(*) INTO v_s2 FROM public.screening_sections WHERE section_number = 2;
  SELECT COUNT(*) INTO v_s3 FROM public.screening_sections WHERE section_number = 3;
  SELECT COUNT(*) INTO v_total FROM public.screening_sections;

  SELECT COUNT(*) INTO v_mismatch_count
  FROM public.screenings s
  JOIN public.screening_sections ss ON ss.screening_id = s.id
  WHERE
    (ss.section_number = 1 AND ss.is_complete != s.section1_complete)
    OR (ss.section_number = 2 AND ss.is_complete != s.section2_complete)
    OR (ss.section_number = 3 AND ss.is_complete != s.section3_complete);

  IF v_mismatch_count > 0 THEN
    RAISE EXCEPTION 'Integrity check FAILED: % mismatches. Rolling back.', v_mismatch_count;
  END IF;

  RAISE NOTICE '=== POST-MIGRATION REPORT ===';
  RAISE NOTICE 'Section 1 rows: %', v_s1;
  RAISE NOTICE 'Section 2 rows: %', v_s2;
  RAISE NOTICE 'Section 3 rows: %', v_s3;
  RAISE NOTICE 'Total rows:     %', v_total;
  RAISE NOTICE 'Integrity check: PASSED';
  RAISE NOTICE 'Migration complete.';
END;
$$;

COMMIT;
