# Supabase Row Level Security (RLS) Setup Guide

## Problem
Error `42501`: "new row violates row-level security policy for table 'profiles'"

This occurs because Supabase has RLS (Row Level Security) policies enabled, and they're blocking the backend service from inserting profiles.

## Solution

### Step 1: Disable RLS for Backend Operations (if using SERVICE_ROLE_KEY)

The backend is already configured to use `SERVICE_ROLE_KEY` which should bypass RLS. However, if RLS policies are too strict, they might still block operations.

### Step 2: Configure Proper RLS Policies

Go to Supabase Dashboard → SQL Editor and run these commands:

```sql
-- 1. Enable RLS on profiles table (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create policy for service role (backend) - ALLOW ALL
-- This allows the backend to perform all operations
CREATE POLICY "Backend service role can perform all operations"
ON profiles
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 3. Create policy for authenticated users - SELECT own profile
CREATE POLICY "Users can select their own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- 4. Create policy for authenticated users - UPDATE own profile
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Create policy for authenticated users - DELETE own profile
CREATE POLICY "Users can delete their own profile"
ON profiles
FOR DELETE
USING (auth.uid() = id);

-- 6. Allow public INSERT (for auth trigger to create profiles)
CREATE POLICY "Allow profile creation on signup"
ON profiles
FOR INSERT
WITH CHECK (true);
```

### Step 3: Apply Similar Policies to Other Tables

For each financial table, apply similar policies:

```sql
-- Financial Settings
ALTER TABLE financial_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Backend service role can perform all operations"
ON financial_settings
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can select their own financial settings"
ON financial_settings
FOR SELECT
USING (auth.uid() IN (SELECT id FROM profiles WHERE id = user_id));

CREATE POLICY "Users can manage their own financial settings"
ON financial_settings
FOR ALL
USING (user_id IN (SELECT id FROM profiles WHERE id = auth.uid()))
WITH CHECK (user_id IN (SELECT id FROM profiles WHERE id = auth.uid()));
```

### Step 4: Verify Configuration

1. Go to Supabase Dashboard
2. Navigate to **Authentication → Policies**
3. For each table, you should see:
   - `Backend service role can perform all operations` - allows ALL operations
   - `Users can select their own...` - allows users to see only their data
   - `Users can update their own...` - allows users to modify only their data
   - `Users can delete their own...` - allows users to delete only their data

## Quick Check in Supabase Dashboard

1. Go to **Database → Tables** section
2. Click on `profiles` table
3. In the **RLS section**, verify:
   - RLS is **Enabled**
   - Policies are configured as above
   - **No policy is blocking the backend** (SERVICE_ROLE should bypass, but explicit policy helps)

## Alternative: Simple Approach (Less Secure - NOT RECOMMENDED)

If you want to temporarily disable RLS for development:

```sql
-- ONLY FOR DEVELOPMENT - NOT FOR PRODUCTION
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE financial_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources DISABLE ROW LEVEL SECURITY;
-- ... repeat for all tables
```

## Backend Code Already Correct

Your backend code is already configured correctly:
- Uses `SERVICE_ROLE_KEY` for database operations (can bypass RLS)
- Uses `ANON_KEY` for auth operations (respects RLS)

The issue is likely that RLS policies are missing or incorrectly configured in Supabase.

## Testing After Setup

1. Clear browser localStorage
2. Try registering a new account
3. Try logging in
4. Check browser console and backend logs for errors

## Common Issues

### Issue: Still getting RLS errors after creating policies

**Solution:**
- Verify you're logged into the correct Supabase project
- Check that SERVICE_ROLE_KEY in .env matches the project
- Run policies again - sometimes they need to be re-applied
- Check if there are conflicting policies (delete old ones first)

### Issue: Policies were created but still failing

**Solution:**
- Restart backend server: `npm run dev`
- Make sure backend is using SERVICE_ROLE_KEY: Check logs for "✓ Supabase clients created successfully"
- Verify .env file has both ANON_KEY and SERVICE_ROLE_KEY

### Issue: Can't find SQL Editor in Supabase

**Solution:**
1. Go to supabase.com
2. Login to your project
3. Click on **SQL Editor** (left sidebar)
4. Click **+ New query**
5. Paste the SQL commands above
6. Run with Ctrl+Enter
