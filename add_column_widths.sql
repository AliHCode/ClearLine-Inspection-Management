-- Run this in Supabase SQL Editor to enable per-column table width design

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'projects'
          AND column_name = 'column_widths'
    ) THEN
        ALTER TABLE public.projects
        ADD COLUMN column_widths jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;
