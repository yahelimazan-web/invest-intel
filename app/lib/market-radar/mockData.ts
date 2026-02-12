/**
 * Mock data for Market Radar MVP — UK postcode / LSOA areas
 * Deterministic values for reproducible behaviour
 */

import type { AreaPriceData, AreaRentData, AreaPlanningData } from "./types";

/** UK areas with known postcode prefixes for testing */
export const UK_AREAS: Array<{ code: string; name: string; postcodePrefix: string }> = [
  { code: "L18", name: "Liverpool (South)", postcodePrefix: "L18" },
  { code: "L15", name: "Liverpool (Wavertree)", postcodePrefix: "L15" },
  { code: "M1", name: "Manchester (City Centre)", postcodePrefix: "M1" },
  { code: "M20", name: "Manchester (Didsbury)", postcodePrefix: "M20" },
  { code: "L1", name: "Liverpool (City Centre)", postcodePrefix: "L1" },
  { code: "B1", name: "Birmingham (City Centre)", postcodePrefix: "B1" },
  { code: "LS1", name: "Leeds (City Centre)", postcodePrefix: "LS1" },
  { code: "NG1", name: "Nottingham (City Centre)", postcodePrefix: "NG1" },
  { code: "S1", name: "Sheffield (City Centre)", postcodePrefix: "S1" },
];

/** Mock Land Registry price trend — 12-month change */
export function getMockPriceData(areaCode: string): AreaPriceData {
  const seed = areaCode.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const yearlyChange = 2 + (seed % 8) - 2; // -2% to +8%
  const basePrice = 180_000 + (seed % 100) * 5000;
  const currentAvg = basePrice;
  const previousAvg = Math.round(basePrice / (1 + yearlyChange / 100));
  return {
    areaCode,
    currentAvg,
    previousAvg,
    periodMonths: 12,
    source: "HM Land Registry",
  };
}

/** Mock Rightmove-style advertised rent trend */
export function getMockRentData(areaCode: string): AreaRentData {
  const seed = areaCode.split("").reduce((s, c) => s + c.charCodeAt(0), 1);
  const rentChange = 3 + (seed % 6); // +3% to +9%
  const baseRent = 800 + (seed % 20) * 25;
  const currentAvg = baseRent;
  const previousAvg = Math.round(baseRent / (1 + rentChange / 100));
  return {
    areaCode,
    currentAvg,
    previousAvg,
    source: "Rightmove (mocked)",
  };
}

/** Mock planning application counts vs baseline */
export function getMockPlanningData(areaCode: string): AreaPlanningData {
  const seed = areaCode.split("").reduce((s, c) => s + c.charCodeAt(0), 2);
  const baseline = 12 + (seed % 15);
  const spike = seed % 3 === 0 ? 1.4 : seed % 3 === 1 ? 0.9 : 1.15;
  const currentCount = Math.round(baseline * spike);
  return {
    areaCode,
    currentCount,
    baselineCount: baseline,
    periodMonths: 6,
    source: "Planning Portal (mocked)",
  };
}
