-- Sprint A: Project Configuration & Matching Update
-- Run this in Supabase SQL Editor

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS budget NUMERIC,
ADD COLUMN IF NOT EXISTS deadline DATE,
ADD COLUMN IF NOT EXISTS work_mode TEXT CHECK (work_mode IN ('remote', 'onsite', 'hybrid')),
ADD COLUMN IF NOT EXISTS service_tier TEXT CHECK (service_tier IN ('speed', 'quality')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'matching', 'execution', 'completed')),
ADD COLUMN IF NOT EXISTS selected_vendor_id UUID REFERENCES auth.users(id);

-- Also ensure vendor_details has the new columns we discussed earlier
ALTER TABLE public.vendor_details
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS vendor_domain TEXT;
