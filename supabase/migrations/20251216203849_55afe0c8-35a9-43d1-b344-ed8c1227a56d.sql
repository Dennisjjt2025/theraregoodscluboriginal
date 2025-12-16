-- Add email_verified field to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ;

-- Create index for token lookup
CREATE INDEX IF NOT EXISTS idx_profiles_verification_token ON public.profiles(verification_token) WHERE verification_token IS NOT NULL;