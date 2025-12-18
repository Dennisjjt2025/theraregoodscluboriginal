-- Create a function to validate invite codes on user signup
-- This runs AFTER a user is inserted in auth.users
CREATE OR REPLACE FUNCTION public.validate_invite_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_code_value TEXT;
  invite_record RECORD;
BEGIN
  -- Get the invite code from user metadata
  invite_code_value := NEW.raw_user_meta_data ->> 'invite_code';
  
  -- If no invite code provided, delete the user (block signup)
  IF invite_code_value IS NULL OR invite_code_value = '' THEN
    RAISE EXCEPTION 'Signup requires a valid invite code';
  END IF;
  
  -- Check if the invite code exists, is unused, and not expired
  SELECT * INTO invite_record
  FROM public.invite_codes
  WHERE code = invite_code_value
    AND used_by IS NULL
    AND expires_at > NOW()
  FOR UPDATE; -- Lock the row to prevent race conditions
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid, expired, or already used invite code';
  END IF;
  
  -- Mark the invite code as used (server-side, atomic)
  UPDATE public.invite_codes
  SET used_by = NEW.id,
      used_at = NOW()
  WHERE id = invite_record.id;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created_validate_invite
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_invite_on_signup();