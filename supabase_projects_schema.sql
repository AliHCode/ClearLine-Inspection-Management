-- 5. Multi-Project Support Schema Updates

-- Create Projects Table
CREATE TABLE public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projects are viewable by all authenticated users." ON public.projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY " authenticated users can insert Projects." ON public.projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add project_id column to RFIs
ALTER TABLE public.rfis ADD COLUMN project_id uuid REFERENCES public.projects(id);

-- Wait! Since you already have some data or might have created users, let's create a default project
-- and assign any existing RFIs to it so they don't break.
INSERT INTO public.projects (id, name, description) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Default General Project', 'System generated default project')
ON CONFLICT DO NOTHING;

-- Set default for existing RFIs
UPDATE public.rfis SET project_id = '00000000-0000-0000-0000-000000000000' WHERE project_id IS NULL;

-- Now make it required for all future RFIs
ALTER TABLE public.rfis ALTER COLUMN project_id SET NOT NULL;

-- Also let's add a "current_project" field to user profiles so they remember their last selection
ALTER TABLE public.profiles ADD COLUMN current_project_id uuid REFERENCES public.projects(id);

-- Give everyone access to the default project to start
UPDATE public.profiles SET current_project_id = '00000000-0000-0000-0000-000000000000' WHERE current_project_id IS NULL;
