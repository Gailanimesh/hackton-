-- 📝 RFP & History Enhancement Migration

-- 1. Add RFP Rules to Projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS rfp_rules TEXT;

-- 2. Create Vendor History table
-- This stores past performance data for the AI to analyze during matching
CREATE TABLE IF NOT EXISTS public.vendor_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_name TEXT NOT NULL,
  category TEXT, -- e.g. 'Software', 'Logistics'
  success_rate INT CHECK (success_rate >= 0 AND success_rate <= 100),
  completion_date TIMESTAMPTZ DEFAULT now(),
  feedback_summary TEXT
);

-- 3. Mock Data for History (Optional, for demo)
-- I will add a few entries manually if needed for the judge's demo
