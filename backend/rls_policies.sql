-- 🚨 RUN THIS IN SUPABASE SQL EDITOR 🚨
-- This grants necessary permissions for our backend API to perform inserts/updates

DROP POLICY IF EXISTS "Enable all for profiles" ON public.profiles;
CREATE POLICY "Enable all for profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for vendor_details" ON public.vendor_details;
CREATE POLICY "Enable all for vendor_details" ON public.vendor_details FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for invitations" ON public.invitations;
CREATE POLICY "Enable all for invitations" ON public.invitations FOR ALL USING (true) WITH CHECK (true);
