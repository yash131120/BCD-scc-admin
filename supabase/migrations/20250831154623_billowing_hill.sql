/*
  # Fix Business Card Slug Uniqueness Issue

  1. Problem
    - Multiple users creating cards with same username causes conflicts
    - Cards not showing when different users have same slug

  2. Solution
    - Ensure each user can only have one business card
    - Add unique constraint on user_id for business_cards
    - Update slug generation to be more robust
    - Add proper error handling for duplicate slugs

  3. Security
    - Maintain existing RLS policies
    - Ensure users can only access their own cards
*/

-- Add unique constraint on user_id to ensure one card per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'business_cards_user_id_unique'
    AND table_name = 'business_cards'
  ) THEN
    ALTER TABLE business_cards ADD CONSTRAINT business_cards_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Update the slug generation function to be more robust
CREATE OR REPLACE FUNCTION generate_unique_slug(input_text text, table_name text, user_id_param uuid DEFAULT NULL)
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
  -- Exclude current user's card if updating
  WHILE EXISTS (
    SELECT 1 FROM business_cards 
    WHERE slug = final_slug 
    AND (user_id_param IS NULL OR user_id != user_id_param)
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger function to pass user_id
CREATE OR REPLACE FUNCTION set_card_slug()
RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_unique_slug(COALESCE(NEW.title, 'card'), 'business_cards', NEW.user_id);
  ELSE
    -- Check if the provided slug is unique (excluding current card)
    IF TG_OP = 'UPDATE' THEN
      -- For updates, allow keeping the same slug
      IF OLD.slug != NEW.slug THEN
        NEW.slug := generate_unique_slug(NEW.slug, 'business_cards', NEW.user_id);
      END IF;
    ELSE
      -- For inserts, ensure uniqueness
      NEW.slug := generate_unique_slug(NEW.slug, 'business_cards', NEW.user_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger to work on both INSERT and UPDATE
DROP TRIGGER IF EXISTS set_business_card_slug ON business_cards;
CREATE TRIGGER set_business_card_slug
  BEFORE INSERT OR UPDATE ON business_cards
  FOR EACH ROW EXECUTE FUNCTION set_card_slug();

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add name column to profiles table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN name text;
  END IF;

  -- Add whatsapp column to business_cards table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_cards' AND column_name = 'whatsapp'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN whatsapp text;
  END IF;
END $$;