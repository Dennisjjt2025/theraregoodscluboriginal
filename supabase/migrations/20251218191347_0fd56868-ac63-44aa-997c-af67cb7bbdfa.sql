-- Change used_by foreign key from members to auth.users
-- First drop the existing constraint
ALTER TABLE public.invite_codes 
DROP CONSTRAINT IF EXISTS invite_codes_used_by_fkey;

-- Add new constraint referencing auth.users
ALTER TABLE public.invite_codes
ADD CONSTRAINT invite_codes_used_by_fkey 
FOREIGN KEY (used_by) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;