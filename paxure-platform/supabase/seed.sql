-- Seed data voor development/testing
-- Dit bestand wordt alleen uitgevoerd in lokale development omgeving
-- Gebruik dit NIET in productie!

-- Let op: Dit script verwacht dat er al een gebruiker bestaat in auth.users
-- Maak eerst een gebruiker aan via Supabase Auth of gebruik:
-- supabase auth signup --email test@example.com --password testpassword

-- Voorbeeld: Eerste gebruiker profiel aanmaken
-- Vervang 'test@example.com' met je eigen email
-- INSERT INTO public.profiles (id, email, full_name, role)
-- SELECT 
--   id,
--   email,
--   'Test User' as full_name,
--   'business_developer'::user_role as role
-- FROM auth.users
-- WHERE email = 'test@example.com'
-- ON CONFLICT (id) DO UPDATE SET
--   email = EXCLUDED.email,
--   full_name = EXCLUDED.full_name,
--   role = EXCLUDED.role;

