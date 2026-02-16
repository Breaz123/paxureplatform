-- Migration: Update weekplanning table to use new role structure
-- Changes: pickers -> pick, inpakkers -> pack, remove outbound/transport, add coaches/administratie

-- Add new columns
ALTER TABLE public.weekplanning 
  ADD COLUMN IF NOT EXISTS maandag_pick TEXT[],
  ADD COLUMN IF NOT EXISTS maandag_pack TEXT[],
  ADD COLUMN IF NOT EXISTS maandag_coaches TEXT[],
  ADD COLUMN IF NOT EXISTS maandag_administratie TEXT[],
  ADD COLUMN IF NOT EXISTS dinsdag_pick TEXT[],
  ADD COLUMN IF NOT EXISTS dinsdag_pack TEXT[],
  ADD COLUMN IF NOT EXISTS dinsdag_coaches TEXT[],
  ADD COLUMN IF NOT EXISTS dinsdag_administratie TEXT[],
  ADD COLUMN IF NOT EXISTS woensdag_pick TEXT[],
  ADD COLUMN IF NOT EXISTS woensdag_pack TEXT[],
  ADD COLUMN IF NOT EXISTS woensdag_coaches TEXT[],
  ADD COLUMN IF NOT EXISTS woensdag_administratie TEXT[],
  ADD COLUMN IF NOT EXISTS donderdag_pick TEXT[],
  ADD COLUMN IF NOT EXISTS donderdag_pack TEXT[],
  ADD COLUMN IF NOT EXISTS donderdag_coaches TEXT[],
  ADD COLUMN IF NOT EXISTS donderdag_administratie TEXT[],
  ADD COLUMN IF NOT EXISTS vrijdag_pick TEXT[],
  ADD COLUMN IF NOT EXISTS vrijdag_pack TEXT[],
  ADD COLUMN IF NOT EXISTS vrijdag_coaches TEXT[],
  ADD COLUMN IF NOT EXISTS vrijdag_administratie TEXT[];

-- Migrate existing data (map old columns to new)
-- pickers -> pick, inpakkers -> pack
UPDATE public.weekplanning SET
  maandag_pick = COALESCE(maandag_pickers, ARRAY[]::TEXT[]),
  maandag_pack = COALESCE(maandag_inpakkers, ARRAY[]::TEXT[]),
  dinsdag_pick = COALESCE(dinsdag_pickers, ARRAY[]::TEXT[]),
  dinsdag_pack = COALESCE(dinsdag_inpakkers, ARRAY[]::TEXT[]),
  woensdag_pick = COALESCE(woensdag_pickers, ARRAY[]::TEXT[]),
  woensdag_pack = COALESCE(woensdag_inpakkers, ARRAY[]::TEXT[]),
  donderdag_pick = COALESCE(donderdag_pickers, ARRAY[]::TEXT[]),
  donderdag_pack = COALESCE(donderdag_inpakkers, ARRAY[]::TEXT[]),
  vrijdag_pick = COALESCE(vrijdag_pickers, ARRAY[]::TEXT[]),
  vrijdag_pack = COALESCE(vrijdag_inpakkers, ARRAY[]::TEXT[])
WHERE maandag_pick IS NULL;

-- Note: Old columns (pickers, inpakkers, outbound, transport) are kept for backwards compatibility
-- They can be removed in a future migration after confirming all data is migrated

