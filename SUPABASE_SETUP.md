# Supabase Setup Guide for InvestIntel

## Quick Setup

1. **Install Supabase Client**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Run Database Migration**
   - Open your Supabase Dashboard
   - Go to SQL Editor
   - Copy and paste the contents of `supabase-migration.sql`
   - Click "Run" to create the `property_folders` table

3. **Environment Variables**
   Your `.env.local` already has:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ixhoqwhlgrbdnysojqnf.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_N4AHCWPypksgPClTJe2H5w_GSaefZy5
   ```

4. **Restart Dev Server**
   ```bash
   npm run dev
   ```

## How It Works

- **New Users**: Automatically get empty default folders ("מועדפים" and "במעקב")
- **Data Storage**: Portfolio data is saved to Supabase, with localStorage as a fallback
- **User Isolation**: Each user's portfolio is completely separate
- **Automatic Sync**: Changes are saved to Supabase with 1-second debouncing

## Fallback Behavior

If Supabase is not configured or unavailable, the app will:
- Use localStorage as a fallback
- Still maintain user-specific data separation
- Continue working normally

## Database Schema

The `property_folders` table stores:
- `user_id`: User identifier
- `folder_id`: Folder identifier (e.g., "favorites", "watching")
- `folder_name`: Display name
- `folder_color`: Color theme
- `folder_icon`: Icon name
- `properties`: JSONB array of property objects
- `created_at` / `updated_at`: Timestamps
