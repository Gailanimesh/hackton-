-- 🚨 FINAL PHASE: THE WAR ROOM 🚨
-- Run this in your Supabase SQL Editor to enable the subtask checklist!

-- 1. Add 'is_completed' column to subtasks so we can check them off
ALTER TABLE public.subtasks
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;

-- 2. Ensure project statuses can track active execution
-- (Supabase text fields don't need altering for new string values, but this is a good place to verify RLS)
-- Project statuses will flow: "draft" -> "matching" -> "active" -> "completed"
