/*
  # Enhanced Digital Business Card Database Schema

  1. New Tables
    - `media_items` - Store images, videos, and documents for cards
    - `reviews` - Store customer reviews with ratings
    - `card_views` - Enhanced analytics for card views

  2. Enhanced Tables
    - Updated `business_cards` table with additional fields
    - Enhanced `social_links` with more platforms

  3. Security
    - Enable RLS on all new tables
    - Add comprehensive policies for authenticated users
    - Secure file upload policies for media

  4. Storage
    - Create storage buckets for media files
    - Set up proper access policies
*/

-- Create media_items table for gallery
CREATE TABLE IF NOT EXISTS media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES business_cards(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('image', 'video', 'document')),
  title text NOT NULL,
  description text,
  url text NOT NULL,
  thumbnail_url text,
  file_size integer,
  mime_type text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES business_cards(id) ON DELETE CASCADE NOT NULL,
  reviewer_name text NOT NULL,
  reviewer_email text,
  reviewer_avatar text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  source_url text, -- URL where review was originally posted
  is_verified boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create enhanced card_views table
CREATE TABLE IF NOT EXISTS card_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES business_cards(id) ON DELETE CASCADE NOT NULL,
  visitor_ip text,
  user_agent text,
  referrer text,
  country text,
  city text,
  device_type text,
  session_id text,
  viewed_at timestamptz DEFAULT now()
);

-- Add new columns to business_cards if they don't exist
DO $$
BEGIN
  -- Add address field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_cards' AND column_name = 'address'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN address text;
  END IF;

  -- Add map_link field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_cards' AND column_name = 'map_link'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN map_link text;
  END IF;

  -- Add whatsapp field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_cards' AND column_name = 'whatsapp'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN whatsapp text;
  END IF;

  -- Add social_media_count field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_cards' AND column_name = 'social_media_count'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN social_media_count integer DEFAULT 0;
  END IF;

  -- Add media_count field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_cards' AND column_name = 'media_count'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN media_count integer DEFAULT 0;
  END IF;

  -- Add reviews_count field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_cards' AND column_name = 'reviews_count'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN reviews_count integer DEFAULT 0;
  END IF;

  -- Add average_rating field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_cards' AND column_name = 'average_rating'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN average_rating decimal(3,2) DEFAULT 0;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_items_card_id ON media_items(card_id);
CREATE INDEX IF NOT EXISTS idx_media_items_type ON media_items(type);
CREATE INDEX IF NOT EXISTS idx_media_items_active ON media_items(is_active);
CREATE INDEX IF NOT EXISTS idx_reviews_card_id ON reviews(card_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_active ON reviews(is_active);
CREATE INDEX IF NOT EXISTS idx_card_views_card_id ON card_views(card_id);
CREATE INDEX IF NOT EXISTS idx_card_views_viewed_at ON card_views(viewed_at);

-- Enable Row Level Security
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_views ENABLE ROW LEVEL SECURITY;

-- Media items policies
CREATE POLICY "Users can manage media for own cards"
  ON media_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_cards 
      WHERE business_cards.id = media_items.card_id 
      AND business_cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read media for published cards"
  ON media_items
  FOR SELECT
  TO anon
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM business_cards 
      WHERE business_cards.id = media_items.card_id 
      AND business_cards.is_published = true
    )
  );

-- Reviews policies
CREATE POLICY "Users can manage reviews for own cards"
  ON reviews
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_cards 
      WHERE business_cards.id = reviews.card_id 
      AND business_cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read active reviews for published cards"
  ON reviews
  FOR SELECT
  TO anon
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM business_cards 
      WHERE business_cards.id = reviews.card_id 
      AND business_cards.is_published = true
    )
  );

-- Card views policies
CREATE POLICY "Users can read views for own cards"
  ON card_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_cards 
      WHERE business_cards.id = card_views.card_id 
      AND business_cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert card views"
  ON card_views
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Functions for updating counts
CREATE OR REPLACE FUNCTION update_card_counts()
RETURNS trigger AS $$
BEGIN
  -- Update social media count
  UPDATE business_cards 
  SET social_media_count = (
    SELECT COUNT(*) FROM social_links 
    WHERE card_id = COALESCE(NEW.card_id, OLD.card_id) 
    AND is_active = true
  )
  WHERE id = COALESCE(NEW.card_id, OLD.card_id);

  -- Update media count
  UPDATE business_cards 
  SET media_count = (
    SELECT COUNT(*) FROM media_items 
    WHERE card_id = COALESCE(NEW.card_id, OLD.card_id) 
    AND is_active = true
  )
  WHERE id = COALESCE(NEW.card_id, OLD.card_id);

  -- Update reviews count and average rating
  UPDATE business_cards 
  SET 
    reviews_count = (
      SELECT COUNT(*) FROM reviews 
      WHERE card_id = COALESCE(NEW.card_id, OLD.card_id) 
      AND is_active = true
    ),
    average_rating = (
      SELECT COALESCE(AVG(rating), 0) FROM reviews 
      WHERE card_id = COALESCE(NEW.card_id, OLD.card_id) 
      AND is_active = true
    )
  WHERE id = COALESCE(NEW.card_id, OLD.card_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating counts
CREATE TRIGGER update_social_counts
  AFTER INSERT OR UPDATE OR DELETE ON social_links
  FOR EACH ROW EXECUTE FUNCTION update_card_counts();

CREATE TRIGGER update_media_counts
  AFTER INSERT OR UPDATE OR DELETE ON media_items
  FOR EACH ROW EXECUTE FUNCTION update_card_counts();

CREATE TRIGGER update_review_counts
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_card_counts();

-- Function to update updated_at timestamp for new tables
CREATE TRIGGER update_media_items_updated_at
  BEFORE UPDATE ON media_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage buckets for media files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'media',
    'media',
    true,
    52428800, -- 50MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  ),
  (
    'documents',
    'documents',
    true,
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
  )
ON CONFLICT (id) DO NOTHING;

-- Storage policies for media bucket
CREATE POLICY "Media files are publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id IN ('media', 'documents'));

CREATE POLICY "Users can upload media for their cards"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('media', 'documents') AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('media', 'documents') AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('media', 'documents') AND
    auth.uid()::text = (storage.foldername(name))[1]
  );