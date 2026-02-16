-- Add werkdagen_per_week column to profiles table
-- This allows tracking how many days per week a medewerker works (e.g., 4/5, 3/5, etc.)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS werkdagen_per_week NUMERIC(3,2) DEFAULT 5.0
  CHECK (werkdagen_per_week >= 0 AND werkdagen_per_week <= 5);

-- Add comment
COMMENT ON COLUMN public.profiles.werkdagen_per_week IS 'Aantal werkdagen per week (bijv. 4.0 voor 4/5, 5.0 voor voltijd)';

