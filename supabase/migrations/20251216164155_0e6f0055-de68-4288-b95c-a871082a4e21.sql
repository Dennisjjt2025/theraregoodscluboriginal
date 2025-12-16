-- Create enum for member status
CREATE TYPE public.member_status AS ENUM ('active', 'suspended', 'pending');

-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- Waitlist table for public signups
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Members table linked to auth.users
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status member_status DEFAULT 'active' NOT NULL,
  strike_count INTEGER DEFAULT 0 CHECK (strike_count >= 0 AND strike_count <= 3),
  invites_remaining INTEGER DEFAULT 3 CHECK (invites_remaining >= 0),
  invited_by UUID REFERENCES public.members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table (separate from members for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Invite codes table
CREATE TABLE public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  used_by UUID REFERENCES public.members(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Drops table with bilingual content
CREATE TABLE public.drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_nl TEXT NOT NULL,
  description_en TEXT,
  description_nl TEXT,
  story_en TEXT,
  story_nl TEXT,
  tasting_notes_en TEXT,
  tasting_notes_nl TEXT,
  origin TEXT,
  vintage TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity_available INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  image_url TEXT,
  shopify_product_id TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Drop participation tracking
CREATE TABLE public.drop_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID REFERENCES public.drops(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  purchased BOOLEAN DEFAULT false,
  quantity INTEGER DEFAULT 0,
  shopify_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (drop_id, member_id)
);

-- Enable RLS on all tables
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drop_participation ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is a member
CREATE OR REPLACE FUNCTION public.is_member(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.members
    WHERE user_id = _user_id
      AND status = 'active'
  )
$$;

-- Waitlist policies (public insert, admin read)
CREATE POLICY "Anyone can submit to waitlist"
ON public.waitlist FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view waitlist"
ON public.waitlist FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update waitlist"
ON public.waitlist FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Members policies
CREATE POLICY "Members can view their own data"
ON public.members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all members"
ON public.members FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update members"
ON public.members FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert members"
ON public.members FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Invite codes policies
CREATE POLICY "Members can view their own invite codes"
ON public.invite_codes FOR SELECT
TO authenticated
USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Members can create invite codes"
ON public.invite_codes FOR INSERT
TO authenticated
WITH CHECK (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Public can validate invite codes"
ON public.invite_codes FOR SELECT
TO anon, authenticated
USING (used_by IS NULL AND expires_at > now());

-- Drops policies
CREATE POLICY "Active members can view active drops"
ON public.drops FOR SELECT
TO authenticated
USING (public.is_member(auth.uid()) AND is_active = true);

CREATE POLICY "Admins can manage drops"
ON public.drops FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Drop participation policies
CREATE POLICY "Members can view their own participation"
ON public.drop_participation FOR SELECT
TO authenticated
USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Members can create participation"
ON public.drop_participation FOR INSERT
TO authenticated
WITH CHECK (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all participation"
ON public.drop_participation FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_waitlist_updated_at
  BEFORE UPDATE ON public.waitlist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drops_updated_at
  BEFORE UPDATE ON public.drops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_members_user_id ON public.members(user_id);
CREATE INDEX idx_members_status ON public.members(status);
CREATE INDEX idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX idx_invite_codes_member_id ON public.invite_codes(member_id);
CREATE INDEX idx_drops_is_active ON public.drops(is_active);
CREATE INDEX idx_drops_dates ON public.drops(starts_at, ends_at);
CREATE INDEX idx_drop_participation_drop_id ON public.drop_participation(drop_id);
CREATE INDEX idx_drop_participation_member_id ON public.drop_participation(member_id);