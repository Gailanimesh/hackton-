-- AI Procurement Planner - Robust Supabase Setup
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Ensure the Role Type exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('manager', 'vendor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role user_role DEFAULT 'manager' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Vendor Specific table
CREATE TABLE IF NOT EXISTS public.vendor_details (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  bio TEXT,
  skills TEXT[], 
  cv_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_details ENABLE ROW LEVEL SECURITY;

-- 5. Robust Profile Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    COALESCE(new.raw_user_meta_data->>'role', 'manager')::user_role
  );
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
