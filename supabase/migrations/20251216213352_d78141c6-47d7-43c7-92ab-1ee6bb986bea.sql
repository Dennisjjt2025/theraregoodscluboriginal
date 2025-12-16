-- Add is_public column to drops table for waitlist access
ALTER TABLE public.drops ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Update RLS policy to allow public viewing of public drops
DROP POLICY IF EXISTS "Public can view public drops" ON public.drops;
CREATE POLICY "Public can view public drops"
ON public.drops
FOR SELECT
USING (is_public = true);

-- Allow admins to delete waitlist entries
DROP POLICY IF EXISTS "Admins can delete waitlist" ON public.waitlist;
CREATE POLICY "Admins can delete waitlist"
ON public.waitlist
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));