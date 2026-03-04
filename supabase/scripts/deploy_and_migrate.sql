-- =============================================================================
-- COMBINED DEPLOY SCRIPT: deploy_and_migrate.sql
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- 
-- This script:
--   1. Applies migration 0002 (normalized screening_sections)
--   2. Runs the data migration (flat columns → screening_sections)
--   3. Reports row counts and verification results
--
-- SAFE TO RUN: Fully idempotent. Uses IF NOT EXISTS / ON CONFLICT DO NOTHING.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- PART 1: MIGRATION 0002 — Normalized Screening Sections
-- ─────────────────────────────────────────────────────────────────────────────

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Shared updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── clinics ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clinics (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  code        TEXT        UNIQUE NOT NULL,
  address     TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='clinics' AND policyname='clinics_select_authenticated'
  ) THEN
    CREATE POLICY "clinics_select_authenticated" ON public.clinics FOR SELECT TO authenticated USING (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='clinics' AND policyname='clinics_admin_all'
  ) THEN
    CREATE POLICY "clinics_admin_all" ON public.clinics FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS clinics_updated_at ON public.clinics;
CREATE TRIGGER clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Add clinic_id to cycles (nullable, backward-compatible) ──────────────────
ALTER TABLE public.cycles   ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS cycles_clinic_id_idx   ON public.cycles   (clinic_id);
CREATE INDEX IF NOT EXISTS children_clinic_id_idx ON public.children (clinic_id);

-- ── section_definitions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.section_definitions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_number  SMALLINT    NOT NULL UNIQUE CHECK (section_number BETWEEN 1 AND 10),
  name            TEXT        NOT NULL,
  short_name      TEXT        NOT NULL,
  description     TEXT,
  color           TEXT        NOT NULL DEFAULT 'emerald',
  display_order   SMALLINT    NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  tabs_config     JSONB       NOT NULL DEFAULT '[]'::JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS section_definitions_order_idx
  ON public.section_definitions (display_order, section_number);

ALTER TABLE public.section_definitions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='section_definitions' AND policyname='section_definitions_select_authenticated'
  ) THEN
    CREATE POLICY "section_definitions_select_authenticated"
      ON public.section_definitions FOR SELECT TO authenticated USING (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='section_definitions' AND policyname='section_definitions_admin_all'
  ) THEN
    CREATE POLICY "section_definitions_admin_all"
      ON public.section_definitions FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS section_definitions_updated_at ON public.section_definitions;
CREATE TRIGGER section_definitions_updated_at
  BEFORE UPDATE ON public.section_definitions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed sections 1–3 (idempotent)
INSERT INTO public.section_definitions
  (section_number, name, short_name, description, color, display_order, tabs_config)
VALUES
  (1, 'Vitals & Development', 'S1',
   'Physical vitals, immunization records, and developmental assessment',
   'violet', 1,
   '[{"label":"Vitals","path":"."},{"label":"Immunization","path":"immunization"},{"label":"Development","path":"development"}]'::JSONB),
  (2, 'Laboratory', 'S2',
   'Laboratory investigations including CBC, blood group, urinalysis, and stool analysis',
   'sky', 2, '[]'::JSONB),
  (3, 'Diagnosis', 'S3',
   'Summary findings, diagnosis, treatment given, and referral recommendations',
   'amber', 3, '[]'::JSONB)
ON CONFLICT (section_number) DO UPDATE SET
  name          = EXCLUDED.name,
  short_name    = EXCLUDED.short_name,
  description   = EXCLUDED.description,
  color         = EXCLUDED.color,
  display_order = EXCLUDED.display_order,
  tabs_config   = EXCLUDED.tabs_config,
  updated_at    = NOW();

-- ── screening_sections ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.screening_sections (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_id    UUID        NOT NULL REFERENCES public.screenings(id) ON DELETE CASCADE,
  section_number  SMALLINT    NOT NULL REFERENCES public.section_definitions(section_number) ON DELETE RESTRICT,
  is_complete     BOOLEAN     NOT NULL DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,
  completed_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  section_data    JSONB,
  created_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT screening_sections_unique UNIQUE (screening_id, section_number)
);

CREATE INDEX IF NOT EXISTS screening_sections_screening_id_idx  ON public.screening_sections (screening_id);
CREATE INDEX IF NOT EXISTS screening_sections_section_number_idx ON public.screening_sections (section_number);
CREATE INDEX IF NOT EXISTS screening_sections_incomplete_idx
  ON public.screening_sections (section_number, is_complete) WHERE is_complete = FALSE;
CREATE INDEX IF NOT EXISTS screening_sections_completed_at_idx
  ON public.screening_sections (completed_at DESC NULLS LAST) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS screening_sections_data_gin
  ON public.screening_sections USING GIN (section_data);
CREATE INDEX IF NOT EXISTS screening_sections_completed_by_idx
  ON public.screening_sections (completed_by) WHERE completed_by IS NOT NULL;

ALTER TABLE public.screening_sections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='screening_sections' AND policyname='screening_sections_select_authenticated') THEN
    CREATE POLICY "screening_sections_select_authenticated"
      ON public.screening_sections FOR SELECT TO authenticated USING (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='screening_sections' AND policyname='screening_sections_insert_authenticated') THEN
    CREATE POLICY "screening_sections_insert_authenticated"
      ON public.screening_sections FOR INSERT TO authenticated WITH CHECK (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='screening_sections' AND policyname='screening_sections_update_own_section') THEN
    CREATE POLICY "screening_sections_update_own_section"
      ON public.screening_sections FOR UPDATE TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
        OR
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role = 'clinician'
            AND p.section::SMALLINT = screening_sections.section_number
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='screening_sections' AND policyname='screening_sections_delete_admin') THEN
    CREATE POLICY "screening_sections_delete_admin"
      ON public.screening_sections FOR DELETE
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

-- Completion trigger
CREATE OR REPLACE FUNCTION public.handle_section_completion()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_complete = TRUE AND (OLD.is_complete = FALSE OR OLD.is_complete IS NULL) THEN
    NEW.completed_at = NOW();
    NEW.completed_by = auth.uid();
  END IF;
  IF NEW.is_complete = FALSE AND OLD.is_complete = TRUE THEN
    NEW.completed_at = NULL;
  END IF;
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS screening_sections_completion ON public.screening_sections;
CREATE TRIGGER screening_sections_completion
  BEFORE UPDATE ON public.screening_sections
  FOR EACH ROW EXECUTE FUNCTION public.handle_section_completion();

-- ── v_screening_status view ───────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_screening_status AS
SELECT
  s.id                AS screening_id,
  s.child_id,
  s.cycle_id,
  s.created_at,
  s.updated_at,
  COALESCE(ss1.is_complete, FALSE)  AS section1_complete,
  ss1.section_data                  AS section1_data,
  ss1.completed_at                  AS section1_completed_at,
  ss1.completed_by                  AS section1_completed_by,
  COALESCE(ss2.is_complete, FALSE)  AS section2_complete,
  ss2.section_data                  AS section2_data,
  ss2.completed_at                  AS section2_completed_at,
  ss2.completed_by                  AS section2_completed_by,
  COALESCE(ss3.is_complete, FALSE)  AS section3_complete,
  ss3.section_data                  AS section3_data,
  ss3.completed_at                  AS section3_completed_at,
  ss3.completed_by                  AS section3_completed_by,
  COALESCE(ss4.is_complete, FALSE)  AS section4_complete,
  ss4.section_data                  AS section4_data,
  COALESCE(ss5.is_complete, FALSE)  AS section5_complete,
  ss5.section_data                  AS section5_data,
  COALESCE(ss6.is_complete, FALSE)  AS section6_complete,
  ss6.section_data                  AS section6_data,
  COALESCE(ss7.is_complete, FALSE)  AS section7_complete,
  ss7.section_data                  AS section7_data,
  (
    SELECT BOOL_AND(COALESCE(sec.is_complete, FALSE))
    FROM public.section_definitions sd
    LEFT JOIN public.screening_sections sec
      ON sec.screening_id = s.id AND sec.section_number = sd.section_number
    WHERE sd.is_active = TRUE
  ) AS all_sections_complete,
  (
    SELECT COUNT(*)
    FROM public.screening_sections sec
    JOIN public.section_definitions sd ON sd.section_number = sec.section_number
    WHERE sec.screening_id = s.id AND sec.is_complete = TRUE AND sd.is_active = TRUE
  ) AS completed_section_count,
  (SELECT COUNT(*) FROM public.section_definitions WHERE is_active = TRUE) AS total_section_count
FROM public.screenings s
LEFT JOIN public.screening_sections ss1 ON ss1.screening_id = s.id AND ss1.section_number = 1
LEFT JOIN public.screening_sections ss2 ON ss2.screening_id = s.id AND ss2.section_number = 2
LEFT JOIN public.screening_sections ss3 ON ss3.screening_id = s.id AND ss3.section_number = 3
LEFT JOIN public.screening_sections ss4 ON ss4.screening_id = s.id AND ss4.section_number = 4
LEFT JOIN public.screening_sections ss5 ON ss5.screening_id = s.id AND ss5.section_number = 5
LEFT JOIN public.screening_sections ss6 ON ss6.screening_id = s.id AND ss6.section_number = 6
LEFT JOIN public.screening_sections ss7 ON ss7.screening_id = s.id AND ss7.section_number = 7;

-- ── get_cycle_queue function ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_cycle_queue(
  p_cycle_id       UUID,
  p_section_number SMALLINT
)
RETURNS TABLE (
  child_id        UUID,
  child_code      TEXT,
  first_name      TEXT,
  last_name       TEXT,
  gender          CHAR(1),
  birthdate       DATE,
  community       TEXT,
  screening_id    UUID,
  is_complete     BOOLEAN,
  section_data    JSONB,
  completed_at    TIMESTAMPTZ,
  all_complete    BOOLEAN
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    c.id, c.child_code, c.first_name, c.last_name, c.gender, c.birthdate, c.community,
    s.id AS screening_id,
    COALESCE(ss.is_complete, FALSE) AS is_complete,
    ss.section_data,
    ss.completed_at,
    (
      SELECT BOOL_AND(COALESCE(sec.is_complete, FALSE))
      FROM public.section_definitions sd
      LEFT JOIN public.screening_sections sec
        ON sec.screening_id = s.id AND sec.section_number = sd.section_number
      WHERE sd.is_active = TRUE
    ) AS all_complete
  FROM public.children c
  JOIN public.screenings s ON s.child_id = c.id AND s.cycle_id = p_cycle_id
  LEFT JOIN public.screening_sections ss
    ON ss.screening_id = s.id AND ss.section_number = p_section_number
  ORDER BY COALESCE(ss.is_complete, FALSE) ASC, c.last_name ASC, c.first_name ASC;
$$;

-- ── upsert_screening_section function ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.upsert_screening_section(
  p_child_id       UUID,
  p_cycle_id       UUID,
  p_section_number SMALLINT,
  p_section_data   JSONB,
  p_is_complete    BOOLEAN DEFAULT FALSE
)
RETURNS public.screening_sections
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_screening_id  UUID;
  v_result        public.screening_sections;
BEGIN
  INSERT INTO public.screenings (child_id, cycle_id, created_by)
  VALUES (p_child_id, p_cycle_id, auth.uid())
  ON CONFLICT (child_id, cycle_id) DO NOTHING;

  SELECT id INTO v_screening_id
  FROM public.screenings
  WHERE child_id = p_child_id AND cycle_id = p_cycle_id;

  INSERT INTO public.screening_sections (
    screening_id, section_number, section_data, is_complete, created_by, updated_by
  )
  VALUES (v_screening_id, p_section_number, p_section_data, p_is_complete, auth.uid(), auth.uid())
  ON CONFLICT (screening_id, section_number) DO UPDATE SET
    section_data   = EXCLUDED.section_data,
    is_complete    = EXCLUDED.is_complete,
    updated_by     = auth.uid(),
    updated_at     = NOW(),
    completed_at   = CASE
      WHEN EXCLUDED.is_complete = TRUE AND screening_sections.is_complete = FALSE THEN NOW()
      WHEN EXCLUDED.is_complete = FALSE THEN NULL
      ELSE screening_sections.completed_at
    END,
    completed_by   = CASE
      WHEN EXCLUDED.is_complete = TRUE AND screening_sections.is_complete = FALSE THEN auth.uid()
      ELSE screening_sections.completed_by
    END
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PART 2: DATA MIGRATION — Flat columns → screening_sections
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

-- Migrate Section 1
INSERT INTO public.screening_sections (screening_id, section_number, is_complete, section_data, completed_at, created_at, updated_at)
SELECT
  s.id, 1, s.section1_complete, s.section1_data,
  CASE WHEN s.section1_complete = TRUE THEN s.updated_at ELSE NULL END,
  s.created_at, s.updated_at
FROM public.screenings s
WHERE s.section1_data IS NOT NULL OR s.section1_complete = TRUE
ON CONFLICT (screening_id, section_number) DO NOTHING;

-- Migrate Section 2
INSERT INTO public.screening_sections (screening_id, section_number, is_complete, section_data, completed_at, created_at, updated_at)
SELECT
  s.id, 2, s.section2_complete, s.section2_data,
  CASE WHEN s.section2_complete = TRUE THEN s.updated_at ELSE NULL END,
  s.created_at, s.updated_at
FROM public.screenings s
WHERE s.section2_data IS NOT NULL OR s.section2_complete = TRUE
ON CONFLICT (screening_id, section_number) DO NOTHING;

-- Migrate Section 3
INSERT INTO public.screening_sections (screening_id, section_number, is_complete, section_data, completed_at, created_at, updated_at)
SELECT
  s.id, 3, s.section3_complete, s.section3_data,
  CASE WHEN s.section3_complete = TRUE THEN s.updated_at ELSE NULL END,
  s.created_at, s.updated_at
FROM public.screenings s
WHERE s.section3_data IS NOT NULL OR s.section3_complete = TRUE
ON CONFLICT (screening_id, section_number) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- PART 3: VERIFICATION REPORT
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_mismatch_count BIGINT;
  v_total_migrated BIGINT;
  v_s1_count       BIGINT;
  v_s2_count       BIGINT;
  v_s3_count       BIGINT;
  v_s1_skipped     BIGINT;
  v_s2_skipped     BIGINT;
  v_s3_skipped     BIGINT;
BEGIN
  -- Count migrated rows per section
  SELECT COUNT(*) INTO v_s1_count FROM public.screening_sections WHERE section_number = 1;
  SELECT COUNT(*) INTO v_s2_count FROM public.screening_sections WHERE section_number = 2;
  SELECT COUNT(*) INTO v_s3_count FROM public.screening_sections WHERE section_number = 3;
  SELECT COUNT(*) INTO v_total_migrated FROM public.screening_sections;

  -- Count conflicts skipped (rows that already existed)
  SELECT COUNT(*) INTO v_s1_skipped
  FROM public.screenings s
  JOIN public.screening_sections ss ON ss.screening_id = s.id AND ss.section_number = 1
  WHERE s.section1_data IS NOT NULL OR s.section1_complete = TRUE;

  SELECT COUNT(*) INTO v_s2_skipped
  FROM public.screenings s
  JOIN public.screening_sections ss ON ss.screening_id = s.id AND ss.section_number = 2
  WHERE s.section2_data IS NOT NULL OR s.section2_complete = TRUE;

  SELECT COUNT(*) INTO v_s3_skipped
  FROM public.screenings s
  JOIN public.screening_sections ss ON ss.screening_id = s.id AND ss.section_number = 3
  WHERE s.section3_data IS NOT NULL OR s.section3_complete = TRUE;

  -- Integrity check
  SELECT COUNT(*) INTO v_mismatch_count
  FROM public.screenings s
  JOIN public.screening_sections ss ON ss.screening_id = s.id
  WHERE
    (ss.section_number = 1 AND ss.is_complete != s.section1_complete)
    OR (ss.section_number = 2 AND ss.is_complete != s.section2_complete)
    OR (ss.section_number = 3 AND ss.is_complete != s.section3_complete);

  RAISE NOTICE '=== POST-MIGRATION STATUS REPORT ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Section 1 rows in screening_sections: %', v_s1_count;
  RAISE NOTICE 'Section 2 rows in screening_sections: %', v_s2_count;
  RAISE NOTICE 'Section 3 rows in screening_sections: %', v_s3_count;
  RAISE NOTICE 'Total rows migrated:                  %', v_total_migrated;
  RAISE NOTICE '';
  RAISE NOTICE 'Conflicts skipped (already existed):';
  RAISE NOTICE '  Section 1: % rows already present', v_s1_skipped;
  RAISE NOTICE '  Section 2: % rows already present', v_s2_skipped;
  RAISE NOTICE '  Section 3: % rows already present', v_s3_skipped;
  RAISE NOTICE '';

  IF v_mismatch_count > 0 THEN
    RAISE WARNING 'INTEGRITY CHECK FAILED: % completion flag mismatches!', v_mismatch_count;
  ELSE
    RAISE NOTICE 'Completion flag integrity check: PASSED (0 mismatches)';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '=== OBJECTS CREATED ===';
  RAISE NOTICE 'Tables:    clinics, section_definitions, screening_sections';
  RAISE NOTICE 'View:      v_screening_status (backward-compatible, sections 1-7)';
  RAISE NOTICE 'Functions: get_cycle_queue(), upsert_screening_section()';
  RAISE NOTICE 'Trigger:   handle_section_completion()';
  RAISE NOTICE '';
  RAISE NOTICE '=== NEXT STEPS FOR SECTIONS 4-7 ===';
  RAISE NOTICE 'No schema changes needed. Just:';
  RAISE NOTICE '  1. INSERT INTO section_definitions (section_number=4, name=..., ...)';
  RAISE NOTICE '  2. Add section to src/config/sections.js';
  RAISE NOTICE '  3. Create src/components/ScreeningSection4/ component';
  RAISE NOTICE '  4. Register route in App.jsx';
  RAISE NOTICE '';
  RAISE NOTICE 'Migration complete.';
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- QUICK VERIFICATION QUERIES (run these separately to confirm)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Section definitions
-- SELECT section_number, name, short_name, color, is_active FROM section_definitions ORDER BY section_number;

-- 2. Rows per section
-- SELECT section_number, COUNT(*) as rows, SUM(CASE WHEN is_complete THEN 1 ELSE 0 END) as completed
-- FROM screening_sections GROUP BY section_number ORDER BY section_number;

-- 3. View sample
-- SELECT * FROM v_screening_status LIMIT 5;

-- 4. Integrity cross-check (should return 0 rows)
-- SELECT s.id, s.section1_complete, ss.is_complete
-- FROM screenings s JOIN screening_sections ss ON ss.screening_id=s.id AND ss.section_number=1
-- WHERE s.section1_complete != ss.is_complete;
