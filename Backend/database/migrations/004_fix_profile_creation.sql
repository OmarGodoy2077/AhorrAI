-- Migration: Fix profile creation trigger
-- Description: Improves profile creation reliability and RLS handling

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate function with better error handling and explicit RLS bypass
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- This ensures the function runs with owner privileges
SET search_path = public -- Explicitly set search path for security
AS $$
BEGIN
    -- Attempt to create profile with explicit error handling
    BEGIN
        INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE 
        SET 
            email = EXCLUDED.email,
            full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
            updated_at = NOW();
            
        RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
        -- Log error details to the Postgres log
        RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW; -- Still return NEW to allow user creation even if profile fails
    END;
END;
$$;

-- Recreate trigger with explicit schema reference
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Ensure proper RLS policies
DROP POLICY IF EXISTS "Service role has full access" ON public.profiles;
CREATE POLICY "Service role has full access" 
    ON public.profiles 
    AS PERMISSIVE
    FOR ALL 
    TO service_role 
    USING (true)
    WITH CHECK (true);

-- Add an index to improve profile lookup performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- Verify no duplicate triggers exist
DO $$
BEGIN
    IF (
        SELECT COUNT(*) 
        FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) > 1 THEN
        RAISE EXCEPTION 'Duplicate triggers found';
    END IF;
END
$$;