-- Add column_order to projects
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'projects'
        AND column_name = 'column_order'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN column_order jsonb DEFAULT NULL;
    END IF;
END $$;
