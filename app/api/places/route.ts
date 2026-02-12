import { NextRequest, NextResponse } from "next/server";

// =============================================================================
// Google Places API - Infrastructure Data
// =============================================================================

interface PlaceResult {
  name: string;
  address: string;
  distance: number; // in meters
  type: "transport" | "education" | "healthcare";
  rating?: number;
  placeId?: string;
}

/**
 * Find infrastructure near a property using Google Places API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius") || "1500"; // 1.5km default

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "lat and lng are required" },
        { status: 400 },
      );
    }

    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!googleApiKey) {
      console.warn("[Places] Google Maps API key not configured");
      return NextResponse.json({
        transport: [],
        education: [],
        healthcare: [],
        error: "Google Maps API key not configured",
      });
    }

    const infrastructure: {
      transport: PlaceResult[];
      education: PlaceResult[];
      healthcare: PlaceResult[];
    } = {
      transport: [],
      education: [],
      healthcare: [],
    };

    // Search for different infrastructure types
    const placeTypes = [
      {
        type: "transport" as const,
        query: "train_station|subway_station|bus_station",
      },
      { type: "education" as const, query: "school|university" },
      { type: "healthcare" as const, query: "hospital|pharmacy|doctor" },
    ];

    for (const { type, query } of placeTypes) {
      try {
        // Use Places Nearby Search
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${query}&key=${googleApiKey}`,
          {
            next: { revalidate: 3600 }, // Cache for 1 hour
          },
        );

        if (!response.ok) {
          console.error(`[Places] Failed to fetch ${type}:`, response.status);
          continue;
        }

        const data = await response.json();

        if (data.results && Array.isArray(data.results)) {
          infrastructure[type] = data.results.slice(0, 5).map((place: any) => {
            // Calculate distance (simple approximation)
            const placeLat = place.geometry?.location?.lat;
            const placeLng = place.geometry?.location?.lng;
            let distance = 0;

            if (placeLat && placeLng) {
              // Haversine formula for distance
              const R = 6371e3; // Earth radius in meters
              const φ1 = (parseFloat(lat) * Math.PI) / 180;
              const φ2 = (placeLat * Math.PI) / 180;
              const Δφ = ((placeLat - parseFloat(lat)) * Math.PI) / 180;
              const Δλ = ((placeLng - parseFloat(lng)) * Math.PI) / 180;

              const a =
                Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) *
                  Math.cos(φ2) *
                  Math.sin(Δλ / 2) *
                  Math.sin(Δλ / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

              distance = R * c; // Distance in meters
            }

            return {
              name: place.name || "Unknown",
              address: place.vicinity || place.formatted_address || "",
              distance: Math.round(distance),
              type,
              rating: place.rating,
              placeId: place.place_id,
            };
          });
        }
      } catch (error) {
        console.error(`[Places] Error fetching ${type}:`, error);
      }
    }

    return NextResponse.json(infrastructure);
  } catch (error: any) {
    console.error("[Places] API error:", error);
    return NextResponse.json(
      { error: error?.message || "Unknown error" },
      { status: 500 },
    );
  }
}
