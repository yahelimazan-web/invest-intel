import { NextRequest, NextResponse } from "next/server";

/**
 * Property Enrichment API
 * Fetches EPC rating, Land Registry, Street View image, static map, and OSM map
 * for UK properties. No generic photos — Street View or map of exact location only.
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address") || "";
  const postcode = searchParams.get("postcode") || "";

  if (!postcode.trim()) {
    return NextResponse.json(
      {
        error: "Postcode required",
        epc: null,
        landRegistry: null,
        streetViewUrl: null,
        staticMapUrl: null,
        osmMapUrl: null,
      },
      { status: 400 },
    );
  }

  const cleanPostcode = postcode.replace(/\s+/g, "").toUpperCase();
  const baseUrl =
    request.nextUrl.origin ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  const location = [address, cleanPostcode].filter(Boolean).join(", ") + ", UK";

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasGoogleKey = apiKey && apiKey !== "your_google_key";

  try {
    const fetches: Promise<unknown>[] = [
      fetch(
        `${baseUrl}/api/epc?postcode=${cleanPostcode}&address=${encodeURIComponent(address)}`,
      ),
      fetch(`${baseUrl}/api/land-registry?postcode=${cleanPostcode}&limit=20`),
      fetch(
        `${baseUrl}/api/street-view?address=${encodeURIComponent(address)}&postcode=${cleanPostcode}`,
      ),
      fetch(
        `${baseUrl}/api/geocode?address=${encodeURIComponent(address)}&postcode=${cleanPostcode}`,
      ),
    ];

    const [epcRes, landRes, streetRes, geocodeRes] =
      await Promise.allSettled(fetches);

    const epc =
      epcRes.status === "fulfilled" && epcRes.value.ok
        ? await (epcRes.value as Response).json()
        : null;
    const landRegistry =
      landRes.status === "fulfilled" && landRes.value.ok
        ? await (landRes.value as Response).json()
        : null;
    const streetView =
      streetRes.status === "fulfilled" && streetRes.value.ok
        ? await (streetRes.value as Response).json()
        : null;
    const geocode =
      geocodeRes.status === "fulfilled" && geocodeRes.value.ok
        ? await (geocodeRes.value as Response).json()
        : null;

    const extracted = epc?.extracted || epc?.bestMatch;
    const epcRating =
      extracted?.["current-energy-rating"] ?? extracted?.energyRating ?? null;

    const sales = landRegistry?.sales || [];
    const addressLower = address.toLowerCase();
    const matchingSale =
      sales.find(
        (s: { address: string }) =>
          s.address &&
          addressLower
            .split(/\s+/)
            .slice(0, 3)
            .every((part: string) => s.address.toLowerCase().includes(part)),
      ) || sales[0];

    const lastSoldPrice = matchingSale?.price ?? null;
    const lastSoldDate = matchingSale?.date ?? null;
    const propertyType = matchingSale?.propertyType ?? null;

    const streetViewUrl = streetView?.imageUrl ?? null;
    const osmMapUrl = geocode?.osmMapUrl ?? null;

    let staticMapUrl: string | null = null;
    if (hasGoogleKey) {
      staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(location)}&zoom=17&size=400x300&scale=2&maptype=roadmap&key=${apiKey}`;
    }

    return NextResponse.json({
      epcRating,
      lastSoldPrice,
      lastSoldDate,
      propertyType,
      streetViewUrl,
      staticMapUrl,
      osmMapUrl,
      source: "UK Gov (EPC, Land Registry) + Google Street View + OSM",
    });
  } catch (error) {
    console.error("[Property Enrichment] Error:", error);
    return NextResponse.json(
      {
        error: "Enrichment failed",
        epcRating: null,
        lastSoldPrice: null,
        propertyType: null,
        streetViewUrl: null,
        staticMapUrl: null,
        osmMapUrl: null,
      },
      { status: 500 },
    );
  }
}
