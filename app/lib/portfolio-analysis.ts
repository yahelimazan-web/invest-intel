/**
 * Portfolio Analysis — Decision-support module for real estate investors.
 * Data models, calculation logic, benchmarks. No investment advice.
 *
 * Assumes data may be partial; calculations degrade gracefully.
 */

import type { PortfolioProperty } from "../components/PropertyEditModal";

// ─── Data Models ───────────────────────────────────────────────────────────

export type Country = "IL" | "UK" | "US";

/** Property-type and location-specific benchmark (replace with API). */
export interface AssetBenchmark {
  assetId: string;
  country: Country;
  /** Local average rent, similar properties only (monthly) */
  localAvgRent: number;
  /** Govt bond yield (country-specific) */
  govBondYield: number;
  /** Local RE market avg return */
  reMarketReturn: number;
  /** Equity index: S&P 500 / FTSE / TA-125 */
  equityIndexReturn: number;
  /** Vacancy volatility in area (0–100, higher = more volatile) */
  vacancyVolatility: number;
}

/** Per-asset computed metrics. */
export interface AssetMetrics {
  assetId: string;
  title: string;
  country: Country;
  currency: string;
  /** Total equity locked (purchase price if no mortgage data) */
  equityLocked: number;
  /** Annual gross rent */
  grossAnnualRent: number;
  /** Net operating income (gross − estimated expenses) */
  noi: number;
  /** NOI / Equity */
  cashOnEquityPercent: number;
  /** Gross yield (from input) */
  grossYieldPercent: number;
  /** Risk score 0–100 (higher = riskier) */
  riskScore: number;
  /** Review signal: may be worth reviewing */
  reviewSignal: boolean;
  reviewReason?: string;
}

/** Portfolio-level aggregates. */
export interface PortfolioOverview {
  totalValue: number;
  totalEquity: number;
  totalNoi: number;
  cashOnEquityReturn: number;
  riskAdjustedScore: number; // composite 0–100
  displayCurrency: "ILS" | "GBP" | "EUR";
}

/** One of three key insights for 60-second view. */
export interface KeyInsight {
  type: "strongest" | "weakest" | "biggest_risk";
  assetTitle: string;
  assetId: string;
  message: string;
  metric?: string;
}

// ─── Constants (replace with API; country-specific) ─────────────────────────

const BENCHMARKS: Record<string, AssetBenchmark> = {
  "prop-uk-1": {
    assetId: "prop-uk-1",
    country: "UK",
    localAvgRent: 1_100,
    govBondYield: 4.0,
    reMarketReturn: 5.2,
    equityIndexReturn: 7.2,
    vacancyVolatility: 15,
  },
  "prop-uk-2": {
    assetId: "prop-uk-2",
    country: "UK",
    localAvgRent: 920,
    govBondYield: 4.0,
    reMarketReturn: 5.2,
    equityIndexReturn: 7.2,
    vacancyVolatility: 15,
  },
};

const EXPENSE_RATIO = 0.28; // 28% of gross → expenses (typical range 25–35%)

/** Rough FX to GBP (replace with live rates in production). */
const FX_TO_GBP: Record<string, number> = {
  GBP: 1,
  ILS: 0.21, // ~4.75 ILS per GBP
  EUR: 0.86,
};

// ─── Calculations ──────────────────────────────────────────────────────────

/** Derive NOI from gross rent using expense ratio. */
function estimateNoi(grossAnnualRent: number): number {
  return grossAnnualRent * (1 - EXPENSE_RATIO);
}

/** Compute risk score from available factors (0–100, higher = riskier). */
function computeRiskScore(
  prop: PortfolioProperty,
  bench: AssetBenchmark | null
): number {
  let score = 40; // baseline
  if (prop.status === "needs_attention") score += 15;
  if (prop.annualYieldPercent < 4) score += 10;
  if (bench) score += Math.min(30, bench.vacancyVolatility);
  return Math.min(100, Math.round(score));
}

/** Determine if asset warrants a review signal (non-advisory). */
function computeReviewSignal(
  metrics: AssetMetrics,
  portfolioAvgCashOnEquity: number,
  bench: AssetBenchmark | null
): { signal: boolean; reason?: string } {
  if (portfolioAvgCashOnEquity > 0 && metrics.cashOnEquityPercent < portfolioAvgCashOnEquity * 0.7) {
    return { signal: true, reason: "Low cash-on-equity vs portfolio average" };
  }
  if (metrics.riskScore >= 65) {
    return { signal: true, reason: "Elevated risk score" };
  }
  if (bench && metrics.grossYieldPercent < bench.govBondYield) {
    return { signal: true, reason: "Yield below government bond benchmark" };
  }
  return { signal: false };
}

/** Convert amount to display currency (simplified; use live FX in production). */
function toDisplayCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  const toGbp = amount * (FX_TO_GBP[fromCurrency] ?? 1);
  const rate = 1 / (FX_TO_GBP[toCurrency] ?? 1);
  return toGbp * rate;
}

/** Aggregate portfolio metrics. Normalizes to display currency. */
export function computePortfolioOverview(
  props: PortfolioProperty[],
  assetMetrics: AssetMetrics[],
  displayCurrency: "ILS" | "GBP" | "EUR" = "GBP"
): PortfolioOverview {
  const totalEquity = assetMetrics.reduce(
    (s, m) => s + toDisplayCurrency(m.equityLocked, m.currency, displayCurrency),
    0
  );
  const totalNoi = assetMetrics.reduce(
    (s, m) => s + toDisplayCurrency(m.noi, m.currency, displayCurrency),
    0
  );
  const cashOnEquity = totalEquity > 0 ? (totalNoi / totalEquity) * 100 : 0;
  const avgRisk =
    assetMetrics.length > 0
      ? assetMetrics.reduce((s, m) => s + m.riskScore, 0) / assetMetrics.length
      : 0;
  const riskAdjusted = Math.max(0, Math.round(70 - avgRisk)); // invert: high risk = lower score

  return {
    totalValue: totalEquity,
    totalEquity,
    totalNoi: totalNoi,
    cashOnEquityReturn: cashOnEquity,
    riskAdjustedScore: riskAdjusted,
    displayCurrency,
  };
}

/** Three key insights for 60-second view. */
export function getKeyInsights(assetMetrics: AssetMetrics[]): KeyInsight[] {
  if (assetMetrics.length === 0) return [];

  const sortedByCash = [...assetMetrics].sort(
    (a, b) => b.cashOnEquityPercent - a.cashOnEquityPercent
  );
  const strongest = sortedByCash[0];
  const weakest = sortedByCash[sortedByCash.length - 1];
  const byRisk = [...assetMetrics].sort((a, b) => b.riskScore - a.riskScore);
  const biggestRisk = byRisk[0];

  const insights: KeyInsight[] = [];
  if (strongest) {
    insights.push({
      type: "strongest",
      assetTitle: strongest.title,
      assetId: strongest.assetId,
      message: "Highest cash-on-equity return in portfolio",
      metric: `${strongest.cashOnEquityPercent.toFixed(1)}%`,
    });
  }
  if (weakest && weakest.assetId !== strongest?.assetId) {
    insights.push({
      type: "weakest",
      assetTitle: weakest.title,
      assetId: weakest.assetId,
      message: "Lowest cash-on-equity in portfolio",
      metric: `${weakest.cashOnEquityPercent.toFixed(1)}%`,
    });
  }
  if (biggestRisk) {
    insights.push({
      type: "biggest_risk",
      assetTitle: biggestRisk.title,
      assetId: biggestRisk.assetId,
      message: "Highest risk exposure",
      metric: `Score ${biggestRisk.riskScore}`,
    });
  }
  return insights;
}

/** Full analysis run. Accepts partial portfolio; returns structured results. */
/** Benchmark deltas for comparative performance (yield vs benchmarks). */
export interface BenchmarkDeltas {
  vsGovBond: number;   // % points
  vsReMarket: number;
  vsEquityIndex: number;
  vsLocalRent: number; // rent gap %
}

export interface PortfolioAnalysisResult {
  overview: PortfolioOverview;
  assetMetrics: AssetMetrics[];
  keyInsights: KeyInsight[];
  /** Per-asset benchmark deltas (null if no benchmark). */
  benchmarkDeltas: Record<string, BenchmarkDeltas | null>;
}

export function runPortfolioAnalysis(
  props: PortfolioProperty[],
  displayCurrency: "ILS" | "GBP" | "EUR" = "GBP"
): PortfolioAnalysisResult {
  const totalEquity = props.reduce((s, p) => s + p.purchasePrice, 0);
  const totalNoi = props.reduce((s, p) => s + estimateNoi(p.monthlyRent * 12), 0);
  const portfolioAvgCashOnEquity =
    totalEquity > 0 ? (totalNoi / totalEquity) * 100 : 0;

  const assetMetrics = props.map((prop) => {
    const bench = BENCHMARKS[prop.id] ?? null;
    return computeAssetMetrics(prop, bench, portfolioAvgCashOnEquity);
  });

  const benchmarkDeltas: Record<string, BenchmarkDeltas | null> = {};
  for (const prop of props) {
    const bench = BENCHMARKS[prop.id] ?? null;
    const yieldPct = prop.annualYieldPercent;
    const rentGap = bench
      ? ((bench.localAvgRent - prop.monthlyRent) / prop.monthlyRent) * 100
      : 0;
    benchmarkDeltas[prop.id] = bench
      ? {
          vsGovBond: yieldPct - bench.govBondYield,
          vsReMarket: yieldPct - bench.reMarketReturn,
          vsEquityIndex: yieldPct - bench.equityIndexReturn,
          vsLocalRent: rentGap,
        }
      : null;
  }

  const overview = computePortfolioOverview(props, assetMetrics, displayCurrency);
  const keyInsights = getKeyInsights(assetMetrics);

  return { overview, assetMetrics, keyInsights, benchmarkDeltas };
}

/** Build per-asset metrics. Call computePortfolioOverview first to get avg for review signals. */
export function computeAssetMetrics(
  prop: PortfolioProperty,
  bench: AssetBenchmark | null,
  portfolioAvgCashOnEquity: number
): AssetMetrics {
  const grossAnnual = prop.monthlyRent * 12;
  const noi = estimateNoi(grossAnnual);
  const equity = prop.purchasePrice;
  const cashOnEquity = equity > 0 ? (noi / equity) * 100 : 0;

  const riskScore = computeRiskScore(prop, bench);
  const metrics: AssetMetrics = {
    assetId: prop.id,
    title: prop.title,
    country: prop.country as Country,
    currency: prop.purchasePriceCurrency,
    equityLocked: equity,
    grossAnnualRent: grossAnnual,
    noi,
    cashOnEquityPercent: cashOnEquity,
    grossYieldPercent: prop.annualYieldPercent,
    riskScore,
    reviewSignal: false,
  };

  const { signal, reason } = computeReviewSignal(metrics, portfolioAvgCashOnEquity, bench);
  metrics.reviewSignal = signal;
  metrics.reviewReason = reason;
  return metrics;
}