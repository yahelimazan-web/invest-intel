import { NextRequest, NextResponse } from "next/server";

/**
 * EPC Register API Proxy
 *
 * Proxies requests to the UK Government EPC API to bypass CORS restrictions.
 * Uses server-side environment variable for secure API key handling.
 *
 * UK Gov API Documentation: https://epc.opendatacommunities.org/docs/api
 * Authorization: Basic Auth with Base64 encoded API key
 */

const EPC_API_URL =
  "https://epc.opendatacommunities.org/api/v1/domestic/search";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const postcode = searchParams.get("postcode");
  const address = searchParams.get("address");

  // Validate postcode
  if (!postcode) {
    return NextResponse.json(
      {
        error: "Postcode is required",
        code: "MISSING_POSTCODE",
        message: "נא להזין מיקוד",
      },
      { status: 400 },
    );
  }

  // Get API key from server-side environment variable (secure, not exposed to client)
  const apiKey = process.env.EPC_API_KEY;

  if (!apiKey || apiKey === "your_epc_api_key_here") {
    console.warn(
      "[EPC API Route] EPC_API_KEY not configured or is placeholder",
    );
    return NextResponse.json(
      {
        error: "API key not configured",
        code: "AWAITING_API_KEY",
        message: "ממתין להזנת מפתח API במערכת",
        instructions:
          "יש להירשם ב-epc.opendatacommunities.org ולהזין את המפתח ב-.env.local",
      },
      { status: 503 },
    );
  }

  // Clean postcode
  const cleanPostcode = postcode.replace(/\s+/g, "").toUpperCase();

  // Build query URL
  const queryUrl = `${EPC_API_URL}?postcode=${encodeURIComponent(cleanPostcode)}`;

  console.log(`[EPC API Route] Fetching: ${queryUrl}`);
  console.log(`[EPC API Route] API Key length: ${apiKey.length} chars`);

  try {
    // EPC API Authorization format:
    // If key is "email:token" format, use as-is
    // If key is just the token, append ":"
    // Base64 encode and prefix with "Basic "

    let authCredentials = apiKey;

    // If the key doesn't contain ':', append ':' for Basic auth format
    if (!apiKey.includes(":")) {
      authCredentials = apiKey + ":";
    }

    const authHeader =
      "Basic " + Buffer.from(authCredentials).toString("base64");

    // Debug logging
    console.log(
      `[EPC API Route] Auth format: ${apiKey.includes(":") ? "email:key" : "key:empty"}`,
    );
    console.log(
      `[EPC API Route] Credentials: ${authCredentials.substring(0, 25)}...`,
    );
    console.log(
      `[EPC API Route] Base64 header: ${authHeader.substring(0, 40)}...`,
    );

    const response = await fetch(queryUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
    });

    console.log(`[EPC API Route] Response Status: ${response.status}`);

    // Handle error responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[EPC API Route] Error: ${errorText.substring(0, 500)}`);

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          {
            error: "Authentication failed",
            code: "INVALID_API_KEY",
            message: "מפתח API לא תקין - בדוק את ההרשמה שלך באתר הממשלתי",
            hint: "ודא שהמפתח ב-.env.local תואם לזה שקיבלת מהאתר",
          },
          { status: 401 },
        );
      }

      if (response.status === 404) {
        return NextResponse.json(
          {
            success: true,
            error: "No EPC records found",
            code: "NOT_FOUND",
            rows: [],
            totalRecords: 0,
            message: "לא נמצאו תעודות אנרגיה למיקוד זה",
          },
          { status: 200 },
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            code: "RATE_LIMITED",
            message: "חריגה ממגבלת הבקשות - נסה שוב בעוד דקה",
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        {
          error: `API Error: ${response.status}`,
          code: "API_ERROR",
          message: `שגיאה מהשרת הממשלתי: ${response.status}`,
        },
        { status: response.status },
      );
    }

    // Parse successful response
    const data = await response.json();

    console.log(
      `[EPC API Route] Success: ${data.rows?.length || 0} EPC records found`,
    );

    if (data.rows?.length > 0) {
      console.log(`[EPC API Route] First record: ${data.rows[0].address}`);
    }

    // Find best match if address provided
    let bestMatch = data.rows?.[0] || null;
    if (address && data.rows?.length > 0) {
      const addressLower = address.toLowerCase();
      const found = data.rows.find((row: any) =>
        row.address?.toLowerCase().includes(addressLower),
      );
      if (found) {
        bestMatch = found;
        console.log(`[EPC API Route] Address match: ${found.address}`);
      }
    }

    // Return processed data with key EPC fields extracted
    return NextResponse.json({
      success: true,
      postcode: cleanPostcode,
      totalRecords: data.rows?.length || 0,
      rows: data.rows || [],
      bestMatch: bestMatch,
      // Pre-extracted fields for UI convenience
      extracted: bestMatch
        ? {
            address: bestMatch.address,
            energyRating: bestMatch["current-energy-rating"],
            energyEfficiency: bestMatch["current-energy-efficiency"],
            potentialRating: bestMatch["potential-energy-rating"],
            totalFloorArea: bestMatch["total-floor-area"],
            numberOfRooms: bestMatch["number-habitable-rooms"],
            propertyType: bestMatch["property-type"],
            builtForm: bestMatch["built-form"],
            constructionAge: bestMatch["construction-age-band"],
            tenure: bestMatch["tenure"],
            lodgementDate: bestMatch["lodgement-date"],
          }
        : null,
      source: "EPC Register - Gov.uk (נתונים רשמיים)",
    });
  } catch (error) {
    console.error("[EPC API Route] Network Error:", error);
    return NextResponse.json(
      {
        error: "Network error",
        code: "NETWORK_ERROR",
        message: "שגיאת רשת בגישה לשרת הממשלתי - נסה שוב",
      },
      { status: 500 },
    );
  }
}
