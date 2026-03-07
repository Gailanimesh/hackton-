-- Phase 5 & 6: AI Marketplace & Execution Hub Updates
-- Run this in Supabase SQL Editor

-- 1. Subtasks Tracking Enhancement
-- Allows vendors to check off milestones in the War Room
ALTER TABLE public.subtasks 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed'));

-- 2. Invitations Table (Phase 5: Bid & Invite Loop)
-- Tracks when a manager invites a vendor to a project
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(project_id, vendor_id) -- A vendor can only be invited once per project
);

-- 3. Messages Table (Phase 6: Project War Room)
-- Simple 1-on-1 chat log between Manager and Vendor
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Disable RLS for the hackathon prototype to allow fast backend/frontend access
-- (In a real app, you would set up policies here)
ALTER TABLE public.invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
