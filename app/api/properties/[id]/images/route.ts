import { NextRequest, NextResponse } from "next/server";
import { loadPropertyDocuments } from "../../../../lib/documents-db";

const IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * GET /api/properties/[id]/images
 * Returns image URLs from uploaded documents for a property (Zoopla-style gallery).
 * Query: userId (required for Supabase RLS)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;
    const userId = request.nextUrl.searchParams.get("userId") ?? "anon";

    const docs = await loadPropertyDocuments(userId, propertyId);
    const imageUrls = docs
      .filter((d) => IMAGE_TYPES.includes(d.file_type) && d.url)
      .map((d) => d.url as string)
      .filter(Boolean);

    return NextResponse.json({ imageUrls });
  } catch (error: any) {
    console.error("[Properties Images] Error:", error);
    return NextResponse.json(
      { imageUrls: [], error: error?.message },
      { status: 500 }
    );
  }
}
