-- Fix: Add parent_id column to rfis to support revision history
ALTER TABLE public.rfis
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.rfis(id) ON DELETE SET NULL;

-- Notify postgrest to reload its schema cache
NOTIFY pgrst, 'reload schema';