/**
 * Market Radar — UK area-level market intelligence signals
 * Used for discovering investment opportunities via early signals
 */

export type SignalType =
  | "PRICE_MOMENTUM"
  | "RENT_MOMENTUM"
  | "PLANNING_SPIKE";

export type SignalTrend = "up" | "down" | "flat";

export interface MarketSignal {
  id: string;
  areaCode: string;
  signalType: SignalType;
  score: number;
  trend: SignalTrend;
  summary: string;
  sources: string[];
  lastUpdated: string;
}

/** Raw inputs for signal generation (mock or API-derived) */
export interface AreaPriceData {
  areaCode: string;
  currentAvg: number;
  previousAvg: number;
  periodMonths: number;
  source: string;
}

export interface AreaRentData {
  areaCode: string;
  currentAvg: number;
  previousAvg: number;
  priceChangePercent?: number;
  source: string;
}

export interface AreaPlanningData {
  areaCode: string;
  currentCount: number;
  baselineCount: number;
  periodMonths: number;
  source: string;
}
