-- =============================================================================
-- Migration: 20260304000002_normalized_screening_sections.sql
-- Description: Introduces a normalized, scalable relational structure for
--              screening sections. Replaces the flat section1/2/3 columns
--              with a dedicated screening_sections table.
--
-- DESIGN RATIONALE:
--   Current flat schema has N boolean + N JSONB columns per section.
--   Adding Section 4-7 requires ALTER TABLE on a production table.
--   The normalized approach stores each section as a row — adding a new
--   section requires zero schema changes.
--
-- NEW TABLES:
--   section_definitions  — master list of sections (replaces sections.js config)
--   screening_sections   — one row per (screening_id, section_number)
--
-- BACKWARD COMPATIBILITY:
--   The original screenings table columns (section1_complete, section1_data, …)
--   are PRESERVED. A compatibility view (v_screening_status) is provided so
--   existing queries continue to work during the transition period.
--
-- MULTI-CLINIC SCALABILITY:
--   clinics table added for future multi-clinic support.
--   cycles and children gain an optional clinic_id FK.
--
-- SAFETY:
--   All changes are additive (no DROP, no ALTER COLUMN TYPE).
--   Existing data is untouched by this migration.
--   Data migration is in a separate script: scripts/migrate_sections_data.sql
--
-- Compatible with: PostgreSQL 15 (Supabase default)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- PREREQUISITE: Ensure handle_updated_at() function exists
-- (Defined in migration 0001, but re-declared here for safety since
--  migration 0001 was applied via history repair, not execution)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: clinics
-- Future multi-clinic support. Currently optional (nullable FK).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clinics (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  code        TEXT        UNIQUE NOT NULL,
  address     TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.clinics IS
  'Clinic registry for multi-clinic support. Currently optional.';

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='clinics' AND policyname='clinics_select_authenticated') THEN
    CREATE POLICY "clinics_select_authenticated" ON public.clinics FOR SELECT TO authenticated USING (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='clinics' AND policyname='clinics_admin_all') THEN
    CREATE POLICY "clinics_admin_all" ON public.clinics FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS clinics_updated_at ON public.clinics;
CREATE TRIGGER clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Add section_data JSONB columns to screenings (backward-compatible)
-- The production screenings table has section1_complete/2/3 boolean columns
-- but not the JSONB data columns. We add them here as nullable columns.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.screenings
  ADD COLUMN IF NOT EXISTS section1_data JSONB,
  ADD COLUMN IF NOT EXISTS section2_data JSONB,
  ADD COLUMN IF NOT EXISTS section3_data JSONB;

COMMENT ON COLUMN public.screenings.section1_data IS
  'JSONB blob for Section 1 (Vitals, Immunization, Development). Populated by data migration.';
COMMENT ON COLUMN public.screenings.section2_data IS
  'JSONB blob for Section 2 (Laboratory Investigations). Populated by data migration.';
COMMENT ON COLUMN public.screenings.section3_data IS
  'JSONB blob for Section 3 (Summary & Diagnosis). Populated by data migration.';

-- GIN indexes for JSONB search on screenings flat columns
CREATE INDEX IF NOT EXISTS screenings_section1_data_gin ON public.screenings USING GIN (section1_data);
CREATE INDEX IF NOT EXISTS screenings_section2_data_gin ON public.screenings USING GIN (section2_data);
CREATE INDEX IF NOT EXISTS screenings_section3_data_gin ON public.screenings USING GIN (section3_data);

-- ─────────────────────────────────────────────────────────────────────────────
-- Add clinic_id to cycles (nullable, backward-compatible)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.cycles
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.cycles.clinic_id IS
  'Optional clinic association for multi-clinic deployments.';

CREATE INDEX IF NOT EXISTS cycles_clinic_id_idx ON public.cycles (clinic_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Add clinic_id to children (nullable, backward-compatible)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.children.clinic_id IS
  'Optional clinic association for multi-clinic deployments.';

CREATE INDEX IF NOT EXISTS children_clinic_id_idx ON public.children (clinic_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: section_definitions
-- Master registry of all screening sections.
-- This is the database-side equivalent of src/config/sections.js.
-- Allows adding new sections without code changes.
-- ─────────────────────────────────────────────────────────────────────────────
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

COMMENT ON TABLE public.section_definitions IS
  'Master registry of screening sections. Database-side equivalent of src/config/sections.js.';
COMMENT ON COLUMN public.section_definitions.tabs_config IS
  'JSONB array of tab definitions: [{label, path}]. Empty array = single-page section.';

CREATE INDEX IF NOT EXISTS section_definitions_order_idx
  ON public.section_definitions (display_order, section_number);

ALTER TABLE public.section_definitions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='section_definitions' AND policyname='section_definitions_select_authenticated') THEN
    CREATE POLICY "section_definitions_select_authenticated"
      ON public.section_definitions FOR SELECT TO authenticated USING (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='section_definitions' AND policyname='section_definitions_admin_all') THEN
    CREATE POLICY "section_definitions_admin_all"
      ON public.section_definitions FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS section_definitions_updated_at ON public.section_definitions;
CREATE TRIGGER section_definitions_updated_at
  BEFORE UPDATE ON public.section_definitions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed the 3 existing sections (idempotent)
INSERT INTO public.section_definitions
  (section_number, name, short_name, description, color, display_order, tabs_config)
VALUES
  (
    1,
    'Vitals & Development',
    'S1',
    'Physical vitals, immunization records, and developmental assessment',
    'violet',
    1,
    '[{"label":"Vitals","path":"."},{"label":"Immunization","path":"immunization"},{"label":"Development","path":"development"}]'::JSONB
  ),
  (
    2,
    'Laboratory',
    'S2',
    'Laboratory investigations including CBC, blood group, urinalysis, and stool analysis',
    'sky',
    2,
    '[]'::JSONB
  ),
  (
    3,
    'Diagnosis',
    'S3',
    'Summary findings, diagnosis, treatment given, and referral recommendations',
    'amber',
    3,
    '[]'::JSONB
  )
ON CONFLICT (section_number) DO UPDATE SET
  name          = EXCLUDED.name,
  short_name    = EXCLUDED.short_name,
  description   = EXCLUDED.description,
  color         = EXCLUDED.color,
  display_order = EXCLUDED.display_order,
  tabs_config   = EXCLUDED.tabs_config,
  updated_at    = NOW();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: screening_sections
-- Core normalized table. One row per (screening, section).
-- Replaces the flat section1_complete / section1_data columns.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.screening_sections (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_id    UUID        NOT NULL REFERENCES public.screenings(id) ON DELETE CASCADE,
  section_number  SMALLINT    NOT NULL REFERENCES public.section_definitions(section_number)
                              ON DELETE RESTRICT,

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

COMMENT ON TABLE public.screening_sections IS
  'Normalized screening section data. One row per (screening_id, section_number). '
  'Replaces flat section1_complete/section1_data columns in screenings table.';

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS screening_sections_screening_id_idx
  ON public.screening_sections (screening_id);

CREATE INDEX IF NOT EXISTS screening_sections_section_number_idx
  ON public.screening_sections (section_number);

CREATE INDEX IF NOT EXISTS screening_sections_incomplete_idx
  ON public.screening_sections (section_number, is_complete)
  WHERE is_complete = FALSE;

CREATE INDEX IF NOT EXISTS screening_sections_completed_at_idx
  ON public.screening_sections (completed_at DESC NULLS LAST)
  WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS screening_sections_data_gin
  ON public.screening_sections USING GIN (section_data);

CREATE INDEX IF NOT EXISTS screening_sections_completed_by_idx
  ON public.screening_sections (completed_by)
  WHERE completed_by IS NOT NULL;

-- ── RLS ──────────────────────────────────────────────────────────────────────
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

-- ── Trigger: auto-set completed_at ───────────────────────────────────────────
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

DROP TRIGGER IF EXISTS screening_sections_insert_updated_at ON public.screening_sections;
CREATE TRIGGER screening_sections_insert_updated_at
  BEFORE INSERT ON public.screening_sections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEW: v_screening_status
-- Backward-compatible view that presents the new normalized structure
-- in the same shape as the old flat screenings columns.
-- ─────────────────────────────────────────────────────────────────────────────
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
    WHERE sec.screening_id = s.id
      AND sec.is_complete = TRUE
      AND sd.is_active = TRUE
  ) AS completed_section_count,

  (SELECT COUNT(*) FROM public.section_definitions WHERE is_active = TRUE)
    AS total_section_count

FROM public.screenings s
LEFT JOIN public.screening_sections ss1 ON ss1.screening_id = s.id AND ss1.section_number = 1
LEFT JOIN public.screening_sections ss2 ON ss2.screening_id = s.id AND ss2.section_number = 2
LEFT JOIN public.screening_sections ss3 ON ss3.screening_id = s.id AND ss3.section_number = 3
LEFT JOIN public.screening_sections ss4 ON ss4.screening_id = s.id AND ss4.section_number = 4
LEFT JOIN public.screening_sections ss5 ON ss5.screening_id = s.id AND ss5.section_number = 5
LEFT JOIN public.screening_sections ss6 ON ss6.screening_id = s.id AND ss6.section_number = 6
LEFT JOIN public.screening_sections ss7 ON ss7.screening_id = s.id AND ss7.section_number = 7;

COMMENT ON VIEW public.v_screening_status IS
  'Backward-compatible view presenting normalized screening_sections data '
  'in the flat column format of the original screenings table.';

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: get_cycle_queue(p_cycle_id UUID, p_section_number SMALLINT)
-- Returns the patient queue for a given cycle and section.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_cycle_queue(
  p_cycle_id      UUID,
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
    c.id            AS child_id,
    c.child_code,
    c.first_name,
    c.last_name,
    c.gender,
    c.birthdate,
    c.community,
    s.id            AS screening_id,
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
  JOIN public.screenings s
    ON s.child_id = c.id AND s.cycle_id = p_cycle_id
  LEFT JOIN public.screening_sections ss
    ON ss.screening_id = s.id AND ss.section_number = p_section_number
  ORDER BY
    COALESCE(ss.is_complete, FALSE) ASC,
    c.last_name ASC,
    c.first_name ASC;
$$;

COMMENT ON FUNCTION public.get_cycle_queue IS
  'Returns the patient queue for a given cycle and section.';

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: upsert_screening_section(...)
-- Upserts a screening section record. Creates the parent screenings row
-- if it does not exist. Atomic operation.
-- ─────────────────────────────────────────────────────────────────────────────
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
  VALUES (
    v_screening_id, p_section_number, p_section_data, p_is_complete,
    auth.uid(), auth.uid()
  )
  ON CONFLICT (screening_id, section_number) DO UPDATE SET
    section_data   = EXCLUDED.section_data,
    is_complete    = EXCLUDED.is_complete,
    updated_by     = auth.uid(),
    updated_at     = NOW(),
    completed_at   = CASE
      WHEN EXCLUDED.is_complete = TRUE AND screening_sections.is_complete = FALSE
        THEN NOW()
      WHEN EXCLUDED.is_complete = FALSE
        THEN NULL
      ELSE screening_sections.completed_at
    END,
    completed_by   = CASE
      WHEN EXCLUDED.is_complete = TRUE AND screening_sections.is_complete = FALSE
        THEN auth.uid()
      ELSE screening_sections.completed_by
    END
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.upsert_screening_section IS
  'Atomically creates or updates a screening section. '
  'Creates the parent screenings row if needed.';
