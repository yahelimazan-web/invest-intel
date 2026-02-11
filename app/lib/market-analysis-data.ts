/**
 * Market Analysis - Strategic Investment Data
 * Rent Gap, Value Gap, Operational Efficiency, Health Score.
 * UK-only. All fetches wrapped for useEffect; replace with real APIs in production.
 */

export type CurrencyCode = "GBP";

export interface PropertyAnalysis {
  id: string;
  title: string;
  address: string;
  zipCode: string;
  currency: CurrencyCode;
  /** Rent Gap */
  currentRent: number;
  marketRent: number;
  rentGapPercent: number;
  neighborhoodOccupancy: number; // 0-100
  /** Value Gap */
  estimatedValue: number;
  avgSoldInArea: number;
  valueGapPercent: number;
  recentSalesCount: number;
  /** Operational Efficiency */
  voidDaysOnMarket: number;
  benchmarkVoidDays: number;
  managementFeePercent: number;
  benchmarkFeePercent: number;
  /** Computed */
  healthScore: number; // 0-100
}

// UK mock data — replace with API in production
const UK_DATA: PropertyAnalysis[] = [
  {
    id: "prop-uk-1",
    title: "42 Penny Lane, Liverpool",
    address: "42 Penny Lane, Liverpool",
    zipCode: "L18",
    currency: "GBP",
    currentRent: 950,
    marketRent: 1_100,
    rentGapPercent: 15.8,
    neighborhoodOccupancy: 98,
    estimatedValue: 195_000,
    avgSoldInArea: 182_000,
    valueGapPercent: 7.1,
    recentSalesCount: 8,
    voidDaysOnMarket: 18,
    benchmarkVoidDays: 25,
    managementFeePercent: 9,
    benchmarkFeePercent: 11,
    healthScore: 82,
  },
  {
    id: "prop-uk-2",
    title: "15 Smithdown Road, Liverpool",
    address: "15 Smithdown Road, Liverpool",
    zipCode: "L15",
    currency: "GBP",
    currentRent: 850,
    marketRent: 920,
    rentGapPercent: 8.2,
    neighborhoodOccupancy: 95,
    estimatedValue: 165_000,
    avgSoldInArea: 158_000,
    valueGapPercent: 4.4,
    recentSalesCount: 6,
    voidDaysOnMarket: 22,
    benchmarkVoidDays: 28,
    managementFeePercent: 10,
    benchmarkFeePercent: 11,
    healthScore: 76,
  },
];

/** Simulate async fetch for market analysis (useEffect-safe). */
export async function fetchMarketAnalysis(): Promise<PropertyAnalysis[]> {
  await new Promise((r) => setTimeout(r, 150));
  return UK_DATA;
}

/** Generate AI Actionable Insight — English. */
export function generateActionableInsight(prop: PropertyAnalysis): string {
  const rentPct = Math.round(prop.rentGapPercent);
  const occ = prop.neighborhoodOccupancy;
  const valuePct = Math.round(prop.valueGapPercent);

  if (prop.rentGapPercent > 5 && occ >= 95) {
    return `Your rent in ${prop.zipCode} is ${rentPct}% below market average; consider a rent review at the next renewal. The area shows ${occ}% occupancy.`;
  }
  if (prop.rentGapPercent < -5) {
    return `Your rent is above market; maintain competitiveness and tenant retention.`;
  }
  if (valuePct > 0) {
    return `The property has appreciated ${valuePct}% above area sales average — strong performance.`;
  }
  return `Your property is performing around the regional average.`;
}
