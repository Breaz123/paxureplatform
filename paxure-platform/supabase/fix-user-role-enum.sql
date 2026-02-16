-- Fix user_role enum by ensuring all required values exist
-- This script checks and adds missing enum values
-- IMPORTANT: Run each ALTER TYPE statement separately if you get transaction errors

-- First, check current enum values
SELECT 
  'Current enum values:' as info,
  string_agg(enumlabel, ', ' ORDER BY enumsortorder) as values
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

-- Add missing values one by one (PostgreSQL doesn't support IF NOT EXISTS for ALTER TYPE)
-- Only run the ALTER TYPE statements for values that don't exist

-- Check and add 'business_developer'
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'business_developer' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'business_developer';
  END IF;
END $$;

-- Check and add 'operationeel_verantwoordelijke'
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'operationeel_verantwoordelijke' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'operationeel_verantwoordelijke';
  END IF;
END $$;

-- Check and add 'coach'
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'coach' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'coach';
  END IF;
END $$;

-- Check and add 'hulpcoach'
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'hulpcoach' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'hulpcoach';
  END IF;
END $$;

-- Check and add 'maatwerker'
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'maatwerker' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'maatwerker';
  END IF;
END $$;

-- Check and add 'admin'
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'admin' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'admin';
  END IF;
END $$;

-- Verify all values are now present
SELECT 
  'Final enum values:' as info,
  string_agg(enumlabel, ', ' ORDER BY enumsortorder) as values
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

