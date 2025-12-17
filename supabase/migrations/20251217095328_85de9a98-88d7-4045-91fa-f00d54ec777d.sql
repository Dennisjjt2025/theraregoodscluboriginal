-- Create site_settings table for admin-configurable messages
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value_en text,
  value_nl text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can read site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage site settings"
ON public.site_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default teaser messages
INSERT INTO public.site_settings (key, value_en, value_nl) VALUES
  ('drop_teaser_title', 'Something Special is Coming', 'Er Komt Iets Bijzonders Aan'),
  ('drop_teaser_message', 'Our curators are preparing the next exclusive release. Stay tuned for something truly rare.', 'Onze curatoren bereiden de volgende exclusieve release voor. Blijf op de hoogte voor iets echt zeldzaams.'),
  ('no_drops_title', 'Welcome to The Rare Goods Club', 'Welkom bij The Rare Goods Club'),
  ('no_drops_message', 'There are currently no scheduled drops. Explore our archive to see what you might have missed.', 'Er zijn momenteel geen geplande drops. Bekijk ons archief om te zien wat je gemist hebt.');

-- Add trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();