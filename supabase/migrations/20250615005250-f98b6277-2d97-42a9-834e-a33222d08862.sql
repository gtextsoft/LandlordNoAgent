
-- Create a new storage bucket for property photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies for the property-photos bucket

-- 1. Allow public, unauthenticated access to view images
CREATE POLICY "Public can view photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-photos');

-- 2. Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-photos');

-- 3. Allow users to update their own photos
-- This policy assumes file paths are structured as 'user_id/filename.ext'
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'property-photos' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- 4. Allow users to delete their own photos
-- This policy assumes file paths are structured as 'user_id/filename.ext'
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-photos' AND auth.uid() = (storage.foldername(name))[1]::uuid);
