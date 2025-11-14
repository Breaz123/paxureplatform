# Supabase Setup - Stap voor Stap

Volg deze stappen exact in volgorde om je Paxure platform in te stellen.

## 📋 Stap 1: Database Schema Installeren

1. Open je Supabase project dashboard: https://supabase.com/dashboard
2. Selecteer je project
3. Ga naar **SQL Editor** in het linker menu
4. Klik op **New query** (of gebruik de bestaande editor)
5. Open het bestand `paxure-platform/scripts/setup-database.sql` in je editor
6. Kopieer de **volledige** inhoud van het bestand
7. Plak de SQL code in de Supabase SQL Editor
8. Klik op **Run** (of druk op `Ctrl+Enter` / `Cmd+Enter`)
9. Wacht tot de query succesvol is uitgevoerd
10. Je zou moeten zien: **"Success. No rows returned"** of een vergelijkbaar succesbericht

✅ **Check**: Controleer of er geen errors zijn. Als er errors zijn, lees ze zorgvuldig en los ze op.

---

## 📦 Stap 2: Storage Bucket Aanmaken

1. In het Supabase dashboard, ga naar **Storage** in het linker menu
2. Klik op **New bucket** (rechtsboven)
3. Vul de volgende gegevens in:
   - **Name**: `docs` (exact zoals hier, zonder aanhalingstekens)
   - **Public bucket**: **UIT** (niet aanvinken - dit is belangrijk voor beveiliging)
   - **File size limit**: Laat leeg of stel in naar wens (bijv. 52428800 voor 50MB)
   - **Allowed MIME types**: Laat leeg (of specificeer als je restricties wilt)
4. Klik op **Create bucket**

✅ **Check**: Je zou nu een bucket genaamd `docs` moeten zien in de Storage lijst.

---

## 🔒 Stap 3: Storage Policies Installeren

1. Ga terug naar **SQL Editor** in het Supabase dashboard
2. Klik op **New query**
3. Open het bestand `paxure-platform/scripts/setup-storage-policies.sql` in je editor
4. Kopieer de **volledige** inhoud van het bestand
5. Plak de SQL code in de Supabase SQL Editor
6. Klik op **Run**

✅ **Check**: Je zou moeten zien: **"Success. No rows returned"** of een vergelijkbaar succesbericht.

---

## 👤 Stap 4: Eerste Gebruiker Aanmaken

### Optie A: Via Supabase Dashboard (Aanbevolen voor beginners)

1. Ga naar **Authentication** → **Users** in het Supabase dashboard
2. Klik op **Add user** → **Create new user**
3. Vul in:
   - **Email**: je email adres (bijv. `jouw-email@voorbeeld.nl`)
   - **Password**: een sterk wachtwoord (minimaal 8 karakters)
   - **Auto Confirm User**: **Aan** (vink dit aan - belangrijk!)
4. Klik op **Create user**
5. **Kopieer de User UID** (je ziet dit direct na het aanmaken, of klik op de gebruiker om de UID te zien)

6. Ga naar **Table Editor** → **profiles** (in het linker menu)
7. Klik op **Insert** → **Insert row**
8. Vul in:
   - **id**: Plak de User UID die je net hebt gekopieerd
   - **email**: Je email adres (hetzelfde als hierboven)
   - **full_name**: Je naam (bijv. `Jan Janssen`)
   - **role**: `business_developer` (of een andere rol: `operationeel_verantwoordelijke`, `coach`, `hulpcoach`, `maatwerker`)
9. Klik op **Save**

### Optie B: Via SQL Script (Sneller)

1. **Eerst**: Maak de gebruiker aan via Authentication (stap 4A, punten 1-4)
2. Ga naar **SQL Editor**
3. Open het bestand `paxure-platform/scripts/create-first-user.sql`
4. **Belangrijk**: Vervang in het script:
   - `'jouw-email@voorbeeld.nl'` met je eigen email adres
   - `'Je Naam'` met je eigen naam
   - Optioneel: `'business_developer'` met een andere rol als je dat wilt
5. Kopieer het aangepaste script
6. Plak in de SQL Editor
7. Klik op **Run**

✅ **Check**: Ga naar Table Editor → profiles en controleer of je profiel bestaat.

---

## 🔑 Stap 5: Environment Variabelen Instellen

1. In het Supabase dashboard, ga naar **Settings** → **API**
2. Je ziet hier verschillende keys. Kopieer de volgende:

   **a) Project URL:**
   - Zoek naar **Project URL**
   - Kopieer de volledige URL (bijv. `https://xxxxx.supabase.co`)
   - Dit wordt `NEXT_PUBLIC_SUPABASE_URL`

   **b) anon public key:**
   - Zoek naar **Project API keys**
   - Kopieer de **anon public** key (de lange string die begint met `eyJ...`)
   - Dit wordt `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   **c) service_role key:**
   - In dezelfde sectie, kopieer de **service_role** key
   - ⚠️ **WAARSCHUWING**: Deze key is geheim! Deel deze nooit publiekelijk.
   - Dit wordt `SUPABASE_SERVICE_ROLE_KEY`

3. Maak een `.env.local` bestand in de `paxure-platform` directory:
   - Navigeer naar `paxure-platform/` in je bestandsverkenner
   - Maak een nieuw bestand genaamd `.env.local` (met de punt vooraan!)
   - Open het bestand in een teksteditor

4. Plak de volgende template en vul je eigen waarden in:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STORAGE_BUCKET=docs
```

5. **Vervang**:
   - `https://xxxxx.supabase.co` met je Project URL
   - De eerste `eyJ...` met je anon public key
   - De tweede `eyJ...` met je service_role key

6. Sla het bestand op

✅ **Check**: Controleer of `.env.local` bestaat in `paxure-platform/` en of alle waarden zijn ingevuld.

---

## 🧪 Stap 6: Testen

1. Open een terminal/command prompt
2. Navigeer naar de `paxure-platform` directory:
   ```bash
   cd paxure-platform
   ```
3. Installeer dependencies (als je dit nog niet hebt gedaan):
   ```bash
   npm install
   ```
4. Start de development server:
   ```bash
   npm run dev
   ```
5. Wacht tot je ziet: `Ready - started server on 0.0.0.0:3000`
6. Open je browser en ga naar: **http://localhost:3000**
7. Je wordt doorgestuurd naar de login pagina (`/login`)
8. Log in met:
   - **Email**: Het email adres dat je hebt gebruikt in Stap 4
   - **Password**: Het wachtwoord dat je hebt ingesteld
9. Na succesvol inloggen zou je naar het dashboard moeten worden doorgestuurd!

✅ **Check**: 
- Kun je inloggen?
- Zie je het dashboard?
- Zijn er geen errors in de browser console (F12)?

---

## ❌ Problemen Oplossen

### "Missing Supabase environment variables"
- Controleer of `.env.local` bestaat in `paxure-platform/`
- Controleer of alle variabelen zijn ingevuld (geen lege waarden)
- **Herstart** de development server na het toevoegen/wijzigen van `.env.local`

### "Relation does not exist" of "Table does not exist"
- Het database schema is niet correct geïnstalleerd
- Voer `scripts/setup-database.sql` opnieuw uit in SQL Editor
- Controleer of er errors waren tijdens de eerste uitvoering

### "Bucket not found" of "Storage error"
- Controleer of de bucket `docs` bestaat in Storage
- Controleer of de bucket naam exact `docs` is (geen hoofdletters)
- Verifieer dat `NEXT_PUBLIC_STORAGE_BUCKET=docs` in `.env.local` staat

### "Permission denied" bij file upload
- Controleer of storage policies zijn geïnstalleerd (Stap 3)
- Verifieer dat je profiel de juiste rol heeft (bijv. `business_developer` of `coach`)
- Controleer in Table Editor → profiles of je rol correct is ingesteld

### "Invalid login credentials"
- Controleer of de gebruiker bestaat in Authentication → Users
- Controleer of het profiel bestaat in Table Editor → profiles
- Verifieer dat de email en wachtwoord correct zijn

### "Cannot read properties of undefined"
- Controleer of alle environment variabelen correct zijn ingesteld
- Herstart de development server
- Controleer de browser console voor specifieke errors

---

## ✅ Setup Voltooid!

Als alles werkt, ben je klaar! Je kunt nu:
- Gebruikers toevoegen
- Documenten uploaden
- Weekplanningen maken
- Klanten toevoegen
- En meer!

Zie `SETUP_CHECKLIST.md` voor een volledige verificatie checklist.

