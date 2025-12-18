-- Add UPDATE policy for invite_codes so users can mark codes as used during signup
CREATE POLICY "Users can mark invite codes as used"
ON public.invite_codes
FOR UPDATE
TO authenticated
USING (used_by IS NULL)
WITH CHECK (used_by = auth.uid());

-- Add INSERT policy for members so users can create their own member record during signup
CREATE POLICY "Users can create their own member record"
ON public.members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());