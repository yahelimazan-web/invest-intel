"use client";

import { supabase } from "./supabase";

// =============================================================================
// Types
// =============================================================================

// Supported countries
export type Country = "UK" | "Israel" | "USA" | "Cyprus" | "Greece" | "Portugal" | "Georgia";

export interface SavedProperty {
  id: string;
  country: Country; // REQUIRED - Multi-country support
  postcode: string;
  address: string;
  energyRating?: string | null;
  propertyType?: string | null;
  floorArea?: number | null;
  lastPrice?: number | null;
  purchasePrice?: number | null;
  monthlyRent?: number | null;
  status?: "owned" | "watching" | "sold";
  purchaseDate?: string | null;
  addedAt: string;
  notes?: string;
}

export interface PropertyFolder {
  id: string;
  name: string;
  color: string;
  icon: string;
  properties: SavedProperty[];
  createdAt: string;
}

// =============================================================================
// Portfolio Database Functions
// =============================================================================

/**
 * Load all folders for a user from Supabase ONLY
 * NO localStorage fallback - forces database-only access
 */
export async function loadUserFolders(userId: string): Promise<PropertyFolder[]> {
  console.log("[Portfolio DB] loadUserFolders called with userId:", userId);
  
  // Graceful fallback if Supabase is not initialized
  if (!supabase || supabase === null) {
    console.warn("[Portfolio DB] Supabase not initialized. Returning default folders.");
    return getDefaultFolders();
  }

  try {
    // CRITICAL: Set user context for RLS before query
    // This ensures RLS policies filter by user_id
    try {
      await supabase.rpc('set_user_context', { user_id_param: userId });
      console.log("[Portfolio DB] User context set successfully");
    } catch (rpcError) {
      // If RPC function doesn't exist yet (migration not run), continue with app-level filtering
      console.warn("[Portfolio DB] set_user_context RPC not available. Using application-level filtering only. Run supabase-rls-fix.sql");
    }
    
    console.log("[Portfolio DB] Querying property_folders for user_id:", userId);
    const { data, error } = await supabase
      .from("property_folders")
      .select("*")
      .eq("user_id", userId) // Application-level filter (defense in depth)
      .order("created_at", { ascending: true });

    console.log("[Portfolio DB] Supabase query result - data:", data);
    console.log("[Portfolio DB] Supabase query result - error:", error);

    if (error) {
      console.error("[Portfolio DB] Error loading folders from Supabase:", error);
      // Graceful fallback on error
      return getDefaultFolders();
    }

    if (!data || data.length === 0) {
      console.log("[Portfolio DB] No folders found, initializing default folders");
      // Initialize with default folders for new users
      return await initializeUserFolders(userId);
    }

    console.log("[Portfolio DB] Processing", data.length, "folder rows");

    // Transform database rows to PropertyFolder format
    const foldersMap = new Map<string, PropertyFolder>();
    
    data.forEach((row: any) => {
      const folderId = row.folder_id;
      console.log("[Portfolio DB] Processing row - folder_id:", folderId, "properties:", row.properties);
      
      if (!foldersMap.has(folderId)) {
        foldersMap.set(folderId, {
          id: folderId,
          name: row.folder_name,
          color: row.folder_color,
          icon: row.folder_icon,
          properties: [],
          createdAt: row.created_at,
        });
      }
      
      // Add properties from this row
      // Properties might be stored as JSONB string, so try to parse if needed
      let propertiesArray = row.properties;
      
      if (typeof propertiesArray === 'string') {
        try {
          propertiesArray = JSON.parse(propertiesArray);
          console.log("[Portfolio DB] Parsed properties from JSON string");
        } catch (e) {
          console.warn("[Portfolio DB] Failed to parse properties JSON:", e);
          propertiesArray = null;
        }
      }
      
      if (propertiesArray && Array.isArray(propertiesArray)) {
        console.log(`[Portfolio DB] Adding ${propertiesArray.length} properties to folder ${folderId}`);
        foldersMap.get(folderId)!.properties.push(...propertiesArray);
      } else if (propertiesArray) {
        console.warn("[Portfolio DB] Properties is not an array:", typeof propertiesArray, propertiesArray);
      } else {
        console.log(`[Portfolio DB] No properties found for folder ${folderId}`);
      }
    });

    const result = Array.from(foldersMap.values());
    console.log("[Portfolio DB] Final folders result:", result);
    console.log("[Portfolio DB] Total properties across all folders:", result.reduce((sum, f) => sum + (f.properties?.length || 0), 0));
    
    return result;
  } catch (error) {
    console.error("[Portfolio DB] Failed to load folders from Supabase:", error);
    // Return empty default folders - NO localStorage fallback
    return getDefaultFolders();
  }
}

/**
 * Save folders to Supabase ONLY
 * NO localStorage fallback - forces database-only access
 */
export async function saveUserFolders(userId: string, folders: PropertyFolder[]): Promise<boolean> {
  // Graceful fallback if Supabase is not initialized
  if (!supabase || supabase === null) {
    console.warn("[Portfolio] Supabase not initialized. Cannot save folders.");
    return false;
  }

  try {
    // CRITICAL: Set user context for RLS before operations
    try {
      await supabase.rpc('set_user_context', { user_id_param: userId });
    } catch (rpcError) {
      // If RPC function doesn't exist yet (migration not run), continue with app-level filtering
      console.warn("set_user_context RPC not available. Using application-level filtering only. Run supabase-rls-fix.sql");
    }
    
    // Delete existing folders for this user
    const { error: deleteError } = await supabase
      .from("property_folders")
      .delete()
      .eq("user_id", userId); // Application-level filter (defense in depth)

    if (deleteError) {
      console.error("Error deleting old folders:", deleteError);
      // Continue anyway - might be first save
    }

    // Insert new folders
    const rows = folders.flatMap((folder) => ({
      user_id: userId,
      folder_id: folder.id,
      folder_name: folder.name,
      folder_color: folder.color,
      folder_icon: folder.icon,
      properties: folder.properties,
      created_at: folder.createdAt,
      updated_at: new Date().toISOString(),
    }));

    if (rows.length > 0) {
      // CRITICAL: Verify all rows have correct user_id (security check)
      const allRowsHaveCorrectUserId = rows.every(row => row.user_id === userId);
      if (!allRowsHaveCorrectUserId) {
        console.error("Security violation: Attempted to insert folder with different user_id");
        return false;
      }
      
      const { error } = await supabase
        .from("property_folders")
        .insert(rows);

      if (error) {
        console.error("Error saving folders to Supabase:", error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Failed to save folders to Supabase:", error);
    return false;
  }
}

/**
 * Delete a property from a folder
 */
export async function deleteProperty(userId: string, folderId: string, propertyId: string): Promise<boolean> {
  // Graceful fallback if Supabase is not initialized
  if (!supabase || supabase === null) {
    console.warn("[Portfolio] Supabase not initialized. Cannot delete property.");
    return false;
  }

  try {
    // Load current folders
    const folders = await loadUserFolders(userId);
    
    // Find and update the folder
    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
      console.error("Folder not found:", folderId);
      return false;
    }

    // Remove the property
    folder.properties = folder.properties.filter(p => p.id !== propertyId);

    // Save updated folders
    return await saveUserFolders(userId, folders);
  } catch (error) {
    console.error("Failed to delete property:", error);
    return false;
  }
}

/**
 * Update a property in a folder
 */
export async function updateProperty(
  userId: string, 
  folderId: string, 
  propertyId: string, 
  updates: Partial<SavedProperty>
): Promise<boolean> {
  // Graceful fallback if Supabase is not initialized
  if (!supabase || supabase === null) {
    console.warn("[Portfolio] Supabase not initialized. Cannot update property.");
    return false;
  }

  try {
    // Load current folders
    const folders = await loadUserFolders(userId);
    
    // Find and update the folder
    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
      console.error("Folder not found:", folderId);
      return false;
    }

    // Update the property
    const propertyIndex = folder.properties.findIndex(p => p.id === propertyId);
    if (propertyIndex === -1) {
      console.error("Property not found:", propertyId);
      return false;
    }

    folder.properties[propertyIndex] = {
      ...folder.properties[propertyIndex],
      ...updates,
    };

    // Save updated folders
    return await saveUserFolders(userId, folders);
  } catch (error) {
    console.error("Failed to update property:", error);
    return false;
  }
}

/**
 * Initialize default folders for a new user
 */
async function initializeUserFolders(userId: string): Promise<PropertyFolder[]> {
  const defaultFolders = getDefaultFolders();
  
  // Save to database
  await saveUserFolders(userId, defaultFolders);
  
  return defaultFolders;
}

/**
 * Get default folders structure
 */
function getDefaultFolders(): PropertyFolder[] {
  return [
    {
      id: "favorites",
      name: "מועדפים",
      color: "pink",
      icon: "heart",
      properties: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "watching",
      name: "במעקב",
      color: "amber",
      icon: "star",
      properties: [],
      createdAt: new Date().toISOString(),
    },
  ];
}
