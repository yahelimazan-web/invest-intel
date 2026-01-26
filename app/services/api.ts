/**
 * UK Real Estate Intelligence - API Integration Layer
 * 
 * LIVE DATA SOURCES ONLY - No Dummy Data
 * 
 * Data Sources:
 * - Postcodes.io: Postcode geocoding and admin data (FREE, no key required)
 * - Police.uk: Street-level crime statistics (FREE, no key required)
 * - EPC Register: Energy Performance Certificates (REQUIRES API KEY)
 * - HM Land Registry: Property sold prices via SPARQL (FREE, no key required)
 * - Overpass API: POI proximity calculations (FREE, no key required)
 */

// =============================================================================
// Debug Mode
// =============================================================================

const DEBUG = true; // Set to true to see API responses in console

function debugLog(source: string, data: any) {
  if (DEBUG) {
    console.log(`\n========== ${source} ==========`);
    console.log(JSON.stringify(data, null, 2));
    console.log(`========== END ${source} ==========\n`);
  }
}

// =============================================================================
// Types
// =============================================================================

export interface PostcodeData {
  postcode: string;
  latitude: number;
  longitude: number;
  admin_district: string;
  admin_county: string | null;
  region: string;
  parliamentary_constituency: string;
  ccg: string;
  nuts: string;
  codes: {
    admin_district: string;
    admin_county: string;
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
  totalCrimes: number;
  categories: Record<string, number>;
  monthlyTrend: { month: string; count: number }[];
  riskLevel: "נמוך" | "בינוני" | "גבוה" | "לא זמין";
  lastUpdated: string;
  source: string;
  isLiveData: boolean;
}

export interface EPCData {
  address: string;
  postcode: string;
  buildingType: string | null;
  totalFloorArea: number | null;
  numberOfRooms: number | null;
  currentEnergyRating: string | null;
  currentEnergyEfficiency: number | null;
  potentialEnergyRating: string | null;
  constructionAgeBand: string | null;
  tenure: string | null;
  transactionType: string | null;
  lodgementDate: string | null;
  source: string;
  isLiveData: boolean;
  requiresApiKey: boolean;
}

export interface SoldPrice {
  transactionId: string;
  price: number;
  date: string;
  address: string;
  postcode: string;
  propertyType: string;
  newBuild: boolean;
  tenure: string;
}

export interface PriceHistory {
  soldPrices: SoldPrice[];
  averageByYear: { year: string; avgPrice: number; count: number }[];
  latestSale: SoldPrice | null;
  priceGrowth: number | null;
  marketSentiment: "bullish" | "bearish" | "neutral" | "unknown";
  source: string;
  isLiveData: boolean;
}

export interface POIData {
  name: string;
  type: string;
  distance: number;
  walkingTime: number;
  coordinates: { lat: number; lon: number };
}

export interface ProximityData {
  trainStation: POIData | null;
  metro: POIData | null;
  hospital: POIData | null;
  university: POIData | null;
  schools: POIData[];
  supermarkets: POIData[];
  source: string;
  isLiveData: boolean;
}

export interface PlanningApplication {
  id: string;
  reference: string;
  description: string;
  address: string;
  status: string;
  type: string;
  submissionDate: string;
  decisionDate?: string;
  estimatedValue?: number;
  units?: number;
  applicant?: string;
}

// =============================================================================
// API Configuration
// =============================================================================

const API_CONFIG = {
  postcodes: "https://api.postcodes.io",
  police: "https://data.police.uk/api",
  epc: "https://epc.opendatacommunities.org/api/v1",
  landRegistry: "https://landregistry.data.gov.uk/app/root/qonsole/query",
  overpass: "https://overpass-api.de/api/interpreter",
};

// Note: EPC API key is handled server-side via /api/epc route

// =============================================================================
// Postcodes.io API
// =============================================================================

export async function fetchPostcodeData(postcode: string): Promise<PostcodeData | null> {
  const cleanPostcode = postcode.replace(/\s+/g, "").toUpperCase();
  const url = `${API_CONFIG.postcodes}/postcodes/${cleanPostcode}`;
  
  console.log(`[Postcodes.io] Fetching: ${url}`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    debugLog("Postcodes.io Response", data);
    
    if (!response.ok || data.status !== 200 || !data.result) {
      console.error(`[Postcodes.io] Error: Postcode not found - ${cleanPostcode}`);
      return null;
    }
    
    console.log(`[Postcodes.io] Success: ${data.result.postcode} -> ${data.result.admin_district}, ${data.result.region}`);
    
    return {
      postcode: data.result.postcode,
      latitude: data.result.latitude,
      longitude: data.result.longitude,
      admin_district: data.result.admin_district,
      admin_county: data.result.admin_county,
      region: data.result.region,
      parliamentary_constituency: data.result.parliamentary_constituency,
      ccg: data.result.ccg,
      nuts: data.result.nuts,
      codes: data.result.codes,
    };
  } catch (error) {
    console.error(`[Postcodes.io] Network Error:`, error);
    return null;
  }
}

// =============================================================================
// Police.uk Crime API
// =============================================================================

export async function fetchCrimeData(
  lat: number,
  lon: number,
  months: number = 3
): Promise<CrimeSummary> {
  const crimes: CrimeData[] = [];
  const monthlyData: Record<string, number> = {};
  let hasLiveData = false;
  
  console.log(`[Police.uk] Fetching crime data for: ${lat}, ${lon}`);
  
  try {
    const now = new Date();
    
    for (let i = 2; i <= months + 1; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const url = `${API_CONFIG.police}/crimes-street/all-crime?lat=${lat}&lng=${lon}&date=${monthStr}`;
      
      console.log(`[Police.uk] Fetching month: ${monthStr}`);
      
      try {
        const response = await fetch(url);
        
        if (response.ok) {
          const data: CrimeData[] = await response.json();
          debugLog(`Police.uk ${monthStr}`, { count: data.length, sample: data.slice(0, 2) });
          
          crimes.push(...data);
          monthlyData[monthStr] = data.length;
          hasLiveData = true;
          
          console.log(`[Police.uk] ${monthStr}: ${data.length} crimes found`);
        } else {
          console.warn(`[Police.uk] ${monthStr}: HTTP ${response.status}`);
        }
      } catch (e) {
        console.warn(`[Police.uk] ${monthStr}: Network error`, e);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    if (!hasLiveData) {
      console.error("[Police.uk] No data retrieved from API");
      return {
        totalCrimes: 0,
        categories: {},
        monthlyTrend: [],
        riskLevel: "לא זמין",
        lastUpdated: "לא זמין",
        source: "Police.uk - אין נתונים זמינים",
        isLiveData: false,
      };
    }
    
    // Categorize crimes
    const categories: Record<string, number> = {};
    crimes.forEach((crime) => {
      categories[crime.category] = (categories[crime.category] || 0) + 1;
    });
    
    // Monthly trend
    const monthlyTrend = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month: formatMonthHebrew(month),
        count,
      }));
    
    const avgMonthly = crimes.length / Object.keys(monthlyData).length;
    
    let riskLevel: "נמוך" | "בינוני" | "גבוה";
    if (avgMonthly < 50) riskLevel = "נמוך";
    else if (avgMonthly < 150) riskLevel = "בינוני";
    else riskLevel = "גבוה";
    
    const result: CrimeSummary = {
      totalCrimes: Math.round(avgMonthly),
      categories,
      monthlyTrend,
      riskLevel,
      lastUpdated: monthlyTrend[monthlyTrend.length - 1]?.month || "לא זמין",
      source: "Police.uk (נתונים חיים)",
      isLiveData: true,
    };
    
    console.log(`[Police.uk] Summary: ${result.totalCrimes} crimes/month, Risk: ${result.riskLevel}`);
    
    return result;
  } catch (error) {
    console.error("[Police.uk] Critical Error:", error);
    return {
      totalCrimes: 0,
      categories: {},
      monthlyTrend: [],
      riskLevel: "לא זמין",
      lastUpdated: "לא זמין",
      source: "Police.uk - שגיאת חיבור",
      isLiveData: false,
    };
  }
}

function formatMonthHebrew(monthStr: string): string {
  const months: Record<string, string> = {
    "01": "ינו", "02": "פבר", "03": "מרץ", "04": "אפר",
    "05": "מאי", "06": "יונ", "07": "יול", "08": "אוג",
    "09": "ספט", "10": "אוק", "11": "נוב", "12": "דצמ",
  };
  const [year, month] = monthStr.split("-");
  return `${months[month]} ${year.slice(2)}`;
}

// =============================================================================
// EPC Register API (Via Server-Side Proxy to bypass CORS)
// =============================================================================

export async function fetchEPCData(postcode: string, address?: string): Promise<EPCData> {
  const cleanPostcode = postcode.replace(/\s+/g, "").toUpperCase();
  
  console.log(`[EPC Register] Fetching via internal API route...`);
  
  // Build query URL for our internal API route (bypasses CORS)
  const queryParams = new URLSearchParams({ postcode: cleanPostcode });
  if (address) {
    queryParams.set("address", address);
  }
  const url = `/api/epc?${queryParams.toString()}`;
  
  console.log(`[EPC Register] Calling: ${url}`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    debugLog("EPC Register Response (via proxy)", data);
    
    // Handle API key not configured or awaiting
    if (data.code === "NO_API_KEY" || data.code === "AWAITING_API_KEY") {
      console.warn("[EPC Register] Server reports: API key not configured");
      console.warn("[EPC Register] Message:", data.message);
      return {
        address: address || `נכס במיקוד ${postcode}`,
        postcode: cleanPostcode,
        buildingType: null,
        totalFloorArea: null,
        numberOfRooms: null,
        currentEnergyRating: null,
        currentEnergyEfficiency: null,
        potentialEnergyRating: null,
        constructionAgeBand: null,
        tenure: null,
        transactionType: null,
        lodgementDate: null,
        source: data.message || "ממתין להזנת מפתח API במערכת",
        isLiveData: false,
        requiresApiKey: true,
      };
    }
    
    // Handle invalid API key
    if (data.code === "INVALID_API_KEY") {
      console.error("[EPC Register] Invalid API key");
      return {
        address: address || `נכס במיקוד ${postcode}`,
        postcode: cleanPostcode,
        buildingType: null,
        totalFloorArea: null,
        numberOfRooms: null,
        currentEnergyRating: null,
        currentEnergyEfficiency: null,
        potentialEnergyRating: null,
        constructionAgeBand: null,
        tenure: null,
        transactionType: null,
        lodgementDate: null,
        source: "EPC Register - מפתח API לא תקין",
        isLiveData: false,
        requiresApiKey: true,
      };
    }
    
    // Handle other errors
    if (!response.ok || data.error) {
      console.error(`[EPC Register] Error: ${data.error || response.status}`);
      return {
        address: address || `נכס במיקוד ${postcode}`,
        postcode: cleanPostcode,
        buildingType: null,
        totalFloorArea: null,
        numberOfRooms: null,
        currentEnergyRating: null,
        currentEnergyEfficiency: null,
        potentialEnergyRating: null,
        constructionAgeBand: null,
        tenure: null,
        transactionType: null,
        lodgementDate: null,
        source: `EPC Register - ${data.message || "שגיאה"}`,
        isLiveData: false,
        requiresApiKey: false,
      };
    }
    
    // Handle no records found
    if (!data.rows || data.rows.length === 0) {
      console.warn("[EPC Register] No EPC records found for postcode");
      return {
        address: address || `נכס במיקוד ${postcode}`,
        postcode: cleanPostcode,
        buildingType: null,
        totalFloorArea: null,
        numberOfRooms: null,
        currentEnergyRating: null,
        currentEnergyEfficiency: null,
        potentialEnergyRating: null,
        constructionAgeBand: null,
        tenure: null,
        transactionType: null,
        lodgementDate: null,
        source: "EPC Register - לא נמצאו רשומות",
        isLiveData: true,
        requiresApiKey: false,
      };
    }
    
    // Use best match from server or first row
    const match = data.bestMatch || data.rows[0];
    
    console.log(`[EPC Register] Found: ${match.address}, Rating: ${match["current-energy-rating"]}`);
    
    return {
      address: match.address || address || "",
      postcode: match.postcode || postcode,
      buildingType: match["property-type"] || null,
      totalFloorArea: match["total-floor-area"] ? parseFloat(match["total-floor-area"]) : null,
      numberOfRooms: match["number-habitable-rooms"] ? parseInt(match["number-habitable-rooms"]) : null,
      currentEnergyRating: match["current-energy-rating"] || null,
      currentEnergyEfficiency: match["current-energy-efficiency"] ? parseInt(match["current-energy-efficiency"]) : null,
      potentialEnergyRating: match["potential-energy-rating"] || null,
      constructionAgeBand: match["construction-age-band"] || null,
      tenure: match.tenure || null,
      transactionType: match["transaction-type"] || null,
      lodgementDate: match["lodgement-date"] || null,
      source: "EPC Register (נתונים חיים)",
      isLiveData: true,
      requiresApiKey: false,
    };
  } catch (error) {
    console.error("[EPC Register] Network Error:", error);
    return {
      address: address || `נכס במיקוד ${postcode}`,
      postcode: cleanPostcode,
      buildingType: null,
      totalFloorArea: null,
      numberOfRooms: null,
      currentEnergyRating: null,
      currentEnergyEfficiency: null,
      potentialEnergyRating: null,
      constructionAgeBand: null,
      tenure: null,
      transactionType: null,
      lodgementDate: null,
      source: "EPC Register - שגיאת רשת",
      isLiveData: false,
      requiresApiKey: false,
    };
  }
}

// =============================================================================
// HM Land Registry - Via Server-Side API Route
// =============================================================================

export async function fetchSoldPrices(postcode: string): Promise<PriceHistory> {
  const cleanPostcode = postcode.replace(/\s+/g, "").toUpperCase();
  
  console.log(`[Land Registry] Fetching via internal API route...`);
  
  const url = `/api/land-registry?postcode=${encodeURIComponent(cleanPostcode)}&limit=50`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    debugLog("Land Registry Response (via proxy)", data);
    
    if (!response.ok || data.error) {
      console.error(`[Land Registry] Error: ${data.error || response.status}`);
      return {
        soldPrices: [],
        averageByYear: [],
        latestSale: null,
        priceGrowth: null,
        marketSentiment: "unknown",
        source: data.message || `HM Land Registry - שגיאה`,
        isLiveData: false,
      };
    }
    
    if (!data.sales || data.sales.length === 0) {
      console.warn(`[Land Registry] No sales found for postcode: ${cleanPostcode}`);
      return {
        soldPrices: [],
        averageByYear: [],
        latestSale: null,
        priceGrowth: null,
        marketSentiment: "unknown",
        source: "HM Land Registry - לא נמצאו עסקאות",
        isLiveData: true,
      };
    }
    
    // Transform API response to our format
    const soldPrices: SoldPrice[] = data.sales.map((sale: any) => ({
      transactionId: sale.transactionId,
      price: sale.price,
      date: sale.date,
      address: sale.address,
      postcode: sale.postcode,
      propertyType: translatePropertyType(sale.propertyType),
      newBuild: sale.newBuild,
      tenure: sale.tenure,
    }));
    
    console.log(`[Land Registry] Found ${soldPrices.length} transactions`);
    
    // Use pre-calculated data from API
    const latestSale = data.latestSale ? {
      transactionId: data.latestSale.transactionId,
      price: data.latestSale.price,
      date: data.latestSale.date,
      address: data.latestSale.address,
      postcode: data.latestSale.postcode,
      propertyType: translatePropertyType(data.latestSale.propertyType),
      newBuild: data.latestSale.newBuild,
      tenure: data.latestSale.tenure,
    } : null;
    
    if (latestSale) {
      console.log(`[Land Registry] Latest: £${latestSale.price.toLocaleString()} on ${latestSale.date}`);
    }
    
    // Transform yearly averages
    const averageByYear = data.yearlyAverages || [];
    
    // Calculate growth
    let priceGrowth: number | null = null;
    let marketSentiment: "bullish" | "bearish" | "neutral" | "unknown" = "unknown";
    
    if (averageByYear.length >= 2) {
      const latest = averageByYear[averageByYear.length - 1];
      const previous = averageByYear[averageByYear.length - 2];
      priceGrowth = ((latest.avgPrice - previous.avgPrice) / previous.avgPrice) * 100;
      
      if (priceGrowth > 5) marketSentiment = "bullish";
      else if (priceGrowth < -2) marketSentiment = "bearish";
      else marketSentiment = "neutral";
    }
    
    return {
      soldPrices,
      averageByYear,
      latestSale,
      priceGrowth,
      marketSentiment,
      source: "HM Land Registry (נתונים חיים)",
      isLiveData: true,
    };
  } catch (error) {
    console.error("[Land Registry] Network Error:", error);
    return {
      soldPrices: [],
      averageByYear: [],
      latestSale: null,
      priceGrowth: null,
      marketSentiment: "unknown",
      source: "HM Land Registry - שגיאת רשת",
      isLiveData: false,
    };
  }
}

function translatePropertyType(type: string): string {
  const translations: Record<string, string> = {
    "Detached": "בית נפרד",
    "Semi-Detached": "בית דו-משפחתי",
    "Terraced": "בית שורה",
    "Flat/Maisonette": "דירה",
    "Unknown": "לא ידוע",
  };
  return translations[type] || type;
}


// =============================================================================
// Overpass API (OpenStreetMap) - Free, no key required
// =============================================================================

export async function fetchProximityData(lat: number, lon: number): Promise<ProximityData> {
  const radius = 2000;
  const TIMEOUT_MS = 10000; // 10 second timeout
  
  const query = `
[out:json][timeout:10];
(
  node["railway"="station"](around:${radius},${lat},${lon});
  node["railway"="halt"](around:${radius},${lat},${lon});
  node["station"="subway"](around:${radius},${lat},${lon});
  node["amenity"="hospital"](around:${radius},${lat},${lon});
  way["amenity"="hospital"](around:${radius},${lat},${lon});
  node["amenity"="university"](around:${radius},${lat},${lon});
  way["amenity"="university"](around:${radius},${lat},${lon});
  node["amenity"="school"](around:${radius},${lat},${lon});
  node["shop"="supermarket"](around:${radius},${lat},${lon});
);
out center tags;
  `.trim();
  
  console.log(`[Overpass] Fetching POIs for: ${lat}, ${lon}`);
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const response = await fetch(API_CONFIG.overpass, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`[Overpass] HTTP Error: ${response.status}`);
      // Return graceful fallback instead of error
      return {
        trainStation: null,
        metro: null,
        hospital: null,
        university: null,
        schools: [],
        supermarkets: [],
        source: response.status === 504 ? "OpenStreetMap - טוען..." : `OpenStreetMap - שגיאה ${response.status}`,
        isLiveData: false,
      };
    }
    
    const data = await response.json();
    debugLog("Overpass Response", { elementCount: data.elements?.length });
    
    const pois: Record<string, POIData[]> = {
      train: [],
      metro: [],
      hospital: [],
      university: [],
      school: [],
      supermarket: [],
    };
    
    data.elements?.forEach((element: any) => {
      const poiLat = element.center?.lat || element.lat;
      const poiLon = element.center?.lon || element.lon;
      
      if (!poiLat || !poiLon) return;
      
      const distance = calculateDistance(lat, lon, poiLat, poiLon);
      const walkingTime = Math.round(distance / 80);
      const name = element.tags?.name || element.tags?.operator || "ללא שם";
      
      const poi: POIData = {
        name,
        type: "",
        distance,
        walkingTime,
        coordinates: { lat: poiLat, lon: poiLon },
      };
      
      if (element.tags?.railway === "station" || element.tags?.railway === "halt") {
        poi.type = "train_station";
        pois.train.push(poi);
      } else if (element.tags?.station === "subway") {
        poi.type = "metro";
        pois.metro.push(poi);
      } else if (element.tags?.amenity === "hospital") {
        poi.type = "hospital";
        pois.hospital.push(poi);
      } else if (element.tags?.amenity === "university") {
        poi.type = "university";
        pois.university.push(poi);
      } else if (element.tags?.amenity === "school") {
        poi.type = "school";
        pois.school.push(poi);
      } else if (element.tags?.shop === "supermarket") {
        poi.type = "supermarket";
        pois.supermarket.push(poi);
      }
    });
    
    // Sort by distance
    Object.values(pois).forEach(arr => arr.sort((a, b) => a.distance - b.distance));
    
    const result: ProximityData = {
      trainStation: pois.train[0] || null,
      metro: pois.metro[0] || null,
      hospital: pois.hospital[0] || null,
      university: pois.university[0] || null,
      schools: pois.school.slice(0, 3),
      supermarkets: pois.supermarket.slice(0, 3),
      source: "OpenStreetMap (נתונים חיים)",
      isLiveData: true,
    };
    
    console.log(`[Overpass] Found: Train=${pois.train.length}, Hospital=${pois.hospital.length}, Schools=${pois.school.length}`);
    
    return result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Check if it's a timeout/abort error
    if (error.name === 'AbortError') {
      console.warn("[Overpass] Request timed out after 10 seconds");
      return {
        trainStation: null,
        metro: null,
        hospital: null,
        university: null,
        schools: [],
        supermarkets: [],
        source: "OpenStreetMap - זמן המתנה חרג",
        isLiveData: false,
      };
    }
    
    console.error("[Overpass] Network Error:", error);
    return {
      trainStation: null,
      metro: null,
      hospital: null,
      university: null,
      schools: [],
      supermarkets: [],
      source: "OpenStreetMap - לא זמין",
      isLiveData: false,
    };
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// =============================================================================
// Composite Property Analysis
// =============================================================================

export interface PropertyAnalysis {
  postcode: PostcodeData;
  epc: EPCData;
  crime: CrimeSummary;
  prices: PriceHistory;
  proximity: ProximityData;
  marketScore: number | null;
  investmentGrade: "A" | "B" | "C" | "D" | null;
  dataQuality: {
    epc: boolean;
    crime: boolean;
    prices: boolean;
    proximity: boolean;
  };
  timestamp: string;
}

export async function analyzePropertyLive(postcode: string, address?: string): Promise<PropertyAnalysis | null> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`PROPERTY ANALYSIS: ${postcode}`);
  console.log(`${"=".repeat(60)}\n`);
  
  try {
    // Step 1: Resolve postcode
    const postcodeData = await fetchPostcodeData(postcode);
    if (!postcodeData) {
      console.error("Analysis failed: Invalid postcode");
      return null;
    }
    
    // Step 2: Fetch all data in parallel
    const [epc, crime, prices, proximity] = await Promise.all([
      fetchEPCData(postcode, address),
      fetchCrimeData(postcodeData.latitude, postcodeData.longitude),
      fetchSoldPrices(postcode),
      fetchProximityData(postcodeData.latitude, postcodeData.longitude),
    ]);
    
    // Step 3: Calculate market score (only if we have real data)
    let marketScore: number | null = null;
    let investmentGrade: "A" | "B" | "C" | "D" | null = null;
    
    const hasEnoughData = prices.isLiveData && crime.isLiveData;
    
    if (hasEnoughData) {
      let score = 50;
      
      if (prices.marketSentiment === "bullish") score += 15;
      else if (prices.marketSentiment === "bearish") score -= 15;
      
      if (crime.riskLevel === "נמוך") score += 15;
      else if (crime.riskLevel === "גבוה") score -= 15;
      
      if (proximity.trainStation && proximity.trainStation.distance < 1000) score += 10;
      
      if (epc.isLiveData && epc.currentEnergyRating) {
        if (["A", "B"].includes(epc.currentEnergyRating)) score += 5;
        else if (["F", "G"].includes(epc.currentEnergyRating)) score -= 5;
      }
      
      marketScore = Math.max(0, Math.min(100, score));
      
      if (marketScore >= 75) investmentGrade = "A";
      else if (marketScore >= 55) investmentGrade = "B";
      else if (marketScore >= 35) investmentGrade = "C";
      else investmentGrade = "D";
    }
    
    const result: PropertyAnalysis = {
      postcode: postcodeData,
      epc,
      crime,
      prices,
      proximity,
      marketScore,
      investmentGrade,
      dataQuality: {
        epc: epc.isLiveData,
        crime: crime.isLiveData,
        prices: prices.isLiveData,
        proximity: proximity.isLiveData,
      },
      timestamp: new Date().toISOString(),
    };
    
    console.log(`\n${"=".repeat(60)}`);
    console.log("ANALYSIS COMPLETE");
    console.log(`Data Quality: EPC=${epc.isLiveData}, Crime=${crime.isLiveData}, Prices=${prices.isLiveData}, Proximity=${proximity.isLiveData}`);
    console.log(`Market Score: ${marketScore || "N/A"}, Grade: ${investmentGrade || "N/A"}`);
    console.log(`${"=".repeat(60)}\n`);
    
    return result;
  } catch (error) {
    console.error("Property analysis error:", error);
    return null;
  }
}
