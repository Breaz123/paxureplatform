# ⚡ Supabase CLI Setup - Snelle Start

## 🚀 Quick Setup (5 minuten)

### 1. Controleer Supabase CLI (geen installatie nodig!)
```bash
npx supabase --version
```
*Supabase CLI wordt automatisch gedownload via npx bij eerste gebruik*

### 2. Log in
```bash
npx supabase login
```

### 3. Link project
```bash
cd paxure-platform
npx supabase link --project-ref <jouw-project-ref>
```
*(Vind project-ref in: Supabase Dashboard → Settings → General)*

### 4. Push migraties
```bash
npx supabase db push
```

### 5. Maak storage bucket
```bash
npx supabase storage create docs --public false
```

### 6. Maak gebruiker
```bash
npx supabase auth signup --email jouw@email.com --password wachtwoord
```

### 7. Maak profiel (via SQL Editor)
```sql
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, 'Je Naam', 'business_developer'::user_role
FROM auth.users WHERE email = 'jouw@email.com';
```

### 8. Environment variabelen
```bash
npx supabase status --output env
```
Kopieer naar `.env.local` (gebruik `env.template` als basis)

### 9. Test
```bash
npm run dev
```

## 🎯 Of gebruik het automatische script:

```bash
npm run supabase:setup
```

## 📋 Handige Commando's

```bash
# Status checken
npm run supabase:status

# Migraties pushen
npm run supabase:db:push

# Storage bucket aanmaken
npm run supabase:storage:create
```

## 📖 Volledige instructies

Zie `SETUP_CLI.md` voor gedetailleerde uitleg.

