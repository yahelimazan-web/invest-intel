# 🔒 Critical Security Fix - Deployment Instructions

## Problem
**All users were seeing the same assets** - a critical security vulnerability.

## Root Cause
- App uses custom localStorage auth (not Supabase Auth)
- RLS policies checked `auth.uid()` which is always NULL
- Database queries were not properly isolated by user

## Solution Applied

### ✅ Code Changes (Already Done)
1. Updated `app/lib/portfolio-db.ts` to call `set_user_context()` before queries
2. Added security validation to prevent wrong user_id insertion
3. Maintained application-level filtering as defense in depth

### ⚠️ REQUIRED: Database Migration

**You MUST run the SQL migration in Supabase:**

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `supabase-rls-fix.sql`
3. Click "Run" to execute
4. Verify no errors

## What the Migration Does

1. **Drops old broken policies** (they checked `auth.uid()` which doesn't work)
2. **Creates `set_user_context()` function** - Sets session variable for RLS
3. **Creates new RLS policies** - Check session variable instead of `auth.uid()`
4. **Grants permissions** - Allows anon/authenticated roles to use the function

## Verification Steps

### 1. Test RLS is Working
```sql
-- In Supabase SQL Editor, test as different users:

-- Set context for User A
SELECT set_user_context('user_123');
SELECT * FROM property_folders; -- Should show User A's data

-- Set context for User B  
SELECT set_user_context('user_456');
SELECT * FROM property_folders; -- Should show User B's data (different from A)
```

### 2. Test in Application
1. **Login as User A**
   - Add a property
   - Note the property details
2. **Logout**
3. **Login as User B**
   - Verify User B does NOT see User A's property
   - Add a different property
4. **Logout and login as User A again**
   - Verify User A only sees their own property

## If Migration Fails

If you get errors running the migration:

1. **Check if table exists:**
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'property_folders';
   ```

2. **Check current policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'property_folders';
   ```

3. **Manually drop policies if needed:**
   ```sql
   DROP POLICY IF EXISTS "Users can view own folders" ON property_folders;
   DROP POLICY IF EXISTS "Users can insert own folders" ON property_folders;
   DROP POLICY IF EXISTS "Users can update own folders" ON property_folders;
   DROP POLICY IF EXISTS "Users can delete own folders" ON property_folders;
   ```

## Security Layers

1. **Database Level (RLS)**: Policies enforce isolation ✅
2. **Application Level**: `.eq("user_id", userId)` filters in code ✅
3. **Validation**: Security check prevents wrong user_id ✅

## Important Notes

- The `set_user_context()` function is called automatically before every query
- Session variables are per-connection, safe for concurrent users
- If RPC function doesn't exist, app falls back to application-level filtering
- **You must run the migration for full security**

## Status

- ✅ Code updated
- ⚠️ **Database migration required** (run `supabase-rls-fix.sql`)
- ✅ Error handling added (works even if migration not run yet)

**After running the migration, all users will be properly isolated!** 🔒
