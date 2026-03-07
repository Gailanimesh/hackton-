-- 🚨 RUN THIS IN SUPABASE SQL EDITOR 🚨
-- This adds the necessary columns to store AI matching data in your invitations

ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS match_score INT;

ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS fit_analysis TEXT;
