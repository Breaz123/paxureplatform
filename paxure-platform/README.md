# Paxure Platform

E-fulfilment platform voor Paxure, de business unit van een maatwerkbedrijf. Dit platform centraliseert alle processen, opleidingen, templates, SOP's, skills tracking, planningen en coachingstructuren.

## 🚀 Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage)
- **Hosting**: Vercel
- **TypeScript**: Volledige type safety

## 📋 Features

### 1. Dashboard
- KPI overzicht (pending taken, geplande opleidingen, afwijkingen)
- Notificaties systeem
- Snelle acties

### 2. Documentbibliotheek
- Filter op type (SOP, template, planning, klantflow, opleiding)
- Zoekfunctie
- Preview en download van documenten
- Rolgebaseerde toegang tot uploaden/bewerken

### 3. Opleidingen
- Per processtap (Inbound, Picking, Packing, Controle, Outbound, VAS, Afwijkingen)
- Koppeling aan vaardighedenmatrix (score 0-2)
- Coach kan opleiding registreren als "voltooid"
- Upload visueel instructiemateriaal

### 4. SOP-beheer
- Aparte SOP-pagina's met versiebeheer
- Download functionaliteit
- Link naar verbonden opleiding en planningsmodules

### 5. Planning
- Weekplanning (invulbaar vanaf woensdag 14u)
- Maandplanning
- Koppelbaar aan klantflow of afwijking

### 6. Klantflows & Afwijkingen
- Per klant: draaiboek, levermomenten, instructies, afwijkingen
- Visuele weergave

### 7. Coachingmodule
- 1-op-1 gesprekken
- Opvolging en vaardighedenregistratie
- Downloadbare evaluatierapporten (PDF)
- Logboek per coach/medewerker

### 8. Vaardighedenmatrix
- Overzicht per medewerker
- Score systeem (0-2, ja/nee)
- Status tracking

## 🔐 Rollen & Toegang

Het platform ondersteunt 5 rollen:

1. **Business Developer** - Volledige toegang
2. **Operationeel Verantwoordelijke** - Beheer van processen en planning
3. **Coach** - Opleidingen, evaluaties, planning
4. **Hulpcoach** - Beperkte beheerrechten
5. **Maatwerker** - Read-only toegang

## 🛠️ Setup

### Vereisten

- Node.js 18+ 
- npm of yarn
- Supabase account

### Installatie

1. **Clone en installeer dependencies:**

```bash
cd paxure-platform
npm install
```

2. **Supabase Setup:**

   a. Maak een nieuw Supabase project aan op [supabase.com](https://supabase.com)
   
   b. Ga naar SQL Editor en voer het schema uit uit `supabase/schema.sql`
   
   c. Maak een Storage bucket aan genaamd `docs`:
      - Ga naar Storage in Supabase dashboard
      - Klik op "New bucket"
      - Naam: `docs`
      - Public: false (of true als je publieke toegang wilt)
      - Voeg RLS policies toe voor toegang

3. **Environment Variabelen:**

   Maak een `.env.local` bestand in de root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STORAGE_BUCKET=docs
```

   Je vindt deze waarden in je Supabase project settings:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - API Keys → anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - API Keys → service_role key → `SUPABASE_SERVICE_ROLE_KEY`

4. **Run development server:**

```bash
npm run dev
```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 📦 Database Schema

Het database schema is gedefinieerd in `supabase/schema.sql` en bevat:

- `profiles` - Gebruikersprofielen met rollen
- `documents` - Documenten bibliotheek
- `klanten` - Klant informatie
- `sops` - Standaard Werkprocedures
- `opleidingen` - Opleidingscatalogus
- `vaardighedenmatrix` - Skills tracking
- `opleiding_registraties` - Opleiding voltooiingen
- `weekplanning` - Weekplanningen
- `maandplanning` - Maandplanningen
- `evaluaties` - Coaching evaluaties
- `notificaties` - Notificatie systeem
- `klantflow_afwijkingen` - Afwijkingen tracking

## 🗂️ Project Structuur

```
paxure-platform/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Dashboard module
│   ├── documenten/         # Document bibliotheek
│   ├── opleidingen/        # Opleidingen module
│   ├── sops/               # SOP beheer
│   ├── planning/           # Planning module
│   ├── klanten/            # Klanten & flows
│   ├── coaching/           # Coaching module
│   ├── vaardighedenmatrix/ # Skills matrix
│   └── api/                # API routes
├── components/             # React componenten
│   ├── ui/                 # shadcn/ui componenten
│   ├── layout/             # Layout componenten
│   └── planning/           # Planning specifieke componenten
├── lib/                    # Utility functies
│   ├── supabase/           # Supabase clients
│   ├── types/              # TypeScript types
│   ├── utils/              # Helper functies
│   └── auth.ts             # Auth helpers
├── supabase/               # Supabase configuratie
│   └── schema.sql          # Database schema
└── public/                 # Static assets
```

## 🚢 Deployment

### Vercel Deployment

1. Push je code naar GitHub
2. Import project in Vercel
3. Voeg environment variabelen toe in Vercel dashboard
4. Deploy!

### Environment Variabelen in Vercel

Zorg ervoor dat alle environment variabelen uit `.env.local` ook in Vercel zijn ingesteld.

## 📝 CSV Templates

De CSV templates voor weekplanning en vaardighedenmatrix zijn beschikbaar in:
- `CSV for cursor/Paxure_Weekplanning_Template.csv`
- `CSV for cursor/Paxure_Vaardighedenmatrix_Template.csv`

Deze kunnen gebruikt worden voor import/export functionaliteit (toekomstige feature).

## 🔒 Security

- Row Level Security (RLS) is geactiveerd op alle tabellen
- Rolgebaseerde toegangscontrole
- Supabase Auth voor authenticatie
- Secure file storage via Supabase Storage

## 📚 Documentatie

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contributing

Dit is een intern platform voor Paxure. Voor vragen of issues, neem contact op met het development team.

## 📄 License

Intern gebruik - Paxure
