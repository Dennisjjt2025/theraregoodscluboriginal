-- Allow members to delete their own invite codes (for cleaning up expired codes)
CREATE POLICY "Members can delete their own invite codes"
ON public.invite_codes
FOR DELETE
USING (member_id IN (
  SELECT id FROM public.members WHERE user_id = auth.uid()
));