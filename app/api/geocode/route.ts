import { NextRequest, NextResponse } from "next/server";
import { getOsmTileUrl } from "../../lib/osm-map";

/**
 * Geocode UK address via Nominatim (free, no key).
 * Returns lat, lon and osmMapUrl (OSM tile for map fallback when no Street View).
 * Nominatim requires a valid User-Agent.
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address") || "";
  const postcode = searchParams.get("postcode") || "";

  if (!address.trim() && !postcode.trim()) {
    return NextResponse.json(
      {
        error: "Address or postcode required",
        lat: null,
        lon: null,
        osmMapUrl: null,
      },
      { status: 400 },
    );
  }

  const query = [address, postcode].filter(Boolean).join(", ") + ", UK";

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
        q: query,
        format: "json",
        limit: "1",
      })}`,
      {
        headers: {
          "User-Agent":
            "InvestIntel/1.0 (UK property portfolio; https://invest-intel.app)",
        },
      },
    );

    const data = await res.json();
    const first = Array.isArray(data) ? data[0] : null;
    if (!first?.lat || !first?.lon) {
      return NextResponse.json({
        lat: null,
        lon: null,
        osmMapUrl: null,
        message: "Address not found",
      });
    }

    const lat = parseFloat(first.lat);
    const lon = parseFloat(first.lon);
    const osmMapUrl = getOsmTileUrl(lat, lon, 17);

    return NextResponse.json({ lat, lon, osmMapUrl });
  } catch (error) {
    console.error("[Geocode] Error:", error);
    return NextResponse.json(
      { error: "Geocoding failed", lat: null, lon: null, osmMapUrl: null },
      { status: 500 },
    );
  }
}
