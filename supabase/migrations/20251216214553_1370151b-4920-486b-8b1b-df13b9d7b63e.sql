-- Create storage bucket for drop media (images and videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'drop-media', 
  'drop-media', 
  true,
  52428800, -- 50MB limit for videos
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
);

-- Policy: Admins can upload files
CREATE POLICY "Admins can upload drop media"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'drop-media' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Policy: Admins can update files
CREATE POLICY "Admins can update drop media"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'drop-media' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Policy: Admins can delete files
CREATE POLICY "Admins can delete drop media"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'drop-media' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Policy: Public can view drop media
CREATE POLICY "Anyone can view drop media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'drop-media');