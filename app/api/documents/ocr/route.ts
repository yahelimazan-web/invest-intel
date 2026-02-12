import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

// =============================================================================
// OCR and Embedding Processing API Route
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const { documentId, userId, propertyId } = await request.json();

    if (!documentId || !userId) {
      return NextResponse.json(
        { success: false, error: "documentId and userId are required" },
        { status: 400 },
      );
    }

    if (!supabase || supabase === null) {
      return NextResponse.json(
        { success: false, error: "Supabase not initialized" },
        { status: 500 },
      );
    }

    // Get document from database
    const { data: doc, error: fetchError } = await supabase
      .from("property_documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 },
      );
    }

    // Get file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("property-documents")
      .download(doc.storage_path);

    if (downloadError || !fileData) {
      return NextResponse.json(
        { success: false, error: "Failed to download file" },
        { status: 500 },
      );
    }

    let extractedText = "";
    let embedding: number[] | null = null;
    let summary: string | null = null;
    let extractedData: { monthlyRent?: number; purchasePrice?: number } = {};

    // Process PDF files with OCR (pdf-parse v2: named export PDFParse, no default)
    if (doc.file_type === "application/pdf") {
      try {
        try {
          const { PDFParse } = await import("pdf-parse");
          const pdfBuffer = await fileData.arrayBuffer();
          const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
          const result = await parser.getText();
          extractedText = result?.text ?? "";
          await parser.destroy?.();
        } catch (importError) {
          console.warn("[OCR] pdf-parse not available:", importError);
        }
      } catch (pdfError) {
        console.error("[OCR] PDF parsing error:", pdfError);
      }
    }

    // Generate embedding using Gemini API (or OpenAI)
    if (extractedText) {
      try {
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (geminiApiKey) {
          // Use Gemini for embedding generation
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${geminiApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "models/embedding-001",
                content: {
                  parts: [{ text: extractedText.substring(0, 10000) }], // Limit to 10k chars
                },
              }),
            },
          );

          if (response.ok) {
            const embeddingData = await response.json();
            embedding = embeddingData.embedding?.values || null;
          }

          // Generate summary using Gemini
          const summaryResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `Summarize this property document in 2-3 sentences in Hebrew:\n\n${extractedText.substring(0, 5000)}`,
                      },
                    ],
                  },
                ],
              }),
            },
          );

          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            summary =
              summaryData.candidates?.[0]?.content?.parts?.[0]?.text || null;
          }

          // Extract structured data (monthly rent, purchase price) for property auto-population
          const textSample = extractedText.substring(0, 8000);
          const folderId = doc.folder_id || "";
          const extractPrompt =
            folderId === "rental" || folderId === "tenancy"
              ? `From this tenancy/rental agreement, extract the monthly rent in GBP. Return ONLY a JSON object: {"monthlyRent": number} or {"monthlyRent": null} if not found. Look for amounts like "£950 per month", "950 GBP", "rent: 950", etc.\n\n${textSample}`
              : folderId === "purchase" || folderId === "purchase-contracts"
                ? `From this purchase contract/sale document, extract the purchase price in GBP. Return ONLY a JSON object: {"purchasePrice": number} or {"purchasePrice": null} if not found. Look for amounts like "£180,000", "180000", "purchase price: 180000", etc.\n\n${textSample}`
                : `From this document, extract any monthly rent (GBP) and/or purchase price (GBP) if present. Return ONLY a JSON object: {"monthlyRent": number|null, "purchasePrice": number|null}.\n\n${textSample}`;

          try {
            const extractResponse = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: extractPrompt }] }],
                  generationConfig: { maxOutputTokens: 128 },
                }),
              }
            );
            if (extractResponse.ok) {
              const extractData = await extractResponse.json();
              const rawText = extractData.candidates?.[0]?.content?.parts?.[0]?.text || "";
              const jsonMatch = rawText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (typeof parsed.monthlyRent === "number" && parsed.monthlyRent > 0) extractedData.monthlyRent = parsed.monthlyRent;
                if (typeof parsed.purchasePrice === "number" && parsed.purchasePrice > 0) extractedData.purchasePrice = parsed.purchasePrice;
              }
            }
          } catch (extractErr) {
            console.warn("[OCR] Extract structured data failed:", extractErr);
          }
        }
      } catch (aiError) {
        console.error("[OCR] AI processing error:", aiError);
        // Continue without embedding
      }
    }

    // Update document with extracted text, embedding, and summary
    // Note: PostgreSQL vector type requires special format
    const updateData: any = {
      extracted_text: extractedText || null,
      summary: summary,
      updated_at: new Date().toISOString(),
    };

    // Add embedding if available (PostgreSQL vector format: [1,2,3])
    if (embedding && Array.isArray(embedding)) {
      // Convert to PostgreSQL vector format string
      updateData.embedding = `[${embedding.join(",")}]`;
    }

    const { error: updateError } = await supabase
      .from("property_documents")
      .update(updateData)
      .eq("id", documentId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("[OCR] Update error:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update document" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      extractedText,
      hasEmbedding: !!embedding,
      summary,
      extractedData: extractedData ?? {},
      propertyId: propertyId ?? null,
    });
  } catch (error: any) {
    console.error("[OCR API] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Unknown error" },
      { status: 500 },
    );
  }
}
