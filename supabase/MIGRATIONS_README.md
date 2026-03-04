# Supabase Schema Versioning — Health Screening App

> **Production medical system. Read this document fully before executing any migration.**

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Migration Overview](#2-migration-overview)
3. [Schema Analysis: Current vs Proposed](#3-schema-analysis-current-vs-proposed)
4. [Step-by-Step Deployment](#4-step-by-step-deployment)
5. [Data Migration](#5-data-migration)
6. [Rollback Strategy](#6-rollback-strategy)
7. [Adding Future Sections (4–7)](#7-adding-future-sections-47)
8. [Indexing Reference](#8-indexing-reference)
9. [Multi-Clinic Scaling](#9-multi-clinic-scaling)
10. [Verification Queries](#10-verification-queries)

---

## 1. Project Setup

### Prerequisites

- Node.js ≥ 18
- Supabase CLI (already in `devDependencies` as `supabase@^2.76.9`)
- Access to Supabase project: `klxhsbawtdcftfqirtcw`

### Initialize & Link

```bash
# 1. Supabase CLI is already initialized (supabase/config.toml exists)
# Verify:
npx supabase --version

# 2. Login to Supabase (one-time, opens browser)
npx supabase login

# 3. Link to production project
npx supabase link --project-ref klxhsbawtdcftfqirtcw

# 4. Verify link (should show project details)
npx supabase status
```

### Environment Variables

The `.env` file already contains:
```
VITE_SUPABASE_URL=https://klxhsbawtdcftfqirtcw.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

For CLI operations requiring the service role key, set:
```bash
# Windows CMD
set SUPABASE_DB_PASSWORD=<your-db-password>

# PowerShell
$env:SUPABASE_DB_PASSWORD="<your-db-password>"
```

---

## 2. Migration Overview

```
supabase/
├── config.toml                          ← Project config (project_id = klxhsbawtdcftfqirtcw)
├── migrations/
│   ├── 20260304000001_baseline_schema.sql          ← Existing schema snapshot
│   └── 20260304000002_normalized_screening_sections.sql  ← New normalized structure
└── scripts/
    ├── migrate_sections_data.sql        ← Data migration (flat → normalized)
    └── rollback_0002.sql                ← Rollback for migration 0002
```

### Migration 0001 — Baseline Schema

**Purpose:** Documents the existing production schema as code.  
**Tables:** `profiles`, `cycles`, `children`, `screenings`  
**Status:** Idempotent — safe to run against existing DB (uses `IF NOT EXISTS`)  
**Action required:** None if DB already exists. Run only on fresh environments.

### Migration 0002 — Normalized Screening Sections

**Purpose:** Introduces scalable relational structure for sections.  
**New objects:**
- `clinics` table (multi-clinic support)
- `section_definitions` table (master section registry)
- `screening_sections` table (normalized section data)
- `v_screening_status` view (backward-compatible)
- `get_cycle_queue()` function
- `upsert_screening_section()` function  
**Status:** Additive only — no existing columns modified or dropped.

---

## 3. Schema Analysis: Current vs Proposed

### Current Schema (Flat)

```sql
-- screenings table (current)
CREATE TABLE screenings (
  id                UUID PRIMARY KEY,
  child_id          UUID REFERENCES children(id),
  cycle_id          UUID REFERENCES cycles(id),
  section1_complete BOOLEAN DEFAULT FALSE,  -- ← flat flag
  section2_complete BOOLEAN DEFAULT FALSE,  -- ← flat flag
  section3_complete BOOLEAN DEFAULT FALSE,  -- ← flat flag
  section1_data     JSONB,                  -- ← flat blob
  section2_data     JSONB,                  -- ← flat blob
  section3_data     JSONB,                  -- ← flat blob
  ...
);
```

**Problems with flat schema:**
- Adding Section 4 requires `ALTER TABLE screenings ADD COLUMN section4_complete BOOLEAN`
- `ALTER TABLE` on a large production table can lock rows
- No audit trail per section (who completed it, when)
- Cannot query "all Section 2 records across cycles" efficiently
- Cannot enforce section-level RLS at the database layer

### Proposed Schema (Normalized)

```sql
-- section_definitions (master registry)
CREATE TABLE section_definitions (
  section_number  SMALLINT PRIMARY KEY,  -- 1, 2, 3, ... 7
  name            TEXT,                  -- 'Vitals & Development'
  tabs_config     JSONB,                 -- sub-tab configuration
  is_active       BOOLEAN,
  ...
);

-- screening_sections (one row per section per screening)
CREATE TABLE screening_sections (
  id              UUID PRIMARY KEY,
  screening_id    UUID REFERENCES screenings(id),
  section_number  SMALLINT REFERENCES section_definitions(section_number),
  is_complete     BOOLEAN DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,
  completed_by    UUID REFERENCES auth.users(id),
  section_data    JSONB,
  UNIQUE (screening_id, section_number)
);
```

**Benefits:**
| Feature | Flat Schema | Normalized Schema |
|---------|-------------|-------------------|
| Add Section 4 | `ALTER TABLE` (risky) | `INSERT INTO section_definitions` |
| Per-section audit | ❌ | ✅ `completed_at`, `completed_by` |
| Section-level RLS | ❌ | ✅ |
| Cross-cycle section queries | Slow | Fast (indexed) |
| Multi-clinic support | ❌ | ✅ via `clinics` table |
| Backward compatibility | N/A | ✅ via `v_screening_status` view |

### Data Flow Comparison

**Current (frontend writes directly):**
```javascript
// ClinicianScreeningData.jsx — current pattern
supabase.from('screenings')
  .select('id, section1_complete, section2_complete, section3_complete, ...')
  .eq('screenings.cycle_id', cycle.id)
```

**Proposed (via RPC function):**
```javascript
// Future pattern — zero schema changes needed for new sections
supabase.rpc('get_cycle_queue', {
  p_cycle_id: cycle.id,
  p_section_number: mySection
})
```

---

## 4. Step-by-Step Deployment

### Phase 1: Apply Migration 0002 (Safe — Additive Only)

> **This phase is safe to run in production. No existing data is modified.**

#### Option A: Via Supabase Dashboard (Recommended for Production)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/klxhsbawtdcftfqirtcw)
2. Navigate to **SQL Editor**
3. Open `supabase/migrations/20260304000002_normalized_screening_sections.sql`
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **Run**
7. Verify: no errors, check "Results" tab

#### Option B: Via Supabase CLI (Linked Project)

```bash
# Push migration to linked remote project
npx supabase db push

# This applies all pending migrations in supabase/migrations/
# in chronological order (by filename timestamp)
```

#### Option C: Via psql (Direct Connection)

```bash
# Get connection string from Supabase Dashboard → Settings → Database
psql "postgresql://postgres:[PASSWORD]@db.klxhsbawtdcftfqirtcw.supabase.co:5432/postgres" \
  -f supabase/migrations/20260304000002_normalized_screening_sections.sql
```

### Phase 2: Verify Migration Applied

Run these verification queries in SQL Editor:

```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('clinics', 'section_definitions', 'screening_sections');
-- Expected: 3 rows

-- Check section_definitions seeded correctly
SELECT section_number, name, short_name, is_active FROM section_definitions ORDER BY section_number;
-- Expected: 3 rows (sections 1, 2, 3)

-- Check view exists
SELECT * FROM v_screening_status LIMIT 1;
-- Expected: no error

-- Check functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_cycle_queue', 'upsert_screening_section');
-- Expected: 2 rows
```

### Phase 3: Run Data Migration

> **⚠️ Take a database backup before this step.**

```bash
# Backup first (via Supabase Dashboard → Settings → Database → Backups)
# Or via CLI:
npx supabase db dump --linked > backup_before_data_migration_$(date +%Y%m%d).sql
```

Then run `supabase/scripts/migrate_sections_data.sql` in SQL Editor.

Expected output in NOTICES:
```
PRE-MIGRATION REPORT
Total screenings: [N]
Existing screening_sections: 0
Screenings with Section 1 data: [N1]
Screenings with Section 2 data: [N2]
Screenings with Section 3 data: [N3]
...
POST-MIGRATION REPORT
Total rows in screening_sections: [N1+N2+N3]
Completion flag integrity check: PASSED
Migration completed successfully.
```

---

## 5. Data Migration

### What the Script Does

The data migration script (`supabase/scripts/migrate_sections_data.sql`):

1. **Pre-flight checks** — verifies target tables exist
2. **Reports** row counts before migration
3. **Copies** Section 1 data: `section1_complete` + `section1_data` → `screening_sections` row with `section_number=1`
4. **Copies** Section 2 data: `section2_complete` + `section2_data` → `screening_sections` row with `section_number=2`
5. **Copies** Section 3 data: `section3_complete` + `section3_data` → `screening_sections` row with `section_number=3`
6. **Verifies** completion flags match between old and new tables
7. **Reports** final row counts

### Idempotency

The script uses `ON CONFLICT (screening_id, section_number) DO NOTHING` — safe to run multiple times.

### Data Integrity Guarantees

- Wrapped in a single `BEGIN/COMMIT` transaction
- Integrity check at the end — rolls back if any mismatch found
- Original flat columns are **never modified**

---

## 6. Rollback Strategy

### Rollback Migration 0002

Since migration 0002 is **purely additive**, rollback is straightforward:

```bash
# Step 1: Backup current state
npx supabase db dump --linked > backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql

# Step 2: Run rollback script in SQL Editor
# File: supabase/scripts/rollback_0002.sql
```

The rollback script:
1. Checks flat columns still have data (safety gate)
2. Drops `upsert_screening_section()` function
3. Drops `get_cycle_queue()` function
4. Drops `v_screening_status` view
5. Drops `screening_sections` table (CASCADE)
6. Drops `section_definitions` table
7. Removes `clinic_id` columns from `cycles` and `children`
8. Drops `clinics` table
9. Verifies `screenings` table is intact

**What is preserved after rollback:**
- `screenings` table with all flat columns intact
- `children`, `cycles`, `profiles` tables unchanged
- All existing data

### Rollback Decision Tree

```
Is migration 0002 applied?
├── NO → Nothing to rollback
└── YES
    ├── Has data migration (migrate_sections_data.sql) been run?
    │   ├── NO → Run rollback_0002.sql directly (safe)
    │   └── YES
    │       ├── Are flat columns still populated?
    │       │   ├── YES → Run rollback_0002.sql (safe — flat columns are source of truth)
    │       │   └── NO → STOP. Restore from backup first.
    └── Is frontend already writing to screening_sections?
        ├── NO → Run rollback_0002.sql (safe)
        └── YES → STOP. Must migrate data back to flat columns first.
```

---

## 7. Adding Future Sections (4–7)

With the normalized schema, adding a new section requires **zero schema changes**:

### Step 1: Add to section_definitions

```sql
-- In Supabase SQL Editor
INSERT INTO public.section_definitions
  (section_number, name, short_name, description, color, display_order, tabs_config)
VALUES
  (4, 'Dental', 'S4', 'Dental examination and oral health assessment', 'pink', 4, '[]');
```

### Step 2: Add to src/config/sections.js

```javascript
// Uncomment and customize in src/config/sections.js
{
  value: '4',
  label: 'Section 4',
  shortLabel: 'S4',
  title: 'Dental',
  color: 'pink',
  doneColor: 'bg-pink-400',
  tabs: [],
},
```

### Step 3: Create the section component

```
src/components/ScreeningSection4/
├── index.js
└── DentalExam.jsx
```

### Step 4: Register in App.jsx routing

That's it. No `ALTER TABLE`. No migration file needed for the schema.

---

## 8. Indexing Reference

### screening_sections Indexes

| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| `screening_sections_unique` | `(screening_id, section_number)` | UNIQUE | Enforce one row per section per screening |
| `screening_sections_screening_id_idx` | `screening_id` | BTREE | Get all sections for a screening |
| `screening_sections_section_number_idx` | `section_number` | BTREE | Get all records for a section type |
| `screening_sections_incomplete_idx` | `(section_number, is_complete) WHERE is_complete=FALSE` | PARTIAL | Clinician queue (most frequent query) |
| `screening_sections_completed_at_idx` | `completed_at DESC` | PARTIAL | Audit/reporting queries |
| `screening_sections_data_gin` | `section_data` | GIN | JSONB search (diagnosis lookup, etc.) |
| `screening_sections_completed_by_idx` | `completed_by` | PARTIAL | Per-clinician audit |

### screenings Indexes (existing + new)

| Index | Columns | Purpose |
|-------|---------|---------|
| `screenings_child_cycle_unique` | `(child_id, cycle_id)` | One screening per child per cycle |
| `screenings_cycle_completion_idx` | `(cycle_id, section1_complete, ...)` | Cycle dashboard queries |
| `screenings_section1_data_gin` | `section1_data` | JSONB search on flat columns |

---

## 9. Multi-Clinic Scaling

The `clinics` table is pre-created for future multi-clinic support.

### Current State (Single Clinic)

- `clinic_id` columns on `cycles` and `children` are nullable
- No clinic filtering in queries
- Application works exactly as before

### Future Multi-Clinic Activation

```sql
-- 1. Insert clinic records
INSERT INTO clinics (name, code) VALUES
  ('Benkrom Pentecost Centre', 'BPCY'),
  ('Accra Main Clinic', 'ACCRA-01');

-- 2. Assign existing data to default clinic
UPDATE children SET clinic_id = (SELECT id FROM clinics WHERE code = 'BPCY');
UPDATE cycles  SET clinic_id = (SELECT id FROM clinics WHERE code = 'BPCY');

-- 3. Add clinic_id to profiles for clinic-scoped admins
ALTER TABLE profiles ADD COLUMN clinic_id UUID REFERENCES clinics(id);

-- 4. Update RLS policies to filter by clinic_id
-- (separate migration required)
```

---

## 10. Verification Queries

Run these after each deployment step to verify correctness:

```sql
-- 1. Check all tables exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check section_definitions
SELECT * FROM section_definitions ORDER BY section_number;

-- 3. Check screening_sections row count matches expectations
SELECT
  section_number,
  COUNT(*) AS total_rows,
  SUM(CASE WHEN is_complete THEN 1 ELSE 0 END) AS completed_rows
FROM screening_sections
GROUP BY section_number
ORDER BY section_number;

-- 4. Cross-check: flat columns vs normalized (should return 0 rows)
SELECT s.id, s.section1_complete, ss.is_complete
FROM screenings s
JOIN screening_sections ss ON ss.screening_id = s.id AND ss.section_number = 1
WHERE s.section1_complete != ss.is_complete;

-- 5. Test the view
SELECT * FROM v_screening_status LIMIT 5;

-- 6. Test get_cycle_queue function
-- (replace with actual cycle_id from your cycles table)
SELECT * FROM get_cycle_queue(
  (SELECT id FROM cycles WHERE is_active = TRUE LIMIT 1),
  1::SMALLINT
) LIMIT 10;

-- 7. Check RLS policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 8. Check indexes
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('screening_sections', 'section_definitions', 'screenings')
ORDER BY tablename, indexname;
```

---

## Appendix: CLI Command Reference

```bash
# Initialize (already done)
npx supabase init

# Link to remote project
npx supabase link --project-ref klxhsbawtdcftfqirtcw

# Check status
npx supabase status

# Push all pending migrations to remote
npx supabase db push

# Pull remote schema to local (generates migration file)
npx supabase db pull

# Create a new migration file
npx supabase migration new <migration_name>

# List applied migrations
npx supabase migration list

# Dump remote database (backup)
npx supabase db dump --linked > backup_$(date +%Y%m%d_%H%M%S).sql

# Start local Supabase (for local dev/testing)
npx supabase start

# Stop local Supabase
npx supabase stop
```

---

*Last updated: 2026-03-04 | Project: klxhsbawtdcftfqirtcw*
