-- Script om eerste gebruiker profiel aan te maken
-- Gebruik dit NADAT je een gebruiker hebt aangemaakt via Authentication

-- Vervang 'jouw-email@voorbeeld.nl' met het email adres van de gebruiker
-- Vervang 'Je Naam' met de naam van de gebruiker
-- Vervang 'business_developer' met de gewenste rol:
--   - 'business_developer'
--   - 'operationeel_verantwoordelijke'
--   - 'coach'
--   - 'hulpcoach'
--   - 'maatwerker'

INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  'Je Naam' as full_name,
  'business_developer'::user_role as role
FROM auth.users
WHERE email = 'jouw-email@voorbeeld.nl'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

