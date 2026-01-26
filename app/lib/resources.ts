"use client";

// =============================================================================
// Global Resources by Country
// =============================================================================

import type { Country } from "./portfolio-db";

export interface Resource {
  id: string;
  name: string;
  nameHe?: string;
  url: string;
  category: "marketplace" | "government" | "bank" | "statistics" | "news";
  description?: string;
  descriptionHe?: string;
}

export const COUNTRY_RESOURCES: Record<Country, Resource[]> = {
  Israel: [
    {
      id: "madlan",
      name: "Madlan",
      nameHe: "מדלן",
      url: "https://www.madlan.co.il",
      category: "marketplace",
      description: "Real estate data and analytics platform",
      descriptionHe: "פלטפורמת נתונים וניתוח נדל\"ן",
    },
    {
      id: "yad2",
      name: "Yad2",
      nameHe: "יד2",
      url: "https://www.yad2.co.il/realestate",
      category: "marketplace",
      description: "Israel's largest real estate marketplace",
      descriptionHe: "שוק הנדל\"ן הגדול בישראל",
    },
    {
      id: "boi",
      name: "Bank of Israel",
      nameHe: "בנק ישראל",
      url: "https://www.boi.org.il/en/markets/interest-rates/",
      category: "bank",
      description: "Official interest rates and monetary policy",
      descriptionHe: "ריביות רשמיות ומדיניות מוניטרית",
    },
  ],
  UK: [
    {
      id: "rightmove",
      name: "Rightmove",
      url: "https://www.rightmove.co.uk",
      category: "marketplace",
      description: "UK's largest property portal",
    },
    {
      id: "boe",
      name: "Bank of England",
      url: "https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate",
      category: "bank",
      description: "Official base rate and monetary policy",
    },
  ],
  USA: [
    {
      id: "zillow",
      name: "Zillow",
      url: "https://www.zillow.com",
      category: "marketplace",
      description: "US property search and estimates",
    },
    {
      id: "redfin",
      name: "Redfin",
      url: "https://www.redfin.com",
      category: "marketplace",
      description: "Real estate brokerage and data",
    },
    {
      id: "federal-reserve",
      name: "Federal Reserve (FRED)",
      url: "https://fred.stlouisfed.org",
      category: "bank",
      description: "Economic data and interest rates",
    },
  ],
  Cyprus: [
    {
      id: "spitogatos-cy",
      name: "Spitogatos",
      url: "https://www.spitogatos.gr",
      category: "marketplace",
      description: "Greek and Cypriot property portal",
    },
    {
      id: "eurostat-cy",
      name: "Eurostat",
      url: "https://ec.europa.eu/eurostat",
      category: "statistics",
      description: "European Union statistics",
    },
  ],
  Greece: [
    {
      id: "spitogatos",
      name: "Spitogatos",
      url: "https://www.spitogatos.gr",
      category: "marketplace",
      description: "Greek property portal",
    },
    {
      id: "eurostat",
      name: "Eurostat",
      url: "https://ec.europa.eu/eurostat",
      category: "statistics",
      description: "European Union statistics",
    },
  ],
  Portugal: [
    {
      id: "idealista",
      name: "Idealista",
      url: "https://www.idealista.pt",
      category: "marketplace",
      description: "Portuguese property portal",
    },
    {
      id: "eurostat-pt",
      name: "Eurostat",
      url: "https://ec.europa.eu/eurostat",
      category: "statistics",
      description: "European Union statistics",
    },
  ],
  Georgia: [
    {
      id: "myhome",
      name: "MyHome.ge",
      url: "https://www.myhome.ge",
      category: "marketplace",
      description: "Georgian property portal",
    },
    {
      id: "nbg",
      name: "National Bank of Georgia",
      url: "https://www.nbg.gov.ge/en/monetary-policy/monetary-policy-rate",
      category: "bank",
      description: "Official interest rates and monetary policy",
    },
  ],
};

/**
 * Get resources for specific countries
 */
export function getResourcesForCountries(countries: Country[]): Resource[] {
  const allResources: Resource[] = [];
  countries.forEach((country) => {
    if (COUNTRY_RESOURCES[country]) {
      allResources.push(...COUNTRY_RESOURCES[country]);
    }
  });
  return allResources;
}

/**
 * Get all unique resources (deduplicated by URL)
 */
export function getUniqueResources(resources: Resource[]): Resource[] {
  const seen = new Set<string>();
  return resources.filter((resource) => {
    if (seen.has(resource.url)) {
      return false;
    }
    seen.add(resource.url);
    return true;
  });
}
