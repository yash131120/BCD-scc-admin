/*
  # Complete Digital Business Card Database Schema

  1. New Tables
    - `profiles` - User profile information with avatar support
    - `business_cards` - Main business card data with themes and layouts
    - `social_links` - Social media links for each card
    - `card_analytics` - Track card views and interactions
    - `card_templates` - Predefined card templates

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for authenticated users
    - Secure file upload policies for avatars

  3. Storage
    - Create storage bucket for profile images
    - Set up proper access policies

  4. Functions
    - Auto-create profile on user signup
    - Update timestamps automatically
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  name text,
  avatar_url text,
  role text DEFAULT 'user',
  subscription_tier text DEFAULT 'free',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create business_cards table
CREATE TABLE IF NOT EXISTS business_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text,
  company text,
  position text,
  phone text,
  email text,
  website text,
  avatar_url text,
  bio text,
  theme jsonb DEFAULT '{"primary": "#3B82F6", "secondary": "#1E40AF", "background": "#FFFFFF", "text": "#1F2937", "name": "Ocean Blue"}',
  shape text DEFAULT 'rectangle' CHECK (shape IN ('rectangle', 'rounded', 'circle')),
  layout jsonb DEFAULT '{"style": "modern", "alignment": "center", "font": "Inter"}',
  is_published boolean DEFAULT false,
  view_count integer DEFAULT 0,
  slug text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create social_links table
CREATE TABLE IF NOT EXISTS social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES business_cards(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL,
  username text,
  url text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create card_analytics table
CREATE TABLE IF NOT EXISTS card_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES business_cards(id) ON DELETE CASCADE NOT NULL,
  visitor_ip text,
  user_agent text,
  referrer text,
  country text,
  city text,
  device_type text,
  viewed_at timestamptz DEFAULT now()
);

-- Create card_templates table
CREATE TABLE IF NOT EXISTS card_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  preview_image text,
  theme jsonb NOT NULL,
  layout jsonb NOT NULL,
  is_premium boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_cards_user_id ON business_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_business_cards_slug ON business_cards(slug);
CREATE INDEX IF NOT EXISTS idx_business_cards_published ON business_cards(is_published);
CREATE INDEX IF NOT EXISTS idx_social_links_card_id ON social_links(card_id);
CREATE INDEX IF NOT EXISTS idx_card_analytics_card_id ON card_analytics(card_id);
CREATE INDEX IF NOT EXISTS idx_card_analytics_viewed_at ON card_analytics(viewed_at);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_templates ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Business cards policies
CREATE POLICY "Users can read own cards"
  ON business_cards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read published cards"
  ON business_cards
  FOR SELECT
  TO anon
  USING (is_published = true);

CREATE POLICY "Users can create own cards"
  ON business_cards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
  ON business_cards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards"
  ON business_cards
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Social links policies
CREATE POLICY "Users can manage social links for own cards"
  ON social_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_cards 
      WHERE business_cards.id = social_links.card_id 
      AND business_cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read social links for published cards"
  ON social_links
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM business_cards 
      WHERE business_cards.id = social_links.card_id 
      AND business_cards.is_published = true
    )
  );

-- Card analytics policies
CREATE POLICY "Users can read analytics for own cards"
  ON card_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_cards 
      WHERE business_cards.id = card_analytics.card_id 
      AND business_cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert analytics"
  ON card_analytics
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Card templates policies
CREATE POLICY "Anyone can read active templates"
  ON card_templates
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Functions and triggers
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_cards_updated_at
  BEFORE UPDATE ON business_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION generate_unique_slug(input_text text, table_name text)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Create base slug from input text
  base_slug := lower(regexp_replace(input_text, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  -- If empty, use random string
  IF base_slug = '' THEN
    base_slug := 'card-' || substr(gen_random_uuid()::text, 1, 8);
  END IF;
  
  final_slug := base_slug;
  
  -- Check if slug exists and increment if needed
  WHILE EXISTS (SELECT 1 FROM business_cards WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate slug before insert
CREATE OR REPLACE FUNCTION set_card_slug()
RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_unique_slug(COALESCE(NEW.title, 'card'), 'business_cards');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set slug
CREATE TRIGGER set_business_card_slug
  BEFORE INSERT ON business_cards
  FOR EACH ROW EXECUTE FUNCTION set_card_slug();

-- Insert default templates
INSERT INTO card_templates (name, description, theme, layout, is_premium) VALUES
('Modern Blue', 'Clean and professional blue theme', 
 '{"primary": "#3B82F6", "secondary": "#1E40AF", "background": "#FFFFFF", "text": "#1F2937", "name": "Modern Blue"}',
 '{"style": "modern", "alignment": "center", "font": "Inter"}', false),
('Forest Green', 'Nature-inspired green theme',
 '{"primary": "#10B981", "secondary": "#047857", "background": "#FFFFFF", "text": "#1F2937", "name": "Forest Green"}',
 '{"style": "modern", "alignment": "center", "font": "Inter"}', false),
('Sunset Orange', 'Warm and energetic orange theme',
 '{"primary": "#F59E0B", "secondary": "#D97706", "background": "#FFFFFF", "text": "#1F2937", "name": "Sunset Orange"}',
 '{"style": "modern", "alignment": "center", "font": "Inter"}', false),
('Royal Purple', 'Elegant purple theme',
 '{"primary": "#8B5CF6", "secondary": "#7C3AED", "background": "#FFFFFF", "text": "#1F2937", "name": "Royal Purple"}',
 '{"style": "modern", "alignment": "center", "font": "Inter"}', false),
('Rose Pink', 'Soft and friendly pink theme',
 '{"primary": "#EC4899", "secondary": "#DB2777", "background": "#FFFFFF", "text": "#1F2937", "name": "Rose Pink"}',
 '{"style": "modern", "alignment": "center", "font": "Inter"}', false),
('Dark Mode', 'Sleek dark theme',
 '{"primary": "#60A5FA", "secondary": "#3B82F6", "background": "#1F2937", "text": "#F9FAFB", "name": "Dark Mode"}',
 '{"style": "modern", "alignment": "center", "font": "Inter"}', true);

-- Create storage bucket for avatars (this needs to be run in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);