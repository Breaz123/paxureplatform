# 🚀 Supabase CLI Setup - Paxure Platform

Deze handleiding beschrijft hoe je het Paxure platform instelt met de **Supabase CLI**. Dit is de aanbevolen methode voor development en deployment.

## 📋 Vereisten

1. **Node.js 18+** geïnstalleerd (inclusief npm)
2. **Supabase account** en project aangemaakt
3. **Supabase CLI** wordt automatisch gedownload via `npx` (geen installatie nodig)

## 🔧 Stap 1: Supabase CLI Installeren

**Geen installatie nodig!** Supabase CLI kan direct worden gebruikt via `npx` zonder globale installatie.

### Verificatie
```bash
npx supabase --version
```

Dit toont de versie en download automatisch de CLI bij eerste gebruik.

> **Let op:** Supabase CLI ondersteunt geen `npm install -g supabase` meer. Gebruik altijd `npx supabase` of installeer via een package manager zoals Scoop (Windows) of Homebrew (macOS).

## 🔐 Stap 2: Inloggen bij Supabase

```bash
npx supabase login
```

Dit opent je browser om in te loggen. Na succesvol inloggen kun je je projecten beheren.

## 🔗 Stap 3: Project Linken

Link je lokale project aan je remote Supabase project:

```bash
cd paxure-platform
npx supabase link --project-ref <jouw-project-ref>
```

**Waar vind je je project reference ID?**
- Ga naar je Supabase Dashboard
- Settings → General
- Kopieer de **Reference ID**

Of gebruik het interactieve commando:
```bash
npx supabase link
```

## 📤 Stap 4: Database Migraties Pushen

Push alle database migraties naar je remote project:

```bash
npx supabase db push
```

Dit voert alle migraties uit in `supabase/migrations/`:
- ✅ Database schema (tabellen, types, functies)
- ✅ Row Level Security policies
- ✅ Triggers en functies
- ✅ Storage policies

## 📦 Stap 5: Storage Bucket Aanmaken

Maak de `docs` storage bucket aan:

```bash
npx supabase storage create docs --public false
```

Of via het Supabase Dashboard:
1. Ga naar **Storage**
2. Klik op **New bucket**
3. Naam: `docs`
4. Public: **UIT** (niet aanvinken)
5. Klik op **Create bucket**

## 👤 Stap 6: Eerste Gebruiker Aanmaken

### Optie A: Via CLI

```bash
npx supabase auth signup --email jouw@email.com --password jouwwachtwoord
```

### Optie B: Via Dashboard

1. Ga naar **Authentication** → **Users**
2. Klik op **Add user** → **Create new user**
3. Vul email en wachtwoord in
4. Vink **Auto Confirm User** aan
5. Klik op **Create user**

### Profiel Aanmaken

Na het aanmaken van de gebruiker, maak een profiel aan:

**Via SQL Editor:**
```sql
-- Vervang 'jouw@email.com' met je email
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  'Je Naam' as full_name,
  'business_developer'::user_role as role
FROM auth.users
WHERE email = 'jouw@email.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;
```

**Via Table Editor:**
1. Ga naar **Table Editor** → **profiles**
2. Klik op **Insert** → **Insert row**
3. Vul in:
   - **id**: User UID (van Authentication → Users)
   - **email**: Je email
   - **full_name**: Je naam
   - **role**: `business_developer`

## 🔑 Stap 7: Environment Variabelen

Haal je environment variabelen op:

```bash
npx supabase status --output env
```

Dit toont alle benodigde variabelen. Kopieer ze naar `.env.local`:

```bash
# Maak .env.local aan
cp env.template .env.local
```

Vul de waarden in:
- `NEXT_PUBLIC_SUPABASE_URL` - Je project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - anon public key
- `SUPABASE_SERVICE_ROLE_KEY` - service_role key (geheim!)
- `NEXT_PUBLIC_APP_URL` - http://localhost:3000
- `NEXT_PUBLIC_STORAGE_BUCKET` - docs

**Of haal ze handmatig op:**
1. Supabase Dashboard → Settings → API
2. Kopieer Project URL en keys

## 🎯 Automatische Setup (Aanbevolen)

Gebruik het setup script voor automatische setup:

### Windows (PowerShell)
```powershell
npm run supabase:setup
```

### macOS / Linux
```bash
npm run supabase:setup
```

Of handmatig:
```bash
# Windows
powershell -ExecutionPolicy Bypass -File scripts/setup-supabase.ps1

# macOS / Linux
bash scripts/setup-supabase.sh
```

## 📝 Handige Commando's

### Database
```bash
# Migraties pushen
npm run supabase:db:push

# Database resetten (lokaal)
npm run supabase:db:reset

# Nieuwe migratie aanmaken
npx supabase migration new <naam>
```

### Storage
```bash
# Bucket aanmaken
npm run supabase:storage:create

# Buckets lijsten
npx supabase storage ls

# Bestand uploaden
npx supabase storage upload docs <lokaal-pad> <remote-pad>
```

### Status & Info
```bash
# Status checken
npm run supabase:status

# Project info
npx supabase projects list
```

### Lokale Development
```bash
# Start lokale Supabase (Docker vereist)
npm run supabase:start

# Stop lokale Supabase
npm run supabase:stop
```

## 🧪 Testen

1. Start de development server:
```bash
npm run dev
```

2. Open http://localhost:3000

3. Log in met je aangemaakte gebruiker

## 🔄 Workflow

### Nieuwe Database Wijzigingen

1. Maak een nieuwe migratie:
```bash
npx supabase migration new <beschrijving>
```

2. Bewerk het migratie bestand in `supabase/migrations/`

3. Push naar remote:
```bash
npx supabase db push
```

### Storage Bestanden Beheren

```bash
# Upload
npx supabase storage upload docs ./lokaal/bestand.pdf bestand.pdf

# Download
npx supabase storage download docs bestand.pdf ./lokaal/

# Lijst
npx supabase storage ls docs
```

## ❌ Troubleshooting

### "Command not found: supabase"
- Gebruik `npx supabase` in plaats van globale installatie
- Controleer of npm/node correct geïnstalleerd is: `npm --version`

### "Not logged in"
```bash
npx supabase login
```

### "Project not linked"
```bash
npx supabase link --project-ref <project-ref>
```

### "Migration failed"
- Controleer de migratie bestanden op syntax errors
- Check Supabase logs in dashboard
- Gebruik `npx supabase db reset` (lokaal) om te testen

### "Bucket not found"
```bash
npx supabase storage create docs --public false
```

### Environment variabelen niet gevonden
```bash
npx supabase status --output env
```

## 📚 Meer Informatie

- [Supabase CLI Documentatie](https://supabase.com/docs/guides/cli)
- [Database Migraties](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Storage Management](https://supabase.com/docs/guides/storage)

## ✅ Checklist

- [ ] Supabase CLI beschikbaar via `npx supabase --version`
- [ ] Ingelogd bij Supabase (`npx supabase login`)
- [ ] Project gelinkt (`npx supabase link`)
- [ ] Migraties gepusht (`npx supabase db push`)
- [ ] Storage bucket `docs` aangemaakt
- [ ] Eerste gebruiker aangemaakt
- [ ] Profiel aangemaakt in `profiles` tabel
- [ ] `.env.local` geconfigureerd
- [ ] Development server gestart (`npm run dev`)
- [ ] Login getest

---

**Klaar!** Je platform is nu ingesteld met Supabase CLI. 🎉

