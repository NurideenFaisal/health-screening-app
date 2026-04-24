-- =============================================================================
-- Migration: 20260425000001_add_cycles_updated_at.sql
-- Description: Adds missing updated_at column to cycles table and ensures trigger works
-- =============================================================================

-- Add updated_at column to cycles table if it doesn't exist
ALTER TABLE public.cycles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure the trigger function exists and works
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to ensure it works
DROP TRIGGER IF EXISTS cycles_updated_at ON public.cycles;
CREATE TRIGGER cycles_updated_at
  BEFORE UPDATE ON public.cycles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Update existing records to have updated_at set
UPDATE public.cycles 
SET updated_at = created_at 
WHERE updated_at IS NULL;