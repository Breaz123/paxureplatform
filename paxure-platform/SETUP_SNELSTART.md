# 🚀 Supabase Setup - Snelle Start

## ⚡ Quick Reference

### Stap 1: Database Schema
```
Supabase Dashboard → SQL Editor → New query
→ Kopieer: scripts/setup-database.sql
→ Plak → Run
```

### Stap 2: Storage Bucket
```
Supabase Dashboard → Storage → New bucket
→ Name: docs
→ Public: UIT
→ Create
```

### Stap 3: Storage Policies
```
Supabase Dashboard → SQL Editor → New query
→ Kopieer: scripts/setup-storage-policies.sql
→ Plak → Run
```

### Stap 4: Eerste Gebruiker
```
Supabase Dashboard → Authentication → Users
→ Add user → Create new user
→ Email + Password + Auto Confirm: AAN
→ Kopieer User UID

→ Table Editor → profiles → Insert row
→ id: (User UID)
→ email: (jouw email)
→ full_name: (jouw naam)
→ role: business_developer
→ Save
```

### Stap 5: Environment Variabelen
```
Supabase Dashboard → Settings → API
→ Kopieer: Project URL, anon public key, service_role key

→ Maak .env.local in paxure-platform/
→ Gebruik env.template als basis
→ Vul alle waarden in
```

### Stap 6: Testen
```bash
cd paxure-platform
npm run dev
→ Open http://localhost:3000
→ Log in
```

## 📁 Bestanden die je nodig hebt:

- ✅ `scripts/setup-database.sql` - Database schema
- ✅ `scripts/setup-storage-policies.sql` - Storage policies
- ✅ `scripts/create-first-user.sql` - Eerste gebruiker (optioneel)
- ✅ `env.template` - Environment variabelen template

## 🔍 Waar vind je wat in Supabase?

| Wat je zoekt | Waar het staat |
|-------------|----------------|
| SQL Editor | Linker menu → SQL Editor |
| Storage | Linker menu → Storage |
| Authentication | Linker menu → Authentication |
| Table Editor | Linker menu → Table Editor |
| API Keys | Settings → API |
| Project URL | Settings → API |

## ⚠️ Belangrijke Tips

1. **Auto Confirm User** moet AAN staan bij het aanmaken van gebruikers
2. **Bucket naam** moet exact `docs` zijn (kleine letters)
3. **Public bucket** moet UIT staan (beveiliging)
4. **Herstart** de dev server na het toevoegen van `.env.local`
5. **service_role key** is geheim - deel deze nooit!

## 📖 Volledige instructies

Zie `SETUP_STAP_VOOR_STAP.md` voor gedetailleerde instructies met troubleshooting.

