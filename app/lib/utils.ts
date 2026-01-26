import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currency formatting utilities
export const CURRENCIES = {
  GBP: { symbol: "£", name: "British Pound", flag: "🇬🇧" },
  EUR: { symbol: "€", name: "Euro", flag: "🇪🇺" },
  ILS: { symbol: "₪", name: "Israeli Shekel", flag: "🇮🇱" },
  USD: { symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  GEL: { symbol: "₾", name: "Georgian Lari", flag: "🇬🇪" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

// Exchange rates (would be fetched from API in production)
export const EXCHANGE_RATES: Record<CurrencyCode, Record<CurrencyCode, number>> = {
  GBP: { GBP: 1, EUR: 1.17, ILS: 4.58, USD: 1.27, GEL: 3.42 },
  EUR: { GBP: 0.85, EUR: 1, ILS: 3.91, USD: 1.09, GEL: 2.92 },
  ILS: { GBP: 0.22, EUR: 0.26, ILS: 1, USD: 0.28, GEL: 0.75 },
  USD: { GBP: 0.79, EUR: 0.92, ILS: 3.61, USD: 1, GEL: 2.69 },
  GEL: { GBP: 0.29, EUR: 0.34, ILS: 1.33, USD: 0.37, GEL: 1 },
};

export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  return amount * EXCHANGE_RATES[from][to];
}

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = "GBP"
): string {
  const { symbol } = CURRENCIES[currency];
  return `${symbol}${amount.toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("he-IL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Calculate portfolio metrics
export interface PropertyAsset {
  id: string;
  name: string;
  address: string;
  postcode: string;
  purchasePrice: number;
  currentValue: number;
  currency: CurrencyCode;
  monthlyRent: number;
  managementFee: number; // percentage
  maintenanceCosts: number; // annual
  councilTax: number; // annual
  purchaseDate: string;
  country: "uk" | "cyprus";
}

export function calculateGrossYield(asset: PropertyAsset): number {
  return ((asset.monthlyRent * 12) / asset.currentValue) * 100;
}

export function calculateNetYield(asset: PropertyAsset): number {
  const annualRent = asset.monthlyRent * 12;
  const managementCost = annualRent * (asset.managementFee / 100);
  const netIncome = annualRent - managementCost - asset.maintenanceCosts - asset.councilTax;
  return (netIncome / asset.currentValue) * 100;
}

export function calculateROI(asset: PropertyAsset): number {
  const annualRent = asset.monthlyRent * 12;
  const managementCost = annualRent * (asset.managementFee / 100);
  const netIncome = annualRent - managementCost - asset.maintenanceCosts - asset.councilTax;
  const capitalGain = asset.currentValue - asset.purchasePrice;
  return ((netIncome + capitalGain) / asset.purchasePrice) * 100;
}

export function calculateTotalEquity(
  assets: PropertyAsset[],
  targetCurrency: CurrencyCode
): number {
  return assets.reduce((total, asset) => {
    const valueInTarget = convertCurrency(
      asset.currentValue,
      asset.currency,
      targetCurrency
    );
    return total + valueInTarget;
  }, 0);
}
