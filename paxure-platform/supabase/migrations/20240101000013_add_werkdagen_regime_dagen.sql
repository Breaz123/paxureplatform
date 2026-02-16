-- Add werkdagen_regime and werkdagen_dagen columns to profiles table
-- werkdagen_regime: Text description of the regime (e.g., "Ma-Vr", "Ma-Do", "Ma-Wo")
-- werkdagen_dagen: Array of days the medewerker works (e.g., ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag'])

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS werkdagen_regime TEXT,
  ADD COLUMN IF NOT EXISTS werkdagen_dagen TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add comments
COMMENT ON COLUMN public.profiles.werkdagen_regime IS 'Regime beschrijving (bijv. "Ma-Vr", "Ma-Do", "Ma-Wo")';
COMMENT ON COLUMN public.profiles.werkdagen_dagen IS 'Array van werkdagen (bijv. [''maandag'', ''dinsdag'', ''woensdag'', ''donderdag'', ''vrijdag''])';

