-- =============================================================================
-- CRITICAL FIX: Row Level Security for Custom Auth System
-- =============================================================================
-- This fixes the issue where all users see the same assets.
-- The app uses custom localStorage auth, not Supabase Auth.
-- =============================================================================

-- Step 1: Drop existing RLS policies (they won't work with custom auth)
DROP POLICY IF EXISTS "Users can view own folders" ON property_folders;
DROP POLICY IF EXISTS "Users can insert own folders" ON property_folders;
DROP POLICY IF EXISTS "Users can update own folders" ON property_folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON property_folders;

-- Step 2: Create a function to set user context (for custom auth)
-- This allows us to pass user_id via a session variable
-- SECURITY DEFINER allows the function to set session variables
CREATE OR REPLACE FUNCTION set_user_context(user_id_param TEXT)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set session variable that RLS policies can check
  PERFORM set_config('app.user_id', user_id_param, false);
END;
$$;

-- Step 3: Create new RLS policies that work with custom auth
-- These policies check the session variable set by the application

-- SELECT Policy: Users can only see their own folders
CREATE POLICY "Users can view own folders"
  ON property_folders
  FOR SELECT
  USING (
    user_id = current_setting('app.user_id', true)
    OR user_id = current_setting('app.user_id', false)
  );

-- INSERT Policy: Users can only insert folders with their own user_id
CREATE POLICY "Users can insert own folders"
  ON property_folders
  FOR INSERT
  WITH CHECK (
    user_id = current_setting('app.user_id', true)
    OR user_id = current_setting('app.user_id', false)
  );

-- UPDATE Policy: Users can only update their own folders
CREATE POLICY "Users can update own folders"
  ON property_folders
  FOR UPDATE
  USING (
    user_id = current_setting('app.user_id', true)
    OR user_id = current_setting('app.user_id', false)
  )
  WITH CHECK (
    user_id = current_setting('app.user_id', true)
    OR user_id = current_setting('app.user_id', false)
  );

-- DELETE Policy: Users can only delete their own folders
CREATE POLICY "Users can delete own folders"
  ON property_folders
  FOR DELETE
  USING (
    user_id = current_setting('app.user_id', true)
    OR user_id = current_setting('app.user_id', false)
  );

-- Step 4: Verify RLS is enabled
ALTER TABLE property_folders ENABLE ROW LEVEL SECURITY;

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON property_folders TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_user_context(TEXT) TO anon, authenticated;

-- =============================================================================
-- IMPORTANT: Application Code Changes Required
-- =============================================================================
-- The application code must call set_user_context() before each query.
-- This is done in portfolio-db.ts by setting the session variable.
-- =============================================================================
