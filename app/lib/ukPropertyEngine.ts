/**
 * UK Property Intelligence Engine
 * 
 * LIVE DATA ONLY - No hardcoded dummy data
 * All data comes from verified government APIs
 */

import {
  analyzePropertyLive as apiAnalyzeProperty,
  fetchPostcodeData,
  type PostcodeData,
  type PropertyAnalysis,
  type CrimeSummary,
  type EPCData,
  type PriceHistory,
  type ProximityData,
  type POIData,
} from "../services/api";

// Re-export types
export type { 
  PropertyAnalysis, 
  CrimeSummary, 
  EPCData, 
  PriceHistory, 
  ProximityData,
  POIData,
};

// Extended PropertyIntelligence type for UI components
export interface PropertyIntelligence {
  coordinates: { lat: number; lon: number };
  postcode: string;
  physical: {
    address: string;
    sqm: number | null;
    rooms: number | null;
    epcRating: string | null;
    epcScore: number | null;
    tenure: string | null;
    propertyType: string | null;
    builtYear?: string | null;
  };
  council: {
    name: string;
    region: string;
    newsUrl: string;
    planningUrl: string;
  };
  crime: CrimeSummary;
  market: {
    latestSalePrice: number | null;
    latestSaleDate: string | null;
    avgSoldPrice: number | null;
    priceChange12m: number | null;
    source: string;
    isLiveData: boolean;
  };
  proximity: ProximityData;
  mode: "live";
  dataQuality: {
    epc: boolean;
    crime: boolean;
    prices: boolean;
    proximity: boolean;
  };
  timestamp: string;
}

/**
 * Main analysis function - fetches ALL data from live APIs
 * NO HARDCODED DATA - shows "מידע לא זמין" if API fails
 */
export async function analyzeProperty(postcode: string): Promise<PropertyIntelligence | null> {
  console.log(`[ukPropertyEngine] Analyzing postcode: ${postcode}`);
  
  try {
    // Use the API service for live data
    const analysis = await apiAnalyzeProperty(postcode);
    
    if (!analysis) {
      console.error("[ukPropertyEngine] Analysis failed - no data returned");
      return null;
    }
    
    // Convert to PropertyIntelligence format
    const intelligence: PropertyIntelligence = {
      coordinates: { 
        lat: analysis.postcode.latitude, 
        lon: analysis.postcode.longitude 
      },
      postcode: analysis.postcode.postcode,
      physical: {
        address: analysis.epc.address,
        sqm: analysis.epc.totalFloorArea,
        rooms: analysis.epc.numberOfRooms,
        epcRating: analysis.epc.currentEnergyRating,
        epcScore: analysis.epc.currentEnergyEfficiency,
        tenure: analysis.epc.tenure,
        propertyType: analysis.epc.buildingType,
        builtYear: analysis.epc.constructionAgeBand,
      },
      council: {
        name: analysis.postcode.admin_district,
        region: analysis.postcode.region,
        newsUrl: `https://www.google.com/search?q=${encodeURIComponent(analysis.postcode.admin_district + " council news")}`,
        planningUrl: `https://www.google.com/search?q=${encodeURIComponent(analysis.postcode.admin_district + " planning applications")}`,
      },
      crime: analysis.crime,
      market: {
        latestSalePrice: analysis.prices.latestSale?.price ?? null,
        latestSaleDate: analysis.prices.latestSale?.date ?? null,
        avgSoldPrice: analysis.prices.averageByYear.length > 0 
          ? analysis.prices.averageByYear[analysis.prices.averageByYear.length - 1].avgPrice 
          : null,
        priceChange12m: analysis.prices.priceGrowth,
        source: analysis.prices.source,
        isLiveData: analysis.prices.isLiveData,
      },
      proximity: analysis.proximity,
      mode: "live",
      dataQuality: analysis.dataQuality,
      timestamp: analysis.timestamp,
    };
    
    return intelligence;
  } catch (error) {
    console.error("[ukPropertyEngine] Error:", error);
    return null;
  }
}

/**
 * Get map markers for POIs - uses real coordinates from API
 */
export function getMapMarkers(intelligence: PropertyIntelligence) {
  const markers: Array<{
    lat: number;
    lon: number;
    name: string;
    type: string;
    distance: number;
  }> = [];
  
  const { proximity } = intelligence;
  
  if (proximity.trainStation) {
    markers.push({
      lat: proximity.trainStation.coordinates.lat,
      lon: proximity.trainStation.coordinates.lon,
      name: proximity.trainStation.name,
      type: "train_station",
      distance: proximity.trainStation.distance,
    });
  }
  
  if (proximity.hospital) {
    markers.push({
      lat: proximity.hospital.coordinates.lat,
      lon: proximity.hospital.coordinates.lon,
      name: proximity.hospital.name,
      type: "hospital",
      distance: proximity.hospital.distance,
    });
  }
  
  if (proximity.university) {
    markers.push({
      lat: proximity.university.coordinates.lat,
      lon: proximity.university.coordinates.lon,
      name: proximity.university.name,
      type: "university",
      distance: proximity.university.distance,
    });
  }
  
  proximity.schools?.forEach((school) => {
    markers.push({
      lat: school.coordinates.lat,
      lon: school.coordinates.lon,
      name: school.name,
      type: "school",
      distance: school.distance,
    });
  });
  
  proximity.supermarkets?.forEach((supermarket) => {
    markers.push({
      lat: supermarket.coordinates.lat,
      lon: supermarket.coordinates.lon,
      name: supermarket.name,
      type: "supermarket",
      distance: supermarket.distance,
    });
  });
  
  return markers;
}
