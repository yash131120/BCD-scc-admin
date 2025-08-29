/*
  # Add Social Link Auto-Sync Tracking

  1. Changes
    - Add `is_auto_synced` column to `social_links` table to track which links are synced vs custom
    - Add `global_username` column to `profiles` table for centralized username management
    - Update existing social links to be marked as custom (not auto-synced)

  2. Security
    - No changes to existing RLS policies needed
    - New columns follow existing security model
*/

-- Add global_username to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'global_username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN global_username text UNIQUE;
  END IF;
END $$;

-- Add is_auto_synced to social_links table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_links' AND column_name = 'is_auto_synced'
  ) THEN
    ALTER TABLE social_links ADD COLUMN is_auto_synced boolean DEFAULT false;
  END IF;
END $$;

-- Mark all existing social links as custom (not auto-synced)
UPDATE social_links SET is_auto_synced = false WHERE is_auto_synced IS NULL;

-- Create index for global_username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_global_username ON profiles(global_username);
CREATE INDEX IF NOT EXISTS idx_social_links_auto_synced ON social_links(is_auto_synced);