-- Storage Policies voor 'docs' bucket
-- Voer dit uit nadat je de 'docs' bucket hebt aangemaakt in Supabase Storage

-- Policy 1: Authenticated users can read files
CREATE POLICY IF NOT EXISTS "Authenticated users can read files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'docs');

-- Policy 2: Coaches and above can upload files
CREATE POLICY IF NOT EXISTS "Coaches can upload files"
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

-- Policy 3: Coaches and above can update files
CREATE POLICY IF NOT EXISTS "Coaches can update files"
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

-- Policy 4: Coaches and above can delete files
CREATE POLICY IF NOT EXISTS "Coaches can delete files"
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

