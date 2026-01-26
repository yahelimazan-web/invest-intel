-- InvestIntel Portfolio Database Schema v2 - Multi-Country Support
-- Run this SQL in your Supabase SQL Editor to add country field support

-- Add country column to properties JSONB (no schema change needed, just update app logic)
-- The country field will be stored in the properties JSONB array

-- Example migration: Update existing properties to have UK as default country
-- This is handled in the application code, but you can run this to set defaults:

-- Note: Since properties are stored as JSONB, we don't need to alter the table structure.
-- The country field is added to the SavedProperty interface in TypeScript.
-- Existing properties without a country will default to "UK" in the application.

-- If you want to ensure all existing properties have a country field, you can run:
UPDATE property_folders
SET properties = (
  SELECT jsonb_agg(
    CASE 
      WHEN prop->>'country' IS NULL THEN jsonb_set(prop, '{country}', '"UK"')
      ELSE prop
    END
  )
  FROM jsonb_array_elements(properties) AS prop
)
WHERE properties IS NOT NULL;

-- Verify the update
SELECT 
  user_id,
  folder_name,
  jsonb_array_length(properties) as property_count,
  jsonb_agg(prop->>'country') as countries
FROM property_folders,
LATERAL jsonb_array_elements(properties) AS prop
GROUP BY user_id, folder_name
LIMIT 10;
