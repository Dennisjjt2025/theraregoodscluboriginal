-- Create drop_interests table for tracking user interest in upcoming drops
CREATE TABLE public.drop_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID NOT NULL REFERENCES public.drops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  notified_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(drop_id, user_id)
);

-- Enable Row-Level Security
ALTER TABLE public.drop_interests ENABLE ROW LEVEL SECURITY;

-- Users can view their own interests
CREATE POLICY "Users can view own interests" ON public.drop_interests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own interests
CREATE POLICY "Users can insert own interests" ON public.drop_interests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own interests
CREATE POLICY "Users can delete own interests" ON public.drop_interests
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all interests
CREATE POLICY "Admins can view all interests" ON public.drop_interests
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update interests (for notified_at)
CREATE POLICY "Admins can update interests" ON public.drop_interests
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));