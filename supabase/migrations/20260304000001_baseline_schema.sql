-- =============================================================================
-- Migration: 20260304000001_baseline_schema.sql
-- Description: Baseline schema snapshot of existing production tables.
--              This migration documents the current state of the database.
--              It is idempotent (uses IF NOT EXISTS / CREATE OR REPLACE).
--              DO NOT run this against a fresh DB that already has these tables.
-- Tables: profiles, cycles, children, screenings
-- Compatible with: PostgreSQL 15 (Supabase default)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- EXTENSIONS (already enabled in Supabase by default)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: profiles
-- Linked 1:1 to auth.users via id (UUID).
-- Stores role and section assignment for each authenticated user.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  role        TEXT        NOT NULL DEFAULT 'clinician'
                          CHECK (role IN ('admin', 'clinician')),
  section     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS
  'User profile linked to Supabase Auth. Stores role and section assignment.';
COMMENT ON COLUMN public.profiles.role IS
  'admin = full access; clinician = restricted to assigned section';
COMMENT ON COLUMN public.profiles.section IS
  'Section number assigned to clinician (1-7). NULL for admins.';

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_select_own') THEN
    CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_update_own') THEN
    CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_admin_select_all') THEN
    CREATE POLICY "profiles_admin_select_all" ON public.profiles FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: auto-create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, section)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'clinician'),
    NEW.raw_user_meta_data->>'section'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: cycles
-- Represents a screening cycle (e.g. "2025 Annual Screening").
-- Only one cycle can be active at a time (enforced by application logic).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cycles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cycles IS
  'Screening cycles. Only one cycle should be active at a time.';

-- Partial unique index: only one active cycle allowed
CREATE UNIQUE INDEX IF NOT EXISTS cycles_one_active
  ON public.cycles (is_active)
  WHERE is_active = TRUE;

-- RLS
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cycles' AND policyname='cycles_select_authenticated') THEN
    CREATE POLICY "cycles_select_authenticated" ON public.cycles FOR SELECT TO authenticated USING (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cycles' AND policyname='cycles_admin_all') THEN
    CREATE POLICY "cycles_admin_all" ON public.cycles FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS cycles_updated_at ON public.cycles;
CREATE TRIGGER cycles_updated_at
  BEFORE UPDATE ON public.cycles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: children
-- Patient registry. Each child has a unique child_code.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.children (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_code  TEXT        UNIQUE NOT NULL,
  first_name  TEXT        NOT NULL,
  last_name   TEXT        NOT NULL,
  birthdate   DATE,
  gender      CHAR(1)     CHECK (gender IN ('M', 'F')),
  community   TEXT,
  guardian    TEXT,
  contact     TEXT,
  created_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.children IS
  'Patient registry. Each child is uniquely identified by child_code.';
COMMENT ON COLUMN public.children.child_code IS
  'Human-readable unique identifier, e.g. GH0987-001';
COMMENT ON COLUMN public.children.gender IS
  'M = Male, F = Female';

-- Indexes
CREATE INDEX IF NOT EXISTS children_child_code_idx ON public.children (child_code);
CREATE INDEX IF NOT EXISTS children_created_by_idx ON public.children (created_by);
CREATE INDEX IF NOT EXISTS children_community_idx  ON public.children (community);

-- RLS
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='children' AND policyname='children_select_authenticated') THEN
    CREATE POLICY "children_select_authenticated" ON public.children FOR SELECT TO authenticated USING (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='children' AND policyname='children_insert_authenticated') THEN
    CREATE POLICY "children_insert_authenticated" ON public.children FOR INSERT TO authenticated WITH CHECK (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='children' AND policyname='children_update_admin') THEN
    CREATE POLICY "children_update_admin" ON public.children FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='children' AND policyname='children_delete_admin') THEN
    CREATE POLICY "children_delete_admin" ON public.children FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS children_updated_at ON public.children;
CREATE TRIGGER children_updated_at
  BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: screenings
-- One screening record per child per cycle.
-- Stores section completion flags and JSONB data blobs per section.
--
-- CURRENT STRUCTURE (flat columns per section):
--   section1_complete, section2_complete, section3_complete (BOOLEAN)
--   section1_data, section2_data, section3_data (JSONB)
--
-- NOTE: This flat structure is the CURRENT production schema.
--       Migration 0002 introduces a normalized alternative.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.screenings (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id            UUID        NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  cycle_id            UUID        NOT NULL REFERENCES public.cycles(id)   ON DELETE RESTRICT,

  -- Section completion flags (current flat structure)
  section1_complete   BOOLEAN     NOT NULL DEFAULT FALSE,
  section2_complete   BOOLEAN     NOT NULL DEFAULT FALSE,
  section3_complete   BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Section data blobs (JSONB — current flat structure)
  section1_data       JSONB,
  section2_data       JSONB,
  section3_data       JSONB,

  -- Audit
  created_by          UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by          UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Enforce one screening per child per cycle
  CONSTRAINT screenings_child_cycle_unique UNIQUE (child_id, cycle_id)
);

COMMENT ON TABLE public.screenings IS
  'One screening record per child per cycle. Tracks section completion and stores section data as JSONB.';

-- Indexes
CREATE INDEX IF NOT EXISTS screenings_child_id_idx   ON public.screenings (child_id);
CREATE INDEX IF NOT EXISTS screenings_cycle_id_idx   ON public.screenings (cycle_id);
CREATE INDEX IF NOT EXISTS screenings_created_by_idx ON public.screenings (created_by);

CREATE INDEX IF NOT EXISTS screenings_cycle_completion_idx
  ON public.screenings (cycle_id, section1_complete, section2_complete, section3_complete);

-- NOTE: GIN indexes on section_data JSONB columns are added in migration 0002
-- after those columns are created via ADD COLUMN IF NOT EXISTS.

-- RLS
ALTER TABLE public.screenings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='screenings' AND policyname='screenings_select_authenticated') THEN
    CREATE POLICY "screenings_select_authenticated" ON public.screenings FOR SELECT TO authenticated USING (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='screenings' AND policyname='screenings_insert_authenticated') THEN
    CREATE POLICY "screenings_insert_authenticated" ON public.screenings FOR INSERT TO authenticated WITH CHECK (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='screenings' AND policyname='screenings_update_own_section') THEN
    CREATE POLICY "screenings_update_own_section" ON public.screenings FOR UPDATE TO authenticated USING (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='screenings' AND policyname='screenings_delete_admin') THEN
    CREATE POLICY "screenings_delete_admin" ON public.screenings FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS screenings_updated_at ON public.screenings;
CREATE TRIGGER screenings_updated_at
  BEFORE UPDATE ON public.screenings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
