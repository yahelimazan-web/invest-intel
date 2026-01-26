"use client";

// =============================================================================
// Country-Specific Central Bank Interest Rates (2026)
// =============================================================================

import type { Country } from "./portfolio-db";

export interface InterestRateConfig {
  baseRate: number;
  btlMargin: number; // Buy-to-let mortgage margin
  defaultMortgageRate: number; // Base + Margin
  centralBank: string;
  centralBankUrl: string;
  lastUpdated: string;
}

export const INTEREST_RATES: Record<Country, InterestRateConfig> = {
  UK: {
    baseRate: 3.75,
    btlMargin: 1.5,
    defaultMortgageRate: 5.25, // 3.75 + 1.5
    centralBank: "Bank of England",
    centralBankUrl: "https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate",
    lastUpdated: "2026-01-24",
  },
  Israel: {
    baseRate: 4.5,
    btlMargin: 1.5,
    defaultMortgageRate: 6.0, // 4.5 + 1.5
    centralBank: "Bank of Israel",
    centralBankUrl: "https://www.boi.org.il/en/markets/interest-rates/",
    lastUpdated: "2026-01-24",
  },
  USA: {
    baseRate: 5.5,
    btlMargin: 2.0,
    defaultMortgageRate: 7.5, // 5.5 + 2.0
    centralBank: "Federal Reserve",
    centralBankUrl: "https://www.federalreserve.gov/monetarypolicy/openmarket.htm",
    lastUpdated: "2026-01-24",
  },
  Cyprus: {
    baseRate: 4.0,
    btlMargin: 1.5,
    defaultMortgageRate: 5.5, // 4.0 + 1.5
    centralBank: "European Central Bank",
    centralBankUrl: "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.en.html",
    lastUpdated: "2026-01-24",
  },
  Greece: {
    baseRate: 4.0,
    btlMargin: 1.5,
    defaultMortgageRate: 5.5, // 4.0 + 1.5
    centralBank: "European Central Bank",
    centralBankUrl: "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.en.html",
    lastUpdated: "2026-01-24",
  },
  Portugal: {
    baseRate: 4.0,
    btlMargin: 1.5,
    defaultMortgageRate: 5.5, // 4.0 + 1.5
    centralBank: "European Central Bank",
    centralBankUrl: "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.en.html",
    lastUpdated: "2026-01-24",
  },
  Georgia: {
    baseRate: 8.0,
    btlMargin: 2.0,
    defaultMortgageRate: 10.0, // 8.0 + 2.0
    centralBank: "National Bank of Georgia",
    centralBankUrl: "https://www.nbg.gov.ge/en/monetary-policy/monetary-policy-rate",
    lastUpdated: "2026-01-24",
  },
};

/**
 * Get base interest rate for a country
 */
export function getBaseRate(country: Country): number {
  return INTEREST_RATES[country]?.baseRate ?? 3.75;
}

/**
 * Get default mortgage rate for a country (base + BTL margin)
 */
export function getDefaultMortgageRate(country: Country): number {
  return INTEREST_RATES[country]?.defaultMortgageRate ?? 5.25;
}

/**
 * Get interest rate config for a country
 */
export function getInterestRateConfig(country: Country): InterestRateConfig {
  return INTEREST_RATES[country] ?? INTEREST_RATES.UK;
}
