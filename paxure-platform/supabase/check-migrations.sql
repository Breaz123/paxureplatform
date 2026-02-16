-- Check which migrations have been applied
-- This script checks if the columns from migration 20240101000013 exist

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('werkdagen_regime', 'werkdagen_dagen')
ORDER BY column_name;

-- If no rows are returned, the migration has not been applied yet

