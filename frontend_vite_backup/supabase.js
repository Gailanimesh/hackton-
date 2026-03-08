import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rrrcgzustdykpxutsohb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJycmNnenVzdGR5a3B4dXRzb2hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MDk2NjksImV4cCI6MjA4ODM4NTY2OX0.srATx09trq_Lt077pmqlAq8mfkQYD0Tr9YZTMJBYy-o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
