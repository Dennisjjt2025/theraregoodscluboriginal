-- Add has_seen_tour column to profiles table
ALTER TABLE public.profiles ADD COLUMN has_seen_tour BOOLEAN DEFAULT false;