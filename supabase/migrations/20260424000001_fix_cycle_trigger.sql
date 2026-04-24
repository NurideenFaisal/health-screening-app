-- =============================================================================
-- Migration: 20260424000001_fix_cycle_trigger.sql
-- Description: Fixes the cycles table trigger to use the correct function
--              Corrects reference from update_updated_at_column() to handle_updated_at()
--
-- Issue: Migration 20260417000001 referenced a function that didn't exist yet,
--        causing "record has no field updated_at" errors when toggling cycles
-- =============================================================================

-- Drop the broken trigger and recreate with correct function
DROP TRIGGER IF EXISTS cycles_updated_at ON public.cycles;

CREATE TRIGGER cycles_updated_at
  BEFORE UPDATE ON public.cycles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TRIGGER cycles_updated_at ON public.cycles IS
  'Auto-update the updated_at timestamp when cycles table is modified';
