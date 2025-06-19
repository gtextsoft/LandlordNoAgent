
-- Add avatar_url column to profiles table to store the URL of the user's profile picture.
ALTER TABLE public.profiles
ADD COLUMN avatar_url TEXT;

-- Create a new, public storage bucket named 'avatars' for profile images.
-- This bucket will have a 5MB file size limit and only allow jpeg/png images.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Policies for the 'avatars' bucket to control access.

-- Allow authenticated users to upload their own avatar into a folder named with their user ID.
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view avatars, as they are public profile pictures.
CREATE POLICY "Allow public read access to avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow users to update their own avatar.
CREATE POLICY "Allow users to update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own avatar.
CREATE POLICY "Allow users to delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
