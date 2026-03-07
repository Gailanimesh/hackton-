-- Phase 4.1 Update: Vendor Preferences for Matching
-- Run this in Supabase SQL Editor

ALTER TABLE public.vendor_details
ADD COLUMN IF NOT EXISTS preferred_work_mode TEXT CHECK (preferred_work_mode IN ('remote', 'onsite', 'hybrid')),
ADD COLUMN IF NOT EXISTS service_tier TEXT CHECK (service_tier IN ('speed', 'quality')),
ADD COLUMN IF NOT EXISTS min_budget NUMERIC DEFAULT 0;
