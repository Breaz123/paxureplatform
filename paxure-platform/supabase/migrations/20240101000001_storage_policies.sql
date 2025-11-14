-- Storage Policies voor 'docs' bucket
-- Deze policies worden toegepast nadat de 'docs' bucket is aangemaakt

-- Policy 1: Authenticated users can read files
DROP POLICY IF EXISTS "Authenticated users can read files" ON storage.objects;
CREATE POLICY "Authenticated users can read files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'docs');

-- Policy 2: Coaches and above can upload files
DROP POLICY IF EXISTS "Coaches can upload files" ON storage.objects;
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

-- Policy 3: Coaches and above can update files
DROP POLICY IF EXISTS "Coaches can update files" ON storage.objects;
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

-- Policy 4: Coaches and above can delete files
DROP POLICY IF EXISTS "Coaches can delete files" ON storage.objects;
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

