# Health Screening App

React + Vite frontend for a role-based child health screening system backed by Supabase Cloud.

This README has been updated against the linked live Supabase project, not just the old local migration notes.

## What This Project Does

The app supports three operational roles:

- `super-admin`: manages clinics and platform-wide users
- `admin`: manages users, cycles, and patient records inside a clinic
- `clinician`: enrolls patients and completes only the screening section assigned to that clinician

The core workflow is:

1. A clinic activates a screening cycle.
2. Patients are enrolled into the registry.
3. A screening record is created per child per cycle.
4. Each clinician completes their assigned section.
5. Section progress is stored in a normalized `screening_sections` table.
6. The UI builds queues, completion pills, and section routing from that backend state.

## Source Of Truth

The real backend is the linked Supabase Cloud project:

- Project name: `health-screening-mvp`
- Project ref: `klxhsbawtdcftfqirtcw`

Important: the local SQL files are useful history, but the live backend already contains additional fields and objects beyond the earliest migrations. The current app should be understood from the live cloud schema first.

## Stack

- React 19
- Vite 7
- Tailwind CSS 4
- Zustand for auth/session state
- TanStack Query for server state and caching
- Supabase Auth, PostgREST, RPCs, RLS, and Edge Functions

## Frontend Architecture

Main entry points:

- [src/main.jsx](src/main.jsx)
- [src/App.jsx](src/App.jsx)
- [src/store/authStore.js](src/store/authStore.js)
- [src/lib/supabase.js](src/lib/supabase.js)

Key frontend areas:

- `src/pages/ClinicianSide`
  Clinician dashboard, registry, queue, and section form shell
- `src/pages/AdminSide`
  Clinic admin dashboard, role management, patient data, and cycle management
- `src/pages/SuperAdminSide`
  Clinic registry and platform-level user management
- `src/components/ScreeningSection1`
  Section 1 tabs: Vitals, Immunization, Development
- `src/components/ScreeningSection2.jsx`
  Section 2 form
- `src/components/ScreeningSection3.jsx`
  Section 3 form
- `src/components/ScreeningSection4.jsx`
  Section 4 form

## How Auth Works

The frontend Supabase client in [src/lib/supabase.js](src/lib/supabase.js) is only the transport layer. The real authorization logic lives in:

- Supabase Auth
- `profiles` table
- Row Level Security policies
- RPCs and Edge Functions

Auth bootstrap flow:

1. `src/main.jsx` loads the current Supabase session.
2. It fetches the matching row from `profiles`.
3. Zustand stores `user`, `profile`, and the cached active cycle.
4. `RoleRoute` gates the route tree by role.

## Live Backend Model

The linked public schema currently exposes these main tables:

- `clinics`
- `profiles`
- `cycles`
- `children`
- `screenings`
- `screening_sections`
- `section_definitions`

It also exposes:

- View: `v_screening_status`
- RPCs:
  - `get_auth_profile()`
  - `get_cycle_queue(p_cycle_id, p_section_number)`
  - `upsert_screening_section(...)`

### Table Purpose

`clinics`

- Clinic registry for multi-clinic support
- Used heavily by super-admin and admin flows

`profiles`

- One row per authenticated user
- Holds `role`, `section`, and `clinic_id`
- This is the app’s role model

`cycles`

- Screening campaigns or collection periods
- Includes `is_active`
- Cached in Zustand and reused across clinician/admin flows

`children`

- Patient registry
- Holds `child_code`, demographics, and `clinic_id`

`screenings`

- Parent record for a child in a cycle
- Live backend includes fields such as `status`, `screening_date`, `submitted_at`, and `clinic_id`

`screening_sections`

- Normalized section storage
- One row per `(screening_id, section_number)`
- Holds `section_data`, `is_complete`, `completed_at`, and audit fields

`section_definitions`

- Registry of available sections and tab configuration
- Backend is designed to scale beyond hardcoded section columns

### Why `screening_sections` Matters

The project has moved away from the old `section1_data`, `section2_data`, etc. pattern.

Current intent:

- `screenings` is the parent record
- `screening_sections` stores each section as a row
- `upsert_screening_section` atomically creates or updates a section
- `v_screening_status` exists as a compatibility view for flatter reporting

This is the most important backend design decision in the app.

## How The Clinician Side Works

Main files:

- [src/pages/ClinicianSide/ClinicianDashboard.jsx](src/pages/ClinicianSide/ClinicianDashboard.jsx)
- [src/pages/ClinicianSide/ClinicianDashboardStats.jsx](src/pages/ClinicianSide/ClinicianDashboardStats.jsx)
- [src/pages/ClinicianSide/ClinicianPatientData.jsx](src/pages/ClinicianSide/ClinicianPatientData.jsx)
- [src/pages/ClinicianSide/ClinicianScreeningData.jsx](src/pages/ClinicianSide/ClinicianScreeningData.jsx)
- [src/pages/ClinicianSide/ClinicianScreeningForm.jsx](src/pages/ClinicianSide/ClinicianScreeningForm.jsx)
- [src/hooks/useClinicianScreeningBootstrap.js](src/hooks/useClinicianScreeningBootstrap.js)
- [src/hooks/useScreeningSection.js](src/hooks/useScreeningSection.js)

Clinician workflow:

1. Clinician logs in.
2. Assigned section is read from `profile.section`.
3. Queue page loads the active cycle and all screenings in that cycle.
4. Queue status is derived from `screening_sections.is_complete`.
5. Clicking a patient opens only the clinician’s assigned section route.
6. The section UI reads and writes through `useScreeningSection`.
7. Saves call the `upsert_screening_section` RPC.

Notes:

- Section 1 is tabbed across Vitals, Immunization, and Development.
- Section 2, 3, and 4 are separate routes/components.
- Local caching is used aggressively for queue and patient bootstrap.

## How The Admin Side Works

Main files:

- [src/pages/AdminSide/AdminDashboard.jsx](src/pages/AdminSide/AdminDashboard.jsx)
- [src/pages/AdminSide/DashboardStats.jsx](src/pages/AdminSide/DashboardStats.jsx)
- [src/pages/AdminSide/PeopleData.jsx](src/pages/AdminSide/PeopleData.jsx)
- [src/pages/AdminSide/RoleManagement.jsx](src/pages/AdminSide/RoleManagement.jsx)
- [src/pages/AdminSide/AdminCycleManager.jsx](src/pages/AdminSide/AdminCycleManager.jsx)

Admin responsibilities:

- Manage patients in the clinic
- Manage users and role assignments
- Assign clinicians to sections
- Create and activate cycles
- Review screening records

The codebase is in a transition state:

- some admin data flows are clinic-aware
- some older code paths still assume a simpler global model
- some role-management calls still use hardcoded function URLs

## How The Super Admin Side Works

Main files:

- [src/pages/SuperAdminSide/SuperAdminDashboard.jsx](src/pages/SuperAdminSide/SuperAdminDashboard.jsx)
- [src/pages/SuperAdminSide/ClinicRegistry.jsx](src/pages/SuperAdminSide/ClinicRegistry.jsx)
- [src/pages/SuperAdminSide/UserManagement.jsx](src/pages/SuperAdminSide/UserManagement.jsx)

Super-admin responsibilities:

- manage clinics
- create clinic admins
- view cross-clinic platform data

This aligns with the live backend’s `clinics` and `clinic_id` fields.

## Edge Functions

Local function present in the repo:

- `supabase/functions/create-user`

This function:

- validates the caller from the bearer token
- checks the caller’s role from `profiles`
- creates an auth user with the service role key
- relies on the profile trigger/user metadata flow
- updates `clinic_id` on the created profile when provided

The frontend also calls these hosted functions:

- `create-user`
- `reset-password`
- `delete-user`

Only `create-user` is present locally in this repo at the moment, so the README should not assume the others are fully versioned here.

## Important Hooks

`useActiveCycleQuery`

- reads the active cycle from Supabase
- syncs it into Zustand

`useClinicianScreeningBootstrap`

- loads patient snapshot
- loads active cycle
- preloads the clinician’s current section record

`useScreeningSection`

- queries one section row from `screening_sections`
- writes through `upsert_screening_section`
- invalidates queue and stats caches on save

`usePatientRegistry`

- clinic-aware patient registry hook
- super-admin sees global registry
- clinic admin is filtered by `clinic_id`

## Current Section Configuration

Frontend section config lives in:

- [src/config/sections.js](src/config/sections.js)

Current frontend-configured sections:

- Section 1: Vitals & Development
- Section 2: Laboratory
- Section 3: Diagnosis
- Section 4: Dental/Other

Backend note:

- the schema is generic enough for more sections
- the frontend still uses a local config file and route map
- the database also contains `section_definitions`, so there is clear intent to move toward backend-driven section metadata

## Environment

Required frontend env vars:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The frontend client still reads these variables from [src/lib/supabase.js](src/lib/supabase.js). That file is small on purpose; the business rules are not in the client constructor.

## Running The App

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Backend Inspection Notes

This README was updated using the linked Supabase Cloud backend rather than relying only on local SQL.

Live schema observations that matter:

- `profiles` includes `clinic_id`
- `screenings` includes `clinic_id`, `status`, `screening_date`, and `submitted_at`
- normalized storage is active through `screening_sections`
- compatibility/reporting support exists through `v_screening_status`

## Where To Look Next

If you need to understand the app quickly, read these in order:

1. [src/main.jsx](src/main.jsx)
2. [src/App.jsx](src/App.jsx)
3. [src/store/authStore.js](src/store/authStore.js)
4. [src/config/sections.js](src/config/sections.js)
5. [src/hooks/useScreeningSection.js](src/hooks/useScreeningSection.js)
6. [src/pages/ClinicianSide/ClinicianScreeningData.jsx](src/pages/ClinicianSide/ClinicianScreeningData.jsx)
7. [src/pages/ClinicianSide/ClinicianScreeningForm.jsx](src/pages/ClinicianSide/ClinicianScreeningForm.jsx)
8. [src/pages/AdminSide/RoleManagement.jsx](src/pages/AdminSide/RoleManagement.jsx)

## Caveats

The codebase currently mixes:

- newer normalized backend patterns
- older frontend assumptions
- some hardcoded hosted function URLs
- some local docs that were written before the live schema evolved

That means the linked cloud project should be treated as the real backend contract until the local schema, docs, and client utilities are fully reconciled.
