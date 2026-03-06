-- Migration: Drop deprecated flat columns from screenings table
-- These columns are now stored in the normalized screening_sections table
-- Also handles dependent views that reference these columns

BEGIN;

-- Drop dependent view first (CASCADE will drop it automatically, but we'll recreate it)
DROP VIEW IF EXISTS patient_queue CASCADE;

-- Drop the deprecated section complete columns (they're now in screening_sections.is_complete)
ALTER TABLE screenings DROP COLUMN IF EXISTS section1_complete;
ALTER TABLE screenings DROP COLUMN IF EXISTS section2_complete;
ALTER TABLE screenings DROP COLUMN IF EXISTS section3_complete;
ALTER TABLE screenings DROP COLUMN IF EXISTS section4_complete;
ALTER TABLE screenings DROP COLUMN IF EXISTS section5_complete;
ALTER TABLE screenings DROP COLUMN IF EXISTS section6_complete;
ALTER TABLE screenings DROP COLUMN IF EXISTS section7_complete;

-- Drop the deprecated section data columns (they're now in screening_sections.section_data)
ALTER TABLE screenings DROP COLUMN IF EXISTS section1_data;
ALTER TABLE screenings DROP COLUMN IF EXISTS section2_data;
ALTER TABLE screenings DROP COLUMN IF EXISTS section3_data;
ALTER TABLE screenings DROP COLUMN IF EXISTS section4_data;
ALTER TABLE screenings DROP COLUMN IF EXISTS section5_data;
ALTER TABLE screenings DROP COLUMN IF EXISTS section6_data;
ALTER TABLE screenings DROP COLUMN IF EXISTS section7_data;

-- Recreate patient_queue view using normalized schema
-- This view shows patients in a cycle with their section completion status
CREATE OR REPLACE VIEW patient_queue AS
SELECT 
  s.id AS screening_id,
  s.child_id,
  s.cycle_id,
  s.status,
  s.screening_date,
  c.first_name,
  c.last_name,
  c.gender,
  c.birthdate,
  c.parent_name,
  -- Calculate section completion from screening_sections
  COALESCE(
    (SELECT COUNT(*) FROM screening_sections ss 
     WHERE ss.screening_id = s.id AND ss.is_complete = true AND ss.section_number = 1),
    0
  ) > 0 AS section1_complete,
  COALESCE(
    (SELECT COUNT(*) FROM screening_sections ss 
     WHERE ss.screening_id = s.id AND ss.is_complete = true AND ss.section_number = 2),
    0
  ) > 0 AS section2_complete,
  COALESCE(
    (SELECT COUNT(*) FROM screening_sections ss 
     WHERE ss.screening_id = s.id AND ss.is_complete = true AND ss.section_number = 3),
    0
  ) > 0 AS section3_complete,
  -- Calculate overall completion
  (
    SELECT COUNT(*) FROM screening_sections ss 
    WHERE ss.screening_id = s.id AND ss.is_complete = true
  ) AS completed_sections_count,
  (
    SELECT COUNT(*) FROM screening_sections ss 
    WHERE ss.screening_id = s.id
  ) AS total_sections_count
FROM screenings s
JOIN children c ON s.child_id = c.id;

COMMIT;

-- Verify the cleanup
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'screenings' 
-- ORDER BY ordinal_position;
