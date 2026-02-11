/**
 * Market Benchmark - Comparison Engine
 * UK postcodes only. Fetches market average rents and calculates yield gap for portfolio properties.
 */

export type AreaKey = "L18-liverpool" | "L15-liverpool";
export type CurrencyCode = "GBP";

export interface BenchmarkResult {
  areaKey: AreaKey;
  areaLabel: string;
  yourRent: number;
  marketRent: number;
  gapPercent: number;
  isOpportunity: boolean;
  aiAdvice: string;
  currency: CurrencyCode;
}

// Static market data (replace with API call in production)
const MARKET_RENTS: Record<AreaKey, { rent: number; label: string }> = {
  "L18-liverpool": { rent: 1_100, label: "L18, Liverpool" },
  "L15-liverpool": { rent: 920, label: "L15, Liverpool" },
};

const OPPORTUNITY_THRESHOLD = 0.05; // 5%

/** Fetch current average market rent for an area. */
export async function fetchMarketRent(areaKey: AreaKey): Promise<number> {
  await new Promise((r) => setTimeout(r, 100));
  return MARKET_RENTS[areaKey].rent;
}

/** Map a portfolio property to an area key for benchmarking. UK postcodes only. */
export function mapPropertyToArea(
  id: string,
  country: string,
  address: string,
  title: string
): AreaKey | null {
  if (country !== "UK") return null;
  const addr = (address || "").toLowerCase();
  const tit = (title || "").toLowerCase();
  if (addr.includes("l18") || tit.includes("l18") || addr.includes("penny lane") || tit.includes("penny lane") || addr.includes("james holt") || tit.includes("james holt")) {
    return "L18-liverpool";
  }
  if (addr.includes("l15") || tit.includes("l15") || addr.includes("smithdown") || tit.includes("smithdown")) {
    return "L15-liverpool";
  }
  if (addr.includes("liverpool") || tit.includes("liverpool")) {
    return "L18-liverpool"; // default Liverpool postcode
  }
  return null;
}

/**
 * Yield Gap = (Market Average - Current Rent) / Current Rent
 * Positive gap = your rent is below market (opportunity to raise).
 */
export function calculateYieldGap(currentRent: number, marketRent: number): number {
  if (currentRent <= 0) return 0;
  return (marketRent - currentRent) / currentRent;
}

/** Gap > 5% triggers Opportunity status. */
export function isOpportunity(gapPercent: number): boolean {
  return gapPercent > OPPORTUNITY_THRESHOLD;
}

/** Generate 1-sentence AI advice — English. */
export function generateAIAdvice(
  locationLabel: string,
  gapPercent: number,
  _currency: CurrencyCode
): string {
  const pct = Math.abs(Math.round(gapPercent * 100));
  if (gapPercent > OPPORTUNITY_THRESHOLD) {
    return `Your rent in ${locationLabel} is ${pct}% below market average; consider a rent review at the next renewal.`;
  }
  if (gapPercent < -OPPORTUNITY_THRESHOLD) {
    return `Your rent is above market; maintain competitiveness and tenant retention.`;
  }
  return `Your rent is in line with the regional average.`;
}

/** Run full benchmark for a single property. */
export async function runBenchmark(
  areaKey: AreaKey,
  yourRent: number,
  currency: CurrencyCode
): Promise<BenchmarkResult> {
  const marketRent = await fetchMarketRent(areaKey);
  const gapPercent = calculateYieldGap(yourRent, marketRent);
  const opp = isOpportunity(gapPercent);
  const label = MARKET_RENTS[areaKey].label;
  return {
    areaKey,
    areaLabel: label,
    yourRent,
    marketRent,
    gapPercent,
    isOpportunity: opp,
    aiAdvice: generateAIAdvice(label, gapPercent, currency),
    currency,
  };
}
