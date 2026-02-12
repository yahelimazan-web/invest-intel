import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/properties/[id] — Update property data (mock/simulation).
 * In production, this would persist to a database.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      "purchasePrice",
      "annualYieldPercent",
      "monthlyRent",
      "title",
      "address",
      "purchaseDate",
      "status",
      "image",
    ];
    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body && body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Mock: simulate successful update (no actual DB write)
    return NextResponse.json({
      success: true,
      id,
      updated: updates,
    });
  } catch (error: any) {
    console.error("[Properties API] PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
