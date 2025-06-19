/*
  # Create storage bucket for property photos

  1. Storage
    - Create `property-photos` bucket
    - Set up RLS policies for bucket access
*/

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Anyone can view property photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');

CREATE POLICY "Authenticated users can upload property photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'property-photos');

CREATE POLICY "Users can update their own property photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'property-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own property photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'property-photos' AND auth.uid()::text = (storage.foldername(name))[1]);