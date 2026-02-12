import { NextRequest, NextResponse } from "next/server";

/**
 * HM Land Registry - Price Paid Data API
 *
 * Uses the FREE public SPARQL endpoint to fetch property transaction data.
 * No API key or license agreement required for basic queries.
 *
 * Endpoint: https://landregistry.data.gov.uk/landregistry/query
 * Documentation: https://landregistry.data.gov.uk/app/root/qonsole
 */

const SPARQL_ENDPOINT = "https://landregistry.data.gov.uk/landregistry/query";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const postcode = searchParams.get("postcode");
  const limit = parseInt(searchParams.get("limit") || "10");

  if (!postcode) {
    return NextResponse.json(
      { error: "Postcode is required", code: "MISSING_POSTCODE" },
      { status: 400 },
    );
  }

  // Format postcode with space (Land Registry format: "L32 5TE")
  const cleanPostcode = postcode.replace(/\s+/g, "").toUpperCase();
  const formattedPostcode =
    cleanPostcode.length > 4
      ? `${cleanPostcode.slice(0, -3)} ${cleanPostcode.slice(-3)}`
      : cleanPostcode;

  console.log(`[Land Registry] Fetching sales for: ${formattedPostcode}`);

  // SPARQL query to get recent transactions for the postcode
  const sparqlQuery = `
PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>

SELECT ?transaction ?price ?date ?paon ?saon ?street ?town ?propertyType ?newBuild ?estateType
WHERE {
  ?transaction lrppi:pricePaid ?price ;
               lrppi:transactionDate ?date ;
               lrppi:propertyAddress ?address .
  
  ?address lrcommon:postcode "${formattedPostcode}" .
  
  OPTIONAL { ?address lrcommon:paon ?paon }
  OPTIONAL { ?address lrcommon:saon ?saon }
  OPTIONAL { ?address lrcommon:street ?street }
  OPTIONAL { ?address lrcommon:town ?town }
  OPTIONAL { ?transaction lrppi:propertyType ?propertyType }
  OPTIONAL { ?transaction lrppi:newBuild ?newBuild }
  OPTIONAL { ?transaction lrppi:estateType ?estateType }
}
ORDER BY DESC(?date)
LIMIT ${limit}
  `.trim();

  console.log(`[Land Registry] SPARQL Query prepared`);

  try {
    const response = await fetch(SPARQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/sparql-results+json",
      },
      body: `query=${encodeURIComponent(sparqlQuery)}`,
    });

    console.log(`[Land Registry] Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Land Registry] Error: ${errorText.substring(0, 500)}`);

      return NextResponse.json(
        {
          error: `Land Registry API error: ${response.status}`,
          code: "API_ERROR",
          message: "שגיאה בגישה לנתוני רשם המקרקעין",
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    const transactions = data.results?.bindings || [];
    console.log(`[Land Registry] Found ${transactions.length} transactions`);

    // Transform SPARQL results to clean JSON
    const sales = transactions.map((row: any) => {
      const address = [
        row.saon?.value,
        row.paon?.value,
        row.street?.value,
        row.town?.value,
      ]
        .filter(Boolean)
        .join(", ");

      // Extract property type from URI
      let propertyType = "Unknown";
      if (row.propertyType?.value) {
        const typeUri = row.propertyType.value;
        if (typeUri.includes("detached")) propertyType = "Detached";
        else if (typeUri.includes("semi-detached"))
          propertyType = "Semi-Detached";
        else if (typeUri.includes("terraced")) propertyType = "Terraced";
        else if (typeUri.includes("flat")) propertyType = "Flat/Maisonette";
      }

      // Extract tenure from URI
      let tenure = "Unknown";
      if (row.estateType?.value) {
        const tenureUri = row.estateType.value;
        if (tenureUri.includes("freehold")) tenure = "Freehold";
        else if (tenureUri.includes("leasehold")) tenure = "Leasehold";
      }

      return {
        transactionId: row.transaction?.value || "",
        price: parseInt(row.price?.value) || 0,
        date: row.date?.value?.split("T")[0] || "",
        address: address || "Address not available",
        postcode: formattedPostcode,
        propertyType,
        newBuild: row.newBuild?.value === "true",
        tenure,
      };
    });

    // Calculate statistics
    const totalTransactions = sales.length;
    const latestSale = sales[0] || null;

    // Calculate average price
    const avgPrice =
      totalTransactions > 0
        ? Math.round(
            sales.reduce((sum: number, s: any) => sum + s.price, 0) /
              totalTransactions,
          )
        : null;

    // Group by year for trend analysis
    const byYear: Record<string, { total: number; count: number }> = {};
    sales.forEach((sale: any) => {
      const year = sale.date.substring(0, 4);
      if (!byYear[year]) byYear[year] = { total: 0, count: 0 };
      byYear[year].total += sale.price;
      byYear[year].count += 1;
    });

    const yearlyAverages = Object.entries(byYear)
      .map(([year, data]) => ({
        year,
        avgPrice: Math.round(data.total / data.count),
        count: data.count,
      }))
      .sort((a, b) => a.year.localeCompare(b.year));

    if (latestSale) {
      console.log(
        `[Land Registry] Latest: £${latestSale.price.toLocaleString()} on ${latestSale.date}`,
      );
    }

    return NextResponse.json({
      success: true,
      postcode: formattedPostcode,
      totalTransactions,
      sales,
      latestSale,
      averagePrice: avgPrice,
      yearlyAverages,
      source: "HM Land Registry (Price Paid Data)",
    });
  } catch (error) {
    console.error("[Land Registry] Network Error:", error);
    return NextResponse.json(
      {
        error: "Network error",
        code: "NETWORK_ERROR",
        message: "שגיאת רשת בגישה לרשם המקרקעין",
      },
      { status: 500 },
    );
  }
}
