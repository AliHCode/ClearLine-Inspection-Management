-- Run this in Supabase SQL Editor to enable one export format per project

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'projects'
          AND column_name = 'export_template'
    ) THEN
        ALTER TABLE public.projects
        ADD COLUMN export_template jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;
