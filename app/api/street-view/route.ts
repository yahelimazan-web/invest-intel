import { NextRequest, NextResponse } from "next/server";

/**
 * Google Street View Static API
 * Returns a thumbnail image URL for a UK address.
 * Requires GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address");
  const postcode = searchParams.get("postcode");

  if (!address && !postcode) {
    return NextResponse.json(
      { error: "Address or postcode required", imageUrl: null },
      { status: 400 },
    );
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === "your_google_key") {
    return NextResponse.json({
      imageUrl: null,
      message:
        "Google Maps API key not configured. Add GOOGLE_MAPS_API_KEY to .env.local",
    });
  }

  const location = [address, postcode].filter(Boolean).join(", ") + ", UK";
  const encodedLocation = encodeURIComponent(location);

  const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${encodedLocation}&key=${apiKey}`;

  return NextResponse.json({ imageUrl });
}
