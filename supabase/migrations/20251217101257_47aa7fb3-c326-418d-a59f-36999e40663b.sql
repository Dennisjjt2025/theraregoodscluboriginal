-- Add preferences column to profiles table
ALTER TABLE public.profiles ADD COLUMN preferences text[] DEFAULT '{}';