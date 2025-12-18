-- Allow admins to delete members
CREATE POLICY "Admins can delete members"
ON public.members
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));