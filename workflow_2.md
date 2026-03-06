-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.children (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  child_code text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  gender text CHECK (gender = ANY (ARRAY['M'::text, 'F'::text])),
  birthdate date,
  created_by uuid,
  created_at timestamp without time zone DEFAULT now(),
  community text,
  clinic_id uuid,
  CONSTRAINT children_pkey PRIMARY KEY (id),
  CONSTRAINT children_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT children_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.clinics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT clinics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cycles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  clinic_id uuid,
  CONSTRAINT cycles_pkey PRIMARY KEY (id),
  CONSTRAINT cycles_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'clinician'::text CHECK (role = ANY (ARRAY['admin'::text, 'clinician'::text])),
  created_at timestamp without time zone DEFAULT now(),
  section text CHECK (section ~ '^\d+$'::text),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.screening_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  screening_id uuid NOT NULL,
  section_number smallint NOT NULL,
  is_complete boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  completed_by uuid,
  section_data jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT screening_sections_pkey PRIMARY KEY (id),
  CONSTRAINT screening_sections_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.screenings(id),
  CONSTRAINT screening_sections_section_number_fkey FOREIGN KEY (section_number) REFERENCES public.section_definitions(section_number),
  CONSTRAINT screening_sections_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES auth.users(id),
  CONSTRAINT screening_sections_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT screening_sections_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.screenings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  child_id uuid,
  created_by uuid,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'submitted'::text])),
  screening_date date,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  submitted_at timestamp without time zone,
  section1_json jsonb,
  section2_json jsonb,
  section3_json jsonb,
  section1_complete boolean NOT NULL DEFAULT false,
  section2_complete boolean NOT NULL DEFAULT false,
  section3_complete boolean NOT NULL DEFAULT false,
  section1_by uuid,
  section2_by uuid,
  section3_by uuid,
  section1_at timestamp with time zone,
  section2_at timestamp with time zone,
  section3_at timestamp with time zone,
  cycle_id uuid,
  section1_data jsonb,
  section2_data jsonb,
  section3_data jsonb,
  CONSTRAINT screenings_pkey PRIMARY KEY (id),
  CONSTRAINT screenings_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id),
  CONSTRAINT screenings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT screenings_section1_by_fkey FOREIGN KEY (section1_by) REFERENCES auth.users(id),
  CONSTRAINT screenings_section2_by_fkey FOREIGN KEY (section2_by) REFERENCES auth.users(id),
  CONSTRAINT screenings_section3_by_fkey FOREIGN KEY (section3_by) REFERENCES auth.users(id),
  CONSTRAINT screenings_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.cycles(id)
);
CREATE TABLE public.section_definitions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  section_number smallint NOT NULL UNIQUE CHECK (section_number >= 1 AND section_number <= 10),
  name text NOT NULL,
  short_name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT 'emerald'::text,
  display_order smallint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  tabs_config jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT section_definitions_pkey PRIMARY KEY (id)
);