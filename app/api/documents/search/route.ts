import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

// =============================================================================
// Semantic Document Search API Route
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const { userId, propertyId, query, useSemantic = false } = await request.json();

    if (!userId || !propertyId || !query) {
      return NextResponse.json(
        { success: false, error: "userId, propertyId, and query are required" },
        { status: 400 }
      );
    }

    if (!supabase || supabase === null) {
      return NextResponse.json(
        { success: false, error: "Supabase not initialized" },
        { status: 500 }
      );
    }

    // Set user context
    try {
      await supabase.rpc('set_user_context', { user_id_param: userId });
    } catch (rpcError) {
      console.warn("[Documents Search] set_user_context RPC not available");
    }

    // If semantic search is requested, generate embedding for query
    if (useSemantic) {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (geminiApiKey) {
        try {
          // Generate embedding for search query
          const embeddingResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${geminiApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "models/embedding-001",
                content: {
                  parts: [{ text: query.substring(0, 10000) }],
                },
              }),
            }
          );

          if (embeddingResponse.ok) {
            const embeddingData = await embeddingResponse.json();
            const queryEmbedding = embeddingData.embedding?.values;

            if (queryEmbedding && Array.isArray(queryEmbedding)) {
              // Use semantic search function
              const { data, error } = await supabase.rpc('search_documents_by_semantics', {
                user_id_param: userId,
                property_id_param: propertyId,
                query_embedding: `[${queryEmbedding.join(',')}]`,
                similarity_threshold: 0.7,
                limit_results: 10,
              });

              if (error) {
                console.error("[Documents Search] Semantic search error:", error);
                // Fallback to text search
              } else if (data && data.length > 0) {
                return NextResponse.json({
                  success: true,
                  documents: data,
                  searchType: "semantic",
                });
              }
            }
          }
        } catch (semanticError) {
          console.error("[Documents Search] Semantic search failed, falling back to text:", semanticError);
          // Fallback to text search below
        }
      }
    }

    // Fallback to full-text search
    const { data, error } = await supabase
      .from("property_documents")
      .select("*")
      .eq("user_id", userId)
      .eq("property_id", propertyId)
      .or(`extracted_text.ilike.%${query}%,file_name.ilike.%${query}%,summary.ilike.%${query}%`)
      .order("uploaded_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[Documents Search] Text search error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documents: data || [],
      searchType: "text",
    });
  } catch (error: any) {
    console.error("[Documents Search API] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
