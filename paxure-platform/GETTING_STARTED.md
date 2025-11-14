# Getting Started - Paxure Platform

## Snelle Start

> **💡 Tip**: Als je al een Supabase project hebt aangemaakt, gebruik dan de [QUICK_SETUP.md](./QUICK_SETUP.md) voor snellere instructies!

### Stap 1: Supabase Project Aanmaken

1. Ga naar [supabase.com](https://supabase.com) en maak een account
2. Klik op "New Project"
3. Vul project details in:
   - **Name**: Paxure Platform
   - **Database Password**: Genereer een sterk wachtwoord (bewaar dit!)
   - **Region**: Kies de dichtstbijzijnde regio
4. Wacht tot het project is aangemaakt (2-3 minuten)

### Stap 2: Database Schema Installeren

1. In je Supabase project, ga naar **SQL Editor**
2. Open het bestand `scripts/setup-database.sql` uit dit project
3. Kopieer alle SQL code
4. Plak in de SQL Editor
5. Klik op **Run** (of Ctrl+Enter)
6. Controleer of er geen errors zijn (je ziet "Success. No rows returned")

### Stap 3: Storage Bucket Aanmaken

1. Ga naar **Storage** in het Supabase dashboard
2. Klik op **New bucket**
3. Naam: `docs`
4. Public: **false** (aanbevolen)
5. Klik op **Create bucket**

### Stap 4: Storage Policies Toevoegen

Ga naar **Storage** → **Policies** en voeg de policies toe zoals beschreven in `SUPABASE_SETUP.md`

### Stap 5: Environment Variabelen

1. In je Supabase project, ga naar **Settings** → **API**
2. Kopieer de volgende waarden:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (let op: deze is secret!)

3. Maak een `.env.local` bestand in de `paxure-platform` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STORAGE_BUCKET=docs
```

### Stap 6: Dependencies Installeren

```bash
cd paxure-platform
npm install
```

### Stap 7: Development Server Starten

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

### Stap 8: Eerste Gebruiker Aanmaken

1. Ga naar [http://localhost:3000/login](http://localhost:3000/login)
2. Klik op "Sign up" (als je een sign-up pagina hebt) of maak handmatig een gebruiker aan in Supabase
3. Na het aanmaken, moet je een profiel aanmaken in de database:

Ga naar Supabase SQL Editor en voer uit:

```sql
-- Vervang 'jouw-email@voorbeeld.nl' met je eigen email
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) as full_name,
  'business_developer'::user_role as role
FROM auth.users
WHERE email = 'jouw-email@voorbeeld.nl';
```

Of gebruik de Supabase dashboard:
1. Ga naar **Table Editor** → **profiles**
2. Klik op **Insert** → **Insert row**
3. Vul in:
   - **id**: Kopieer de user ID uit **Authentication** → **Users**
   - **email**: Je email adres
   - **full_name**: Je naam
   - **role**: `business_developer` (of een andere rol)

### Stap 9: Testen

1. Log in op [http://localhost:3000/login](http://localhost:3000/login)
2. Je zou naar het dashboard moeten worden doorgestuurd
3. Test de verschillende modules:
   - Documenten uploaden
   - Weekplanning invullen
   - Opleiding aanmaken
   - etc.

## Veelvoorkomende Problemen

### "Invalid API key"
- Controleer of je `.env.local` bestand correct is
- Verifieer dat je de juiste keys hebt gekopieerd
- Herstart de development server na het toevoegen van env variabelen

### "Relation does not exist"
- Het database schema is niet correct geïnstalleerd
- Voer `supabase/schema.sql` opnieuw uit in SQL Editor

### "Bucket not found"
- Controleer of de bucket `docs` bestaat
- Verifieer de bucket naam in `.env.local`

### "Permission denied"
- Controleer RLS policies
- Verifieer dat je profiel de juiste rol heeft
- Check Storage policies voor file uploads

## Volgende Stappen

1. **Meer gebruikers toevoegen**: Maak gebruikers aan via Supabase Auth en voeg profielen toe
2. **Test data toevoegen**: Voeg documenten, klanten, opleidingen toe voor testing
3. **Customize**: Pas de styling en functionaliteit aan naar wens
4. **Deploy**: Zie README.md voor deployment instructies

## Hulp Nodig?

- Check de `README.md` voor algemene documentatie
- Bekijk `SUPABASE_SETUP.md` voor gedetailleerde Supabase configuratie
- Controleer de Supabase logs voor errors

