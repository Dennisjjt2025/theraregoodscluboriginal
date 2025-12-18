-- Create function to get incomplete accounts (users without members record)
CREATE OR REPLACE FUNCTION public.get_incomplete_accounts()
RETURNS TABLE (
  id uuid,
  email text,
  first_name text,
  last_name text,
  email_verified boolean,
  created_at timestamptz,
  invite_code_used text,
  inviter_email text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.id,
    u.email,
    p.first_name,
    p.last_name,
    COALESCE(p.email_verified, false) as email_verified,
    u.created_at,
    ic.code as invite_code_used,
    inviter_user.email as inviter_email
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.members m ON m.user_id = u.id
  LEFT JOIN public.invite_codes ic ON ic.used_by = u.id
  LEFT JOIN public.members inviter_member ON inviter_member.id = ic.member_id
  LEFT JOIN auth.users inviter_user ON inviter_user.id = inviter_member.user_id
  WHERE m.id IS NULL
    AND has_role(auth.uid(), 'admin'::app_role)
  ORDER BY u.created_at DESC
$$;