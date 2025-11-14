# Setup Checklist - Paxure Platform

Gebruik deze checklist om het platform stap voor stap op te zetten.

## ✅ Pre-requisites

- [ ] Node.js 18+ geïnstalleerd
- [ ] npm of yarn geïnstalleerd
- [ ] Git geïnstalleerd (optioneel)
- [ ] Supabase account aangemaakt op [supabase.com](https://supabase.com)

## 📦 Project Setup

- [x] Next.js project geïnitialiseerd
- [x] Dependencies geïnstalleerd
- [x] TypeScript configuratie
- [x] Tailwind CSS geconfigureerd
- [x] shadcn/ui componenten geïnstalleerd

## 🗄️ Supabase Setup

### Database

- [ ] Supabase project aangemaakt
- [ ] Database schema uitgevoerd (`supabase/schema.sql`)
- [ ] RLS policies gecontroleerd
- [ ] Test data toegevoegd (optioneel)

### Storage

- [ ] Storage bucket `docs` aangemaakt
- [ ] Storage policies geconfigureerd (zie `SUPABASE_SETUP.md`)
- [ ] Bucket permissions getest

### Authentication

- [ ] Email auth ingeschakeld in Supabase
- [ ] Eerste gebruiker aangemaakt
- [ ] Profiel record aangemaakt in `profiles` tabel
- [ ] Rol toegewezen aan gebruiker

## 🔧 Environment Variabelen

- [ ] `.env.local` bestand aangemaakt
- [ ] `NEXT_PUBLIC_SUPABASE_URL` ingesteld
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` ingesteld
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ingesteld (secret!)
- [ ] `NEXT_PUBLIC_APP_URL` ingesteld
- [ ] `NEXT_PUBLIC_STORAGE_BUCKET` ingesteld

## 🧪 Testing

- [ ] Development server gestart (`npm run dev`)
- [ ] Login functionaliteit getest
- [ ] Dashboard laadt correct
- [ ] Documenten pagina werkt
- [ ] Planning module getest
- [ ] Opleidingen module getest
- [ ] SOP module getest
- [ ] Vaardighedenmatrix getest
- [ ] Klanten module getest
- [ ] Coaching module getest

## 🚀 Deployment (Vercel)

- [ ] Code gepusht naar GitHub/GitLab
- [ ] Vercel project aangemaakt
- [ ] Environment variabelen toegevoegd in Vercel
- [ ] Build succesvol
- [ ] Production deployment getest
- [ ] Custom domain geconfigureerd (optioneel)

## 📝 Documentatie

- [ ] README.md gelezen
- [ ] GETTING_STARTED.md gevolgd
- [ ] SUPABASE_SETUP.md gevolgd
- [ ] Team geïnformeerd over platform

## 🎯 Volgende Stappen

Na setup:

1. **Gebruikers toevoegen**
   - Maak gebruikers aan via Supabase Auth
   - Voeg profielen toe met juiste rollen

2. **Content toevoegen**
   - Upload documenten
   - Maak SOP's aan
   - Voeg opleidingen toe
   - Configureer klanten

3. **Workflow opzetten**
   - Test weekplanning invullen
   - Test opleiding registratie
   - Test evaluatie proces

4. **Team training**
   - Organiseer training sessie
   - Documenteer workflows
   - Stel vragenlijst op voor feedback

## ❓ Problemen?

Check de troubleshooting sectie in:
- `README.md`
- `SUPABASE_SETUP.md`
- `GETTING_STARTED.md`

Of controleer:
- Supabase logs
- Vercel build logs
- Browser console errors

