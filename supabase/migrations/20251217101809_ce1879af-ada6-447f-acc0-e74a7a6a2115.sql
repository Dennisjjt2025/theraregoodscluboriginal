-- Create preference_categories table
CREATE TABLE public.preference_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  label_en text NOT NULL,
  label_nl text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.preference_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read active categories
CREATE POLICY "Anyone can read active categories"
ON public.preference_categories
FOR SELECT
USING (is_active = true);

-- Admins can manage all categories
CREATE POLICY "Admins can manage categories"
ON public.preference_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed with existing categories
INSERT INTO public.preference_categories (key, label_en, label_nl, sort_order) VALUES
  ('wine_spirits', 'Wine & Spirits', 'Wijn & Gedistilleerd', 1),
  ('art_prints', 'Art & Prints', 'Kunst & Prints', 2),
  ('regional_products', 'Regional Products', 'Streekproducten', 3),
  ('farm_local', 'Farm Fresh & Local', 'Lokale Producten van de Boer', 4),
  ('food_delicatessen', 'Food & Delicatessen', 'Delicatessen & Specialiteiten', 5),
  ('fashion_accessories', 'Fashion & Accessories', 'Mode & Accessoires', 6),
  ('home_design', 'Home & Design', 'Wonen & Design', 7),
  ('collectibles', 'Collectibles', 'Verzamelobjecten', 8);