-- Run this in your Supabase SQL Editor to support custom RFI column ordering

-- Add sort_order if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'project_fields'
        AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE public.project_fields ADD COLUMN sort_order integer DEFAULT 0;
    END IF;
END $$;
