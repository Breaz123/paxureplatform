# Quick Setup Guide - Supabase Database

Volg deze stappen om je Supabase database in te stellen.

## Stap 1: Database Schema Installeren

1. Ga naar je Supabase project dashboard
2. Klik op **SQL Editor** in het linker menu
3. Klik op **New query**
4. Open het bestand `scripts/setup-database.sql`
5. Kopieer de volledige inhoud
6. Plak in de SQL Editor
7. Klik op **Run** (of druk op Ctrl+Enter)
8. Wacht tot de query succesvol is uitgevoerd (je ziet "Success. No rows returned")

## Stap 2: Storage Bucket Aanmaken

1. Ga naar **Storage** in het Supabase dashboard
2. Klik op **New bucket**
3. Vul in:
   - **Name**: `docs`
   - **Public bucket**: **Uit** (niet aanvinken)
   - **File size limit**: Laat leeg of stel in naar wens (bijv. 50MB)
   - **Allowed MIME types**: Laat leeg of specificeer (bijv. `application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
4. Klik op **Create bucket**

## Stap 3: Storage Policies Installeren

1. Ga terug naar **SQL Editor**
2. Open het bestand `scripts/setup-storage-policies.sql`
3. Kopieer de volledige inhoud
4. Plak in de SQL Editor
5. Klik op **Run**

## Stap 4: Eerste Gebruiker Aanmaken

### Optie A: Via Supabase Dashboard

1. Ga naar **Authentication** → **Users**
2. Klik op **Add user** → **Create new user**
3. Vul in:
   - **Email**: je email adres
   - **Password**: een sterk wachtwoord
   - **Auto Confirm User**: Aan (vink aan)
4. Klik op **Create user**
5. Kopieer de **User UID** (je hebt deze nodig)

6. Ga naar **Table Editor** → **profiles**
7. Klik op **Insert** → **Insert row**
8. Vul in:
   - **id**: Plak de User UID die je net hebt gekopieerd
   - **email**: Je email adres
   - **full_name**: Je naam
   - **role**: `business_developer` (of een andere rol)
9. Klik op **Save**

### Optie B: Via SQL (Sneller)

1. Ga naar **SQL Editor**
2. Voer dit uit (vervang de email en naam):

```sql
-- Vervang 'jouw-email@voorbeeld.nl' met je eigen email
-- Vervang 'Je Naam' met je eigen naam
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  'Je Naam' as full_name,
  'business_developer'::user_role as role
FROM auth.users
WHERE email = 'jouw-email@voorbeeld.nl';
```

**Let op**: Je moet eerst een gebruiker aanmaken via Authentication voordat je dit SQL script kunt uitvoeren!

## Stap 5: Environment Variabelen Instellen

1. Ga naar je Supabase project dashboard
2. Klik op **Settings** → **API**
3. Kopieer de volgende waarden:
   - **Project URL** → Dit wordt `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Dit wordt `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → Dit wordt `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Geheim!)

4. Maak een `.env.local` bestand in de `paxure-platform` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STORAGE_BUCKET=docs
```

5. Vervang de waarden met je eigen Supabase credentials

## Stap 6: Testen

1. Start de development server:
```bash
cd paxure-platform
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000)
3. Je wordt doorgestuurd naar de login pagina
4. Log in met de gebruiker die je hebt aangemaakt
5. Je zou nu naar het dashboard moeten worden doorgestuurd!

## Problemen?

### "Missing Supabase environment variables"
- Controleer of `.env.local` bestaat en correct is ingevuld
- Herstart de development server na het toevoegen van environment variabelen

### "Relation does not exist"
- Het database schema is niet correct geïnstalleerd
- Voer `scripts/setup-database.sql` opnieuw uit

### "Bucket not found"
- Controleer of de bucket `docs` bestaat
- Verifieer de bucket naam in `.env.local`

### "Permission denied" bij file upload
- Controleer of storage policies zijn geïnstalleerd
- Verifieer dat je profiel de juiste rol heeft

## Volgende Stappen

Na setup:
1. ✅ Test alle modules
2. ✅ Voeg meer gebruikers toe
3. ✅ Upload test documenten
4. ✅ Maak een test weekplanning
5. ✅ Voeg test klanten toe

Zie `SETUP_CHECKLIST.md` voor een volledige checklist.

