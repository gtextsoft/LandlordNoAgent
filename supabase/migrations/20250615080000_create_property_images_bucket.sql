
-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
);

-- Create storage bucket for house documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'house-documents',
  'house-documents',
  false, -- Private bucket for sensitive documents
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
);

-- Create storage policies for property images
CREATE POLICY "Anyone can view property images" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'property-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own property images" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'property-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own property images" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'property-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage policies for house documents
CREATE POLICY "Document owners can view their documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'house-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Property owners can view tenant documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'house-documents'
    AND EXISTS (
      SELECT 1 FROM properties p
      WHERE p.landlord_id = auth.uid()
      AND (storage.foldername(name))[2] = p.id::text
    )
  );

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'house-documents'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own documents"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'house-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'house-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
