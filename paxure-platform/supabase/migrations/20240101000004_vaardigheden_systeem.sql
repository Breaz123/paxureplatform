-- Migration: Expand capaciteiten system with levels and link to opleidingen
-- This allows tracking good/average/poor skills and matching to training needs

-- Update profiles: change capaciteiten to 3 separate arrays for levels
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS capaciteiten;

-- Add capaciteiten columns separately to ensure they are created
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS capaciteiten_goed TEXT[] DEFAULT '{}';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS capaciteiten_gemiddeld TEXT[] DEFAULT '{}';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS capaciteiten_slecht TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.profiles.capaciteiten_goed IS 'Array van vaardigheden waar de medewerker goed in is';
COMMENT ON COLUMN public.profiles.capaciteiten_gemiddeld IS 'Array van vaardigheden waar de medewerker gemiddeld in is';
COMMENT ON COLUMN public.profiles.capaciteiten_slecht IS 'Array van vaardigheden waar de medewerker slecht in is of verbetering nodig heeft';

-- Add capaciteiten to opleidingen (what skills does this training cover)
ALTER TABLE public.opleidingen 
ADD COLUMN IF NOT EXISTS capaciteiten_vereist TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.opleidingen.capaciteiten_vereist IS 'Array van vaardigheden/capaciteiten die deze opleiding behandelt';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_opleiding_registraties_medewerker_op ON public.opleiding_registraties(medewerker_id, geregistreerd_op DESC);

