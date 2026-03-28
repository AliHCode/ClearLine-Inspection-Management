-- Add column_styles jsonb to projects
ALTER TABLE "public"."projects" ADD COLUMN IF NOT EXISTS "column_styles" jsonb DEFAULT '{}'::jsonb;
