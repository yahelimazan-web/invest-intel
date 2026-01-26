"use client";

let supabaseClient: any = null;

try {
  // Dynamic import to handle missing package gracefully
  const { createClient } = require("@supabase/supabase-js");
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    console.warn("Supabase environment variables not set. Portfolio will use localStorage fallback.");
  }
} catch (error) {
  console.warn("Supabase package not installed. Run: npm install @supabase/supabase-js");
}

export const supabase = supabaseClient;

// =============================================================================
// Database Types
// =============================================================================

export interface PropertyFolderRow {
  id: string;
  user_id: string;
  folder_id: string;
  folder_name: string;
  folder_color: string;
  folder_icon: string;
  properties: any; // JSONB
  created_at: string;
  updated_at: string;
}

export interface PropertyRow {
  id: string;
  user_id: string;
  folder_id: string;
  property_data: any; // JSONB
  created_at: string;
  updated_at: string;
}
