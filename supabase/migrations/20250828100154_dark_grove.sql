/*
  # Add missing avatar_url column to profiles table

  1. Changes
    - Add `avatar_url` column to `profiles` table
    - Set column type as text with null values allowed

  2. Notes
    - This fixes the missing column error in the admin panel
    - Column should have been created in the initial migration but was missing
*/

-- Add avatar_url column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
END $$;