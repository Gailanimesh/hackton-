-- AI Procurement Planner - Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- Missions
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mission_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE NOT NULL,
  project_name TEXT NOT NULL,
  description TEXT,
  required_technologies TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Subtasks
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  task_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- Policies: Backend uses service_role key (bypasses RLS).
-- These policies apply if using anon key from frontend.
DROP POLICY IF EXISTS "Users insert own missions" ON public.missions;
DROP POLICY IF EXISTS "Users select own missions" ON public.missions;
DROP POLICY IF EXISTS "Users insert projects for own missions" ON public.projects;
DROP POLICY IF EXISTS "Users select projects for own missions" ON public.projects;
DROP POLICY IF EXISTS "Users insert subtasks for own projects" ON public.subtasks;
DROP POLICY IF EXISTS "Users select subtasks for own projects" ON public.subtasks;
-- Policies: Backend uses service_role key (bypasses RLS).
CREATE POLICY "Users insert own missions" ON public.missions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users select own missions" ON public.missions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert projects for own missions" ON public.projects
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.missions WHERE id = mission_id AND user_id = auth.uid())
  );
CREATE POLICY "Users select projects for own missions" ON public.projects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.missions WHERE id = mission_id AND user_id = auth.uid())
  );
CREATE POLICY "Users insert subtasks for own projects" ON public.subtasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.missions m ON p.mission_id = m.id
      WHERE p.id = project_id AND m.user_id = auth.uid()
    )
  );
CREATE POLICY "Users select subtasks for own projects" ON public.subtasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.missions m ON p.mission_id = m.id
      WHERE p.id = project_id AND m.user_id = auth.uid()
    )
  );
