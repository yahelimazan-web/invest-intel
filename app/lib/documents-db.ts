"use client";

import { supabase } from "./supabase";

// =============================================================================
// Types
// =============================================================================

export interface PropertyDocument {
  id: string;
  user_id: string;
  property_id: string;
  folder_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  extracted_text?: string | null;
  embedding?: number[] | null;
  summary?: string | null;
  uploaded_at: string;
  updated_at: string;
  tags?: string[] | null;
  // Client-side only
  url?: string; // Signed URL for viewing
}

export interface DocumentUpload {
  file: File;
  propertyId: string;
  folderId: string;
  tags?: string[];
}

// =============================================================================
// Document Database Functions
// =============================================================================

/**
 * Load all documents for a property
 * Optionally filter by folder name
 */
export async function loadPropertyDocuments(
  userId: string,
  propertyId: string,
  folderName?: string
): Promise<PropertyDocument[]> {
  if (!supabase || supabase === null) {
    console.warn("[Documents] Supabase not initialized");
    return [];
  }

  try {
    // Set user context for RLS
    try {
      await supabase.rpc('set_user_context', { user_id_param: userId });
    } catch (rpcError) {
      console.warn("[Documents] set_user_context RPC not available");
    }

    let query = supabase
      .from("property_documents")
      .select("*")
      .eq("user_id", userId)
      .eq("property_id", propertyId);
    
    // Filter by folder if provided
    if (folderName) {
      query = query.eq("folder_id", folderName);
    }
    
    const { data, error } = await query.order("uploaded_at", { ascending: false });

    if (error) {
      console.error("[Documents] Error loading documents:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Generate signed URLs for each document
    const documents = data as PropertyDocument[];
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        try {
          const { data: urlData } = await supabase.storage
            .from("property-documents")
            .createSignedUrl(doc.storage_path, 3600); // 1 hour expiry

          return {
            ...doc,
            url: urlData?.signedUrl || null,
          };
        } catch (urlError) {
          console.error("[Documents] Error generating signed URL:", urlError);
          return { ...doc, url: null };
        }
      })
    );

    return documentsWithUrls;
  } catch (error) {
    console.error("[Documents] Failed to load documents:", error);
    return [];
  }
}

/**
 * Upload a document to Supabase Storage and create database record
 */
export async function uploadDocument(
  userId: string,
  upload: DocumentUpload
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  if (!supabase || supabase === null) {
    return { success: false, error: "Supabase not initialized" };
  }

  try {
    // Set user context
    try {
      await supabase.rpc('set_user_context', { user_id_param: userId });
    } catch (rpcError) {
      console.warn("[Documents] set_user_context RPC not available");
    }

    // Generate unique file path with folder structure: /{user_id}/{property_id}/{folder_name}/{file_name}
    const fileExt = upload.file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    // Use folder_id as folder_name in storage path
    const storagePath = `${userId}/${upload.propertyId}/${upload.folderId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("property-documents")
      .upload(storagePath, upload.file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("[Documents] Storage upload error:", uploadError);
      return { success: false, error: uploadError.message };
    }

    // Create database record
    const { data: docData, error: dbError } = await supabase
      .from("property_documents")
      .insert({
        user_id: userId,
        property_id: upload.propertyId,
        folder_id: upload.folderId,
        file_name: upload.file.name,
        file_type: upload.file.type || 'application/octet-stream',
        file_size: upload.file.size,
        storage_path: storagePath,
        tags: upload.tags || [],
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if DB insert fails
      await supabase.storage
        .from("property-documents")
        .remove([storagePath]);
      
      console.error("[Documents] Database insert error:", dbError);
      return { success: false, error: dbError.message };
    }

    return { success: true, documentId: docData.id };
  } catch (error: any) {
    console.error("[Documents] Failed to upload document:", error);
    return { success: false, error: error?.message || "Unknown error" };
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(
  userId: string,
  documentId: string
): Promise<boolean> {
  if (!supabase || supabase === null) {
    return false;
  }

  try {
    // Set user context
    try {
      await supabase.rpc('set_user_context', { user_id_param: userId });
    } catch (rpcError) {
      console.warn("[Documents] set_user_context RPC not available");
    }

    // Get document to find storage path
    const { data: doc, error: fetchError } = await supabase
      .from("property_documents")
      .select("storage_path")
      .eq("id", documentId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !doc) {
      console.error("[Documents] Error fetching document:", fetchError);
      return false;
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("property-documents")
      .remove([doc.storage_path]);

    if (storageError) {
      console.error("[Documents] Storage delete error:", storageError);
      // Continue to delete DB record anyway
    }

    // Delete database record
    const { error: dbError } = await supabase
      .from("property_documents")
      .delete()
      .eq("id", documentId)
      .eq("user_id", userId);

    if (dbError) {
      console.error("[Documents] Database delete error:", dbError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Documents] Failed to delete document:", error);
    return false;
  }
}

/**
 * Rename a document (update file_name)
 */
export async function renameDocument(
  userId: string,
  documentId: string,
  newFileName: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || supabase === null) {
    return { success: false, error: "Supabase not initialized" };
  }

  try {
    try {
      await supabase.rpc('set_user_context', { user_id_param: userId });
    } catch (rpcError) {
      console.warn("[Documents] set_user_context RPC not available");
    }

    const { error } = await supabase
      .from("property_documents")
      .update({ file_name: newFileName.trim(), updated_at: new Date().toISOString() })
      .eq("id", documentId)
      .eq("user_id", userId);

    if (error) {
      console.error("[Documents] Rename error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error: any) {
    console.error("[Documents] Failed to rename document:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * Search documents by semantic similarity (requires embedding)
 */
export async function searchDocumentsSemantically(
  userId: string,
  propertyId: string,
  queryEmbedding: number[],
  threshold: number = 0.7,
  limit: number = 10
): Promise<PropertyDocument[]> {
  if (!supabase || supabase === null) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('search_documents_by_semantics', {
      user_id_param: userId,
      property_id_param: propertyId,
      query_embedding: queryEmbedding,
      similarity_threshold: threshold,
      limit_results: limit,
    });

    if (error) {
      console.error("[Documents] Semantic search error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[Documents] Failed to search documents:", error);
    return [];
  }
}

/**
 * Full-text search in document content
 */
export async function searchDocumentsByText(
  userId: string,
  propertyId: string,
  searchQuery: string
): Promise<PropertyDocument[]> {
  if (!supabase || supabase === null) {
    return [];
  }

  try {
    // Set user context
    try {
      await supabase.rpc('set_user_context', { user_id_param: userId });
    } catch (rpcError) {
      console.warn("[Documents] set_user_context RPC not available");
    }

    const { data, error } = await supabase
      .from("property_documents")
      .select("*")
      .eq("user_id", userId)
      .eq("property_id", propertyId)
      .or(`extracted_text.ilike.%${searchQuery}%,file_name.ilike.%${searchQuery}%`)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("[Documents] Text search error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[Documents] Failed to search documents:", error);
    return [];
  }
}
