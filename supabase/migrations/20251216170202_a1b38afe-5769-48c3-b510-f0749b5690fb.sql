-- Add notes column to members table for admin communication tracking
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS notes text;

-- Create a secure function for admins to get member emails
CREATE OR REPLACE FUNCTION public.get_member_emails()
RETURNS TABLE (
  member_id uuid,
  user_id uuid,
  email text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id as member_id, m.user_id, u.email
  FROM public.members m
  JOIN auth.users u ON m.user_id = u.id
  WHERE has_role(auth.uid(), 'admin'::app_role)
$$;

-- Create a function to get drop participation details for admin reporting
CREATE OR REPLACE FUNCTION public.get_drop_participation_report(drop_id_param uuid)
RETURNS TABLE (
  member_id uuid,
  user_id uuid,
  email text,
  status text,
  strike_count integer,
  purchased boolean,
  notes text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.id as member_id,
    m.user_id,
    u.email,
    m.status::text,
    m.strike_count,
    COALESCE(dp.purchased, false) as purchased,
    m.notes
  FROM public.members m
  JOIN auth.users u ON m.user_id = u.id
  LEFT JOIN public.drop_participation dp ON dp.member_id = m.id AND dp.drop_id = drop_id_param
  WHERE has_role(auth.uid(), 'admin'::app_role)
  ORDER BY COALESCE(dp.purchased, false) ASC, m.created_at DESC
$$;