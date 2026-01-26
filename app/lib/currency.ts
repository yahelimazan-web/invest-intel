"use client";

// =============================================================================
// Multi-Currency Support
// =============================================================================

import type { Country } from "./portfolio-db";

export interface CurrencyConfig {
  symbol: string;
  code: string;
  name: string;
  nameHe: string;
}

export const CURRENCIES: Record<Country, CurrencyConfig> = {
  UK: { symbol: "£", code: "GBP", name: "British Pound", nameHe: "לירה שטרלינג" },
  Israel: { symbol: "₪", code: "ILS", name: "Israeli Shekel", nameHe: "שקל ישראלי" },
  USA: { symbol: "$", code: "USD", name: "US Dollar", nameHe: "דולר אמריקאי" },
  Cyprus: { symbol: "€", code: "EUR", name: "Euro", nameHe: "אירו" },
  Greece: { symbol: "€", code: "EUR", name: "Euro", nameHe: "אירו" },
  Portugal: { symbol: "€", code: "EUR", name: "Euro", nameHe: "אירו" },
  Georgia: { symbol: "₾", code: "GEL", name: "Georgian Lari", nameHe: "לרי גאורגי" },
};

/**
 * Get currency symbol for a country
 */
export function getCurrencySymbol(country: Country): string {
  return CURRENCIES[country]?.symbol || "£";
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(amount: number | null | undefined, country: Country): string {
  if (amount === null || amount === undefined) return "—";
  const symbol = getCurrencySymbol(country);
  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Format amount with currency symbol and K/M suffix
 */
export function formatCurrencyCompact(amount: number | null | undefined, country: Country): string {
  if (amount === null || amount === undefined) return "—";
  const symbol = getCurrencySymbol(country);
  if (amount >= 1000000) {
    return `${symbol}${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(0)}K`;
  }
  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Get all countries in user's portfolio
 */
export function getPortfolioCountries(properties: Array<{ country?: Country }>): Country[] {
  const countries = new Set<Country>();
  properties.forEach((prop) => {
    if (prop.country) {
      countries.add(prop.country);
    }
  });
  return Array.from(countries);
}
