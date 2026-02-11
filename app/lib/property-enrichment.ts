/**
 * Property Enrichment - Fetches real-world data for UK portfolio properties
 * EPC rating, Land Registry (last sold), property type, Street View image
 */

import type { PortfolioProperty, PropertyEnrichment } from "../components/PropertyEditModal";

/** Extract postcode from address or use prop.postcode. UK format: L18 1DA */
function getPostcode(prop: PortfolioProperty): string | null {
  if (prop.postcode) return prop.postcode;
  const match = prop.address.match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/i);
  return match ? match[1].replace(/\s+/g, " ").trim() : null;
}

/** Extract street address without postcode for API matching */
function getStreetAddress(prop: PortfolioProperty): string {
  return prop.address.replace(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}\b/i, "").trim().replace(/,\s*$/, "") || prop.title;
}

/** Fetch enrichment for a single property */
export async function fetchPropertyEnrichment(
  prop: PortfolioProperty
): Promise<PropertyEnrichment> {
  const postcode = getPostcode(prop);
  if (!postcode || prop.country !== "UK") {
    return defaultEnrichment();
  }

  const address = getStreetAddress(prop);
  const params = new URLSearchParams({ postcode, address });

  try {
    const res = await fetch(`/api/property-enrichment?${params}`);
    const data = await res.json();
    if (!res.ok) return defaultEnrichment();

    return {
      epcRating: data.epcRating ?? null,
      lastSoldPrice: data.lastSoldPrice ?? null,
      lastSoldDate: data.lastSoldDate ?? null,
      propertyType: data.propertyType ?? null,
      streetViewUrl: data.streetViewUrl ?? null,
      staticMapUrl: data.staticMapUrl ?? null,
      osmMapUrl: data.osmMapUrl ?? null,
    };
  } catch {
    return defaultEnrichment();
  }
}

function defaultEnrichment(): PropertyEnrichment {
  return {
    epcRating: null,
    lastSoldPrice: null,
    lastSoldDate: null,
    propertyType: null,
    streetViewUrl: null,
    staticMapUrl: null,
    osmMapUrl: null,
  };
}

/** Hook-friendly: fetch enrichment for all properties, returns Record<id, enrichment> */
export async function fetchEnrichmentForPortfolio(
  properties: PortfolioProperty[]
): Promise<Record<string, PropertyEnrichment>> {
  const results = await Promise.all(
    properties.map(async (prop) => ({
      id: prop.id,
      data: await fetchPropertyEnrichment(prop),
    }))
  );
  return Object.fromEntries(results.map((r) => [r.id, r.data]));
}
