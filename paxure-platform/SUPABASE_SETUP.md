# Supabase Setup Instructies

## 1. Database Schema Installeren

1. Ga naar je Supabase project dashboard
2. Navigeer naar **SQL Editor**
3. Open het bestand `supabase/schema.sql`
4. Kopieer de volledige SQL code
5. Plak deze in de SQL Editor
6. Klik op **Run** om het schema te installeren

## 2. Storage Bucket Aanmaken

1. Ga naar **Storage** in het Supabase dashboard
2. Klik op **New bucket**
3. Configureer de bucket:
   - **Name**: `docs`
   - **Public bucket**: `false` (aanbevolen voor beveiliging)
   - **File size limit**: Pas aan naar wens (standaard 50MB)
   - **Allowed MIME types**: Laat leeg of specificeer (bijv. `application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
4. Klik op **Create bucket**

## 3. Storage Policies (RLS)

Voeg de volgende policies toe voor de `docs` bucket:

### Policy 1: Authenticated users can read files

```sql
CREATE POLICY "Authenticated users can read files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'docs');
```

### Policy 2: Coaches and above can upload files

```sql
CREATE POLICY "Coaches can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'docs' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
  )
);
```

### Policy 3: Coaches and above can update files

```sql
CREATE POLICY "Coaches can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'docs' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
  )
);
```

### Policy 4: Coaches and above can delete files

```sql
CREATE POLICY "Coaches can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'docs' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
  )
);
```

## 4. Eerste Gebruiker Aanmaken

1. Ga naar **Authentication** in Supabase dashboard
2. Klik op **Add user** of gebruik de sign-up flow in de app
3. Na het aanmaken van een gebruiker, moet je handmatig een profiel aanmaken:

```sql
-- Vervang 'user-email@example.com' met het e-mailadres van de gebruiker
-- Vervang 'user-role' met een van: business_developer, operationeel_verantwoordelijke, coach, hulpcoach, maatwerker

INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  'business_developer'::user_role as role
FROM auth.users
WHERE email = 'user-email@example.com';
```

Of gebruik de Supabase dashboard om handmatig een profiel aan te maken in de `profiles` tabel.

## 5. Test Data (Optioneel)

Je kunt test data toevoegen voor development:

```sql
-- Test document
INSERT INTO public.documents (title, description, document_type, version, is_active)
VALUES ('Test SOP', 'Een test SOP document', 'sop', 1, true);

-- Test klant
INSERT INTO public.klanten (naam, contactpersoon_email)
VALUES ('Test Klant', 'test@example.com');
```

## 6. Verificatie

Controleer of alles werkt:

1. Test de database connectie in je Next.js app
2. Test file upload naar de `docs` bucket
3. Verifieer dat RLS policies correct werken
4. Test authenticatie flow

## Troubleshooting

### RLS Policies werken niet
- Controleer of RLS is ingeschakeld op de tabellen
- Verifieer dat de gebruiker de juiste rol heeft in de `profiles` tabel
- Check de Supabase logs voor errors

### Storage upload faalt
- Controleer bucket naam (moet `docs` zijn)
- Verifieer bucket policies
- Check file size limits
- Controleer MIME type restricties

### Authenticatie issues
- Verifieer dat `profiles` record bestaat voor de gebruiker
- Check of de gebruiker email verified is
- Controleer Supabase Auth settings

