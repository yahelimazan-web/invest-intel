import { NextRequest, NextResponse } from "next/server";
import { uploadDocument } from "../../../lib/documents-db";

// =============================================================================
// Document Upload API Route
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const propertyId = formData.get("propertyId") as string;
    const folderId = formData.get("folderId") as string;
    const userId = formData.get("userId") as string;
    const tags = formData.get("tags")
      ? JSON.parse(formData.get("tags") as string)
      : [];

    if (!file || !propertyId || !folderId || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 10MB limit" },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "File type not allowed. Allowed: PDF, Images, Word docs",
        },
        { status: 400 },
      );
    }

    const result = await uploadDocument(userId, {
      file,
      propertyId,
      folderId,
      tags,
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("[Documents API] Upload error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Unknown error" },
      { status: 500 },
    );
  }
}
