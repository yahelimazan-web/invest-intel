// Real Estate Intelligence Engine for UK Market

export interface PostcodeData {
  postcode: string;
  latitude: number;
  longitude: number;
  admin_district: string; // Council name
  parliamentary_constituency: string;
  region: string;
  country: string;
  codes: {
    admin_district: string;
    parish: string;
  };
}

export interface CrimeData {
  category: string;
  location: {
    latitude: string;
    longitude: string;
    street: { name: string };
  };
  month: string;
  outcome_status: { category: string } | null;
}

export interface CrimeSummary {
  total: number;
  byCategory: Record<string, number>;
  recentMonth: string;
}

export interface PointOfInterest {
  name: string;
  type: "train_station" | "hospital" | "school" | "supermarket" | "park";
  distance: number; // in meters
  lat: number;
  lon: number;
}

export interface MarketData {
  avgAreaPrice: number;
  estimatedRent: number;
  pricePerSqm: number;
  rentYield: number;
  source: string;
}

export interface PropertyIntelligence {
  postcode: string;
  coordinates: { lat: number; lon: number };
  councilName: string;
  councilCode: string;
  region: string;
  // Physical specs
  address?: string;
  sqm?: number;
  tenure?: "Freehold" | "Leasehold" | "Share of Freehold";
  epcRating?: string;
  // Market data
  marketData: MarketData;
  // Crime
  crimeSummary: CrimeSummary;
  // Points of interest
  nearbyPOIs: PointOfInterest[];
  // Macro
  councilNewsUrl: string;
  // Mode
  mode: "existing" | "potential";
  // Raw data for debugging
  rawPostcodeData?: PostcodeData;
}

// Existing property database (simulated)
export const EXISTING_PROPERTIES: Record<string, Partial<PropertyIntelligence>> = {
  "L32 5TE": {
    postcode: "L32 5TE",
    address: "12 James Holt Avenue, Liverpool",
    coordinates: { lat: 53.4767, lon: -2.8875 },
    councilName: "Knowsley",
    councilCode: "E08000011",
    region: "North West",
    sqm: 85,
    tenure: "Freehold",
    epcRating: "D",
    marketData: {
      avgAreaPrice: 145000,
      estimatedRent: 750,
      pricePerSqm: 1706,
      rentYield: 6.2,
      source: "Local estimate",
    },
    nearbyPOIs: [
      { name: "Kirkby Station", type: "train_station", distance: 1200, lat: 53.4816, lon: -2.8928 },
      { name: "Whiston Hospital", type: "hospital", distance: 4500, lat: 53.4178, lon: -2.8019 },
      { name: "Kirkby Centre", type: "supermarket", distance: 800, lat: 53.4812, lon: -2.8953 },
    ],
    councilNewsUrl: "https://www.knowsley.gov.uk/news",
    mode: "existing",
  },
};

// Fetch postcode data from postcodes.io
export async function fetchPostcodeData(postcode: string): Promise<PostcodeData | null> {
  try {
    const cleanPostcode = postcode.replace(/\s+/g, "").toUpperCase();
    const response = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(cleanPostcode)}`
    );
    
    if (!response.ok) {
      console.error("Postcode not found:", postcode);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === 200 && data.result) {
      return {
        postcode: data.result.postcode,
        latitude: data.result.latitude,
        longitude: data.result.longitude,
        admin_district: data.result.admin_district || "Unknown",
        parliamentary_constituency: data.result.parliamentary_constituency || "Unknown",
        region: data.result.region || data.result.country || "Unknown",
        country: data.result.country || "England",
        codes: {
          admin_district: data.result.codes?.admin_district || "",
          parish: data.result.codes?.parish || "",
        },
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching postcode data:", error);
    return null;
  }
}

// Fetch crime data from data.police.uk
export async function fetchCrimeData(lat: number, lon: number): Promise<CrimeSummary> {
  try {
    // Get crimes from the last available month (API has ~2 month delay)
    const response = await fetch(
      `https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lon}`
    );
    
    if (!response.ok) {
      return { total: 0, byCategory: {}, recentMonth: "Unknown" };
    }
    
    const crimes: CrimeData[] = await response.json();
    
    // Summarize crimes by category
    const byCategory: Record<string, number> = {};
    let recentMonth = "Unknown";
    
    crimes.forEach((crime) => {
      byCategory[crime.category] = (byCategory[crime.category] || 0) + 1;
      if (crime.month) recentMonth = crime.month;
    });
    
    return {
      total: crimes.length,
      byCategory,
      recentMonth,
    };
  } catch (error) {
    console.error("Error fetching crime data:", error);
    return { total: 0, byCategory: {}, recentMonth: "Error" };
  }
}

// Fetch nearby Points of Interest from OpenStreetMap Overpass API
export async function fetchNearbyPOIs(lat: number, lon: number, radiusMeters: number = 2000): Promise<PointOfInterest[]> {
  try {
    // Overpass query for train stations, hospitals, schools, supermarkets
    const query = `
      [out:json][timeout:25];
      (
        node["railway"="station"](around:${radiusMeters},${lat},${lon});
        node["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
        way["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
        node["amenity"="school"](around:${radiusMeters},${lat},${lon});
        node["shop"="supermarket"](around:${radiusMeters},${lat},${lon});
      );
      out center;
    `;
    
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    
    if (!response.ok) {
      console.error("Overpass API error");
      return [];
    }
    
    const data = await response.json();
    
    const pois: PointOfInterest[] = data.elements.map((el: any) => {
      const elLat = el.lat || el.center?.lat;
      const elLon = el.lon || el.center?.lon;
      const distance = calculateDistance(lat, lon, elLat, elLon);
      
      let type: PointOfInterest["type"] = "park";
      if (el.tags?.railway === "station") type = "train_station";
      else if (el.tags?.amenity === "hospital") type = "hospital";
      else if (el.tags?.amenity === "school") type = "school";
      else if (el.tags?.shop === "supermarket") type = "supermarket";
      
      return {
        name: el.tags?.name || `Unknown ${type}`,
        type,
        distance: Math.round(distance),
        lat: elLat,
        lon: elLon,
      };
    });
    
    // Sort by distance and return closest of each type
    return pois
      .filter((poi) => poi.lat && poi.lon)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);
  } catch (error) {
    console.error("Error fetching POIs:", error);
    return [];
  }
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Generate market data estimates (placeholder - would use Zoopla/Rightmove API)
function generateMarketEstimates(postcodeData: PostcodeData): MarketData {
  // Simulated market data based on region
  const regionMultipliers: Record<string, number> = {
    "London": 5.0,
    "South East": 2.5,
    "South West": 2.0,
    "East of England": 2.2,
    "West Midlands": 1.5,
    "East Midlands": 1.4,
    "Yorkshire and The Humber": 1.3,
    "North West": 1.2,
    "North East": 1.0,
    "Wales": 1.1,
    "Scotland": 1.3,
    "Northern Ireland": 1.2,
  };
  
  const multiplier = regionMultipliers[postcodeData.region] || 1.5;
  const basePrice = 120000;
  const avgAreaPrice = Math.round(basePrice * multiplier);
  const estimatedRent = Math.round((avgAreaPrice * 0.005)); // ~6% yield
  
  return {
    avgAreaPrice,
    estimatedRent,
    pricePerSqm: Math.round(avgAreaPrice / 75), // Assume 75sqm avg
    rentYield: Math.round((estimatedRent * 12 / avgAreaPrice) * 1000) / 10,
    source: "Estimated (Zoopla/Rightmove placeholder)",
  };
}

// Generate council news URL
function getCouncilNewsUrl(councilName: string): string {
  // Convert council name to URL-friendly format
  const urlName = councilName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return `https://www.${urlName}.gov.uk/news`;
}

// Main function: Generate full property intelligence report
export async function generatePropertyIntelligence(postcode: string): Promise<PropertyIntelligence | null> {
  const cleanPostcode = postcode.replace(/\s+/g, " ").toUpperCase().trim();
  
  // Check if this is an existing property
  const existingKey = Object.keys(EXISTING_PROPERTIES).find(
    (key) => key.replace(/\s+/g, "").toUpperCase() === cleanPostcode.replace(/\s+/g, "").toUpperCase()
  );
  
  if (existingKey) {
    const existing = EXISTING_PROPERTIES[existingKey];
    // Fetch fresh crime data for existing property
    const crimeSummary = await fetchCrimeData(
      existing.coordinates!.lat,
      existing.coordinates!.lon
    );
    
    return {
      ...existing,
      crimeSummary,
      mode: "existing",
    } as PropertyIntelligence;
  }
  
  // Potential property - fetch all data from APIs
  const postcodeData = await fetchPostcodeData(cleanPostcode);
  
  if (!postcodeData) {
    return null;
  }
  
  // Fetch all data in parallel
  const [crimeSummary, nearbyPOIs] = await Promise.all([
    fetchCrimeData(postcodeData.latitude, postcodeData.longitude),
    fetchNearbyPOIs(postcodeData.latitude, postcodeData.longitude, 2000),
  ]);
  
  // Generate market estimates
  const marketData = generateMarketEstimates(postcodeData);
  
  return {
    postcode: postcodeData.postcode,
    coordinates: { lat: postcodeData.latitude, lon: postcodeData.longitude },
    councilName: postcodeData.admin_district,
    councilCode: postcodeData.codes.admin_district,
    region: postcodeData.region,
    marketData,
    crimeSummary,
    nearbyPOIs,
    councilNewsUrl: getCouncilNewsUrl(postcodeData.admin_district),
    mode: "potential",
    rawPostcodeData: postcodeData,
  };
}
