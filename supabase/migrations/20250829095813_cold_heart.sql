/*
  # Create Review Links Table

  1. New Tables
    - `review_links` - Simple table to store review links with titles

  2. Security
    - Enable RLS on review_links table
    - Add policies for authenticated users to manage their own review links
    - Allow public read access for published cards

  3. Changes
    - Remove complex review system
    - Replace with simple link-based system
*/

-- Create review_links table
CREATE TABLE IF NOT EXISTS review_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES business_cards(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  review_url text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_review_links_card_id ON review_links(card_id);
CREATE INDEX IF NOT EXISTS idx_review_links_active ON review_links(is_active);

-- Enable Row Level Security
ALTER TABLE review_links ENABLE ROW LEVEL SECURITY;

-- Review links policies
CREATE POLICY "Users can manage review links for own cards"
  ON review_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_cards 
      WHERE business_cards.id = review_links.card_id 
      AND business_cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read review links for published cards"
  ON review_links
  FOR SELECT
  TO anon
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM business_cards 
      WHERE business_cards.id = review_links.card_id 
      AND business_cards.is_published = true
    )
  );

-- Function to update updated_at timestamp
CREATE TRIGGER update_review_links_updated_at
  BEFORE UPDATE ON review_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Drop old reviews table if it exists (cleanup)
DROP TABLE IF EXISTS reviews CASCADE;

-- Remove review-related columns from business_cards table
DO $$
BEGIN
  -- Remove reviews_count column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_cards' AND column_name = 'reviews_count'
  ) THEN
    ALTER TABLE business_cards DROP COLUMN reviews_count;
  END IF;

  -- Remove average_rating column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_cards' AND column_name = 'average_rating'
  ) THEN
    ALTER TABLE business_cards DROP COLUMN average_rating;
  END IF;
END $$;