-- Check if verlof table exists and has correct structure
-- Run this to verify the verlof table was created correctly

-- Check if table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'verlof')
    THEN 'Verlof table EXISTS' 
    ELSE 'Verlof table DOES NOT EXIST - Run migration 20240101000009_add_verlof_systeem.sql'
  END as table_status;

-- If table exists, show structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'verlof'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'verlof';

-- Check policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'verlof';

-- Count verlof entries
SELECT 
  COUNT(*) as total_verlof_entries
FROM public.verlof;

