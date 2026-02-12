/**
 * Market Radar — deterministic signal generation
 * Converts area data into explainable MarketSignal objects
 */

import type {
  MarketSignal,
  SignalTrend,
  AreaPriceData,
  AreaRentData,
  AreaPlanningData,
} from "./types";
import { getMockPriceData, getMockRentData, getMockPlanningData } from "./mockData";

function toTrend(changePercent: number): SignalTrend {
  if (changePercent > 0.5) return "up";
  if (changePercent < -0.5) return "down";
  return "flat";
}

/** Map % change to 0–100 score. Strong growth = higher score. */
function percentToScore(changePercent: number): number {
  const capped = Math.max(-15, Math.min(15, changePercent));
  return Math.round(50 + (capped / 15) * 50);
}

function formatDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * A. Price Momentum Signal
 */
export function generatePriceMomentumSignal(areaCode: string): MarketSignal {
  const data = getMockPriceData(areaCode);
  const changePercent =
    ((data.currentAvg - data.previousAvg) / data.previousAvg) * 100;
  const score = percentToScore(changePercent);
  const trend = toTrend(changePercent);

  const summary =
    changePercent >= 0
      ? `Prices in this area increased by ${changePercent.toFixed(1)}% over the last 12 months.`
      : `Prices in this area fell by ${Math.abs(changePercent).toFixed(1)}% over the last 12 months.`;

  return {
    id: `price-${areaCode}`,
    areaCode,
    signalType: "PRICE_MOMENTUM",
    score,
    trend,
    summary,
    sources: [data.source],
    lastUpdated: formatDate(),
  };
}

/**
 * B. Rental Momentum Signal
 */
export function generateRentMomentumSignal(areaCode: string): MarketSignal {
  const rentData = getMockRentData(areaCode);
  const priceData = getMockPriceData(areaCode);

  const rentChange =
    ((rentData.currentAvg - rentData.previousAvg) / rentData.previousAvg) * 100;
  const priceChange =
    ((priceData.currentAvg - priceData.previousAvg) / priceData.previousAvg) * 100;

  const rentVsPrice = rentChange - priceChange;
  const score = percentToScore(rentVsPrice);
  const trend = toTrend(rentVsPrice);

  const summary =
    rentVsPrice > 0
      ? `Advertised rents are rising faster than prices in this area. This may indicate yield expansion potential.`
      : rentVsPrice < 0
        ? `Price growth is outpacing rent growth in this area.`
        : `Rent and price trends are aligned in this area.`;

  return {
    id: `rent-${areaCode}`,
    areaCode,
    signalType: "RENT_MOMENTUM",
    score,
    trend,
    summary,
    sources: [rentData.source, "VOA"],
    lastUpdated: formatDate(),
  };
}

/**
 * C. Planning Spike Signal
 */
export function generatePlanningSpikeSignal(areaCode: string): MarketSignal {
  const data = getMockPlanningData(areaCode);

  const changePercent =
    data.baselineCount > 0
      ? ((data.currentCount - data.baselineCount) / data.baselineCount) * 100
      : 0;

  const score = Math.min(100, Math.round(50 + changePercent));
  const trend = toTrend(changePercent);

  const summary =
    changePercent > 5
      ? `Planning applications in this area are above historical average (${changePercent.toFixed(0)}% vs baseline), indicating development activity.`
      : changePercent < -5
        ? `Planning activity in this area is below historical average.`
        : `Planning activity in this area is in line with historical levels.`;

  return {
    id: `planning-${areaCode}`,
    areaCode,
    signalType: "PLANNING_SPIKE",
    score,
    trend,
    summary,
    sources: [data.source],
    lastUpdated: formatDate(),
  };
}

/**
 * Generate all signals for an area
 */
export function generateSignalsForArea(areaCode: string): MarketSignal[] {
  return [
    generatePriceMomentumSignal(areaCode),
    generateRentMomentumSignal(areaCode),
    generatePlanningSpikeSignal(areaCode),
  ];
}
