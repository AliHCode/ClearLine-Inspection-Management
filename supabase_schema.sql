-- Supabase SQL Schema for ClearLine Inspections

-- 1. Create Users Table (extends Supabase Auth)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  name text,
  role text CHECK (role IN ('contractor', 'consultant')),
  company text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create RFIs Table
CREATE TABLE public.rfis (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_no integer NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  inspection_type text NOT NULL,
  filed_by uuid REFERENCES public.profiles(id) NOT NULL,
  filed_date date NOT NULL,
  original_filed_date date NOT NULL,
  status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamp with time zone,
  remarks text,
  carryover_count integer DEFAULT 0,
  carryover_to date,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfis ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can read profiles
CREATE POLICY "Profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
-- Profiles: Users can insert their own profile on signup
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Profiles: Users can update their own profile
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RFIs: Anyone authenticated can read all RFIs (Consultants need to see all, Contractors might want to see team's)
CREATE POLICY "RFIs are viewable by authenticated users." ON public.rfis FOR SELECT USING (auth.role() = 'authenticated');
-- RFIs: Contractors can insert RFIs
CREATE POLICY "Contractors can insert RFIs." ON public.rfis FOR INSERT WITH CHECK (auth.uid() = filed_by);
-- RFIs: Consultants can update (approve/reject) RFIs, Contractors can update to resubmit
CREATE POLICY "Authenticated users can update RFIs." ON public.rfis FOR UPDATE USING (auth.role() = 'authenticated');
-- RFIs: Contractors can delete their own RFIs if pending
CREATE POLICY "Contractors can delete own pending RFIs." ON public.rfis FOR DELETE USING (auth.uid() = filed_by AND status = 'pending');

-- 4. Enable Realtime on RFIs
alter publication supabase_realtime add table public.rfis;
