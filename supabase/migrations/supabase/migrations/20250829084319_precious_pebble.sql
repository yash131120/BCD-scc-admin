/*
  # Add Missing Database Columns

  1. Changes
    - Add `name` column to `profiles` table if it doesn't exist
    - Add `whatsapp` column to `business_cards` table if it doesn't exist

  2. Security
    - No changes to existing RLS policies needed
    - Columns will inherit existing table security
*/

-- Add name column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN name text;
  END IF;
END $$;

-- Add whatsapp column to business_cards table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_cards' AND column_name = 'whatsapp'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN whatsapp text;
  END IF;
END $$;