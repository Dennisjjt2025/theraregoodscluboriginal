-- Drop existing function and recreate with email_verified
DROP FUNCTION IF EXISTS public.get_member_emails();

CREATE FUNCTION public.get_member_emails()
RETURNS TABLE(member_id uuid, user_id uuid, email text, email_verified boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT m.id as member_id, m.user_id, u.email, COALESCE(p.email_verified, false) as email_verified
  FROM public.members m
  JOIN auth.users u ON m.user_id = u.id
  LEFT JOIN public.profiles p ON p.id = m.user_id
  WHERE has_role(auth.uid(), 'admin'::app_role)
$$;