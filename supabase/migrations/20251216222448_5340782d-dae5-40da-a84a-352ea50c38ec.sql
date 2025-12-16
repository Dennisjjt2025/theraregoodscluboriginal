-- Create a table for storing multiple images per drop
CREATE TABLE public.drop_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drop_id UUID NOT NULL REFERENCES public.drops(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.drop_images ENABLE ROW LEVEL SECURITY;

-- Public read access (drops are viewable by everyone)
CREATE POLICY "Drop images are publicly viewable"
ON public.drop_images
FOR SELECT
USING (true);

-- Admin can manage drop images (through existing admin role check)
CREATE POLICY "Admins can manage drop images"
ON public.drop_images
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Create index for faster lookups
CREATE INDEX idx_drop_images_drop_id ON public.drop_images(drop_id);
CREATE INDEX idx_drop_images_sort_order ON public.drop_images(drop_id, sort_order);