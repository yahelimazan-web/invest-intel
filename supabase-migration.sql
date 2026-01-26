-- InvestIntel Portfolio Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create property_folders table
CREATE TABLE IF NOT EXISTS property_folders (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  folder_name TEXT NOT NULL,
  folder_color TEXT NOT NULL,
  folder_icon TEXT NOT NULL,
  properties JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, folder_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_property_folders_user_id ON property_folders(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE property_folders ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own folders
CREATE POLICY "Users can view own folders"
  ON property_folders
  FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Create policy: Users can insert their own folders
CREATE POLICY "Users can insert own folders"
  ON property_folders
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Create policy: Users can update their own folders
CREATE POLICY "Users can update own folders"
  ON property_folders
  FOR UPDATE
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Create policy: Users can delete their own folders
CREATE POLICY "Users can delete own folders"
  ON property_folders
  FOR DELETE
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_property_folders_updated_at
  BEFORE UPDATE ON property_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
