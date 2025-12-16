-- Make ends_at nullable for "while supplies last" drops
ALTER TABLE public.drops ALTER COLUMN ends_at DROP NOT NULL;

-- Add video_url column for video content
ALTER TABLE public.drops ADD COLUMN IF NOT EXISTS video_url text;

-- Add is_draft status for draft drops
ALTER TABLE public.drops ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT false;