-- Drop the existing restrictive policy for viewing active drops
DROP POLICY IF EXISTS "Active members can view active drops" ON public.drops;

-- Create new policy: anyone can view active drops (not drafts)
CREATE POLICY "Anyone can view active drops"
ON public.drops
FOR SELECT
USING (is_active = true AND (is_draft = false OR is_draft IS NULL));