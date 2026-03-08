-- Migration: Project Messages / War Room Chat
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.project_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- Allow read access to anyone authenticated (could be tightened to project members)
CREATE POLICY "Enable read access for authenticated users" ON public.project_messages AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- Allow insert to anyone authenticated
CREATE POLICY "Enable insert for authenticated users" ON public.project_messages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
