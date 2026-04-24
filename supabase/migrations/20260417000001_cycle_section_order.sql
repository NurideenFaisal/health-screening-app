-- =============================================================================
-- Migration: 20260417000001_cycle_section_order.sql
-- Description: Adds section ordering configuration to cycles table
--              Allows admins to customize section workflow per cycle
--
-- Compatible with: PostgreSQL 17 (remote database)
-- =============================================================================

-- Add section_order column to cycles (JSONB for flexible ordering)
ALTER TABLE public.cycles
ADD COLUMN IF NOT EXISTS section_order JSONB DEFAULT '[1,2,3,4]'::JSONB,
ADD COLUMN IF NOT EXISTS section_config JSONB DEFAULT '{}'::JSONB;

COMMENT ON COLUMN public.cycles.section_order IS 
  'Array of section numbers in the order they should be completed for PDF reports';
COMMENT ON COLUMN public.cycles.section_config IS 
  'JSONB config per section: { "1": { "required": true, "visible": true }, ... }';

-- Add updated_at trigger if not exists
DROP TRIGGER IF EXISTS cycles_updated_at ON public.cycles;
CREATE TRIGGER cycles_updated_at
  BEFORE UPDATE ON public.cycles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to get section order for a cycle
CREATE OR REPLACE FUNCTION public.get_cycle_section_order(p_cycle_id UUID)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(c.section_order, '[1,2,3,4]'::JSONB)
  FROM public.cycles c
  WHERE c.id = p_cycle_id;
$$;

-- Function to get PDF-ordered section data
CREATE OR REPLACE FUNCTION public.get_screening_pdf_data(
  p_child_id UUID,
  p_cycle_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_section_order JSONB;
  v_result JSONB := '{}'::JSONB;
  v_section_num_text TEXT;
BEGIN
  -- Get the section order for this cycle
  v_section_order := get_cycle_section_order(p_cycle_id);
  
  FOR v_section_num_text IN
    SELECT jsonb_array_elements_text(v_section_order)
  LOOP
    -- Fetch screening data for each section in order
    v_result := v_result || jsonb_build_object(
      'section_' || v_section_num_text,
      (
        SELECT ss.section_data
        FROM public.screenings s
        JOIN public.screening_sections ss
          ON ss.screening_id = s.id
        WHERE s.child_id = p_child_id
          AND s.cycle_id = p_cycle_id
          AND ss.section_number = v_section_num_text::SMALLINT
          AND ss.is_complete = TRUE
        ORDER BY ss.updated_at DESC
        LIMIT 1
      )
    );
  END LOOP;
  
  RETURN v_result;
END;
$$;
