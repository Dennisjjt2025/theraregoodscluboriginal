-- Drop existing function first (return type changed)
DROP FUNCTION IF EXISTS public.get_drop_participation_report(uuid);

-- Recreate with interest data
CREATE FUNCTION public.get_drop_participation_report(drop_id_param uuid)
RETURNS TABLE(
  member_id uuid, 
  user_id uuid, 
  email text, 
  status text, 
  strike_count integer, 
  purchased boolean, 
  notes text,
  was_interested boolean,
  interest_date timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    m.id as member_id,
    m.user_id,
    u.email,
    m.status::text,
    m.strike_count,
    COALESCE(dp.purchased, false) as purchased,
    m.notes,
    di.id IS NOT NULL as was_interested,
    di.created_at as interest_date
  FROM public.members m
  JOIN auth.users u ON m.user_id = u.id
  LEFT JOIN public.drop_participation dp ON dp.member_id = m.id AND dp.drop_id = drop_id_param
  LEFT JOIN public.drop_interests di ON di.user_id = m.user_id AND di.drop_id = drop_id_param
  WHERE has_role(auth.uid(), 'admin'::app_role)
  ORDER BY COALESCE(dp.purchased, false) ASC, m.created_at DESC
$$;