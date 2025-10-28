-- Migration: Remove salary and savings_goal from profiles table
-- Date: 2025-10-28
-- Description: Removes redundant salary and savings_goal columns from profiles table
-- since financial data is properly managed in financial_settings and savings_goals tables.
-- This fixes the architectural inconsistency where these columns were populated during
-- registration but never actually used in the business logic.

-- Step 1: Remove salary column from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS salary;

-- Step 2: Remove savings_goal column from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS savings_goal;

-- Step 3: Update the handle_new_user trigger to not include these fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.user_metadata->>'full_name', NEW.email))
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
END;
$$;

-- Verify: Check that profiles table has the correct columns
-- The profiles table should now have: id, email, full_name, avatar_url, created_at, updated_at
