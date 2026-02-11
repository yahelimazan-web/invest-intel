"use client";

/**
 * Portfolio Analysis — Executive decision-support dashboard.
 * UX: Understand portfolio state in 60 seconds. Deep data via drill-down.
 * No investment advice. Data-driven insights only.
 */
import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Wallet,
  PiggyBank,
  Percent,
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  runPortfolioAnalysis,
  type PortfolioOverview,
  type KeyInsight,
  type AssetMetrics,
  type BenchmarkDeltas,
} from "../lib/portfolio-analysis";
import type { PortfolioProperty } from "../components/PropertyEditModal";

// Same sample portfolio as main app (in production, fetch from context/API)
const INITIAL_PORTFOLIO: PortfolioProperty[] = [
  {
    id: "prop-uk-1",
    postcode: "L18",
    title: "42 Penny Lane, Liverpool",
    address: "42 Penny Lane, Liverpool",
    image: null,
    monthlyRent: 950,
    annualYieldPercent: 6.8,
    purchasePrice: 180_000,
    purchasePriceCurrency: "GBP",
    purchaseDate: "2023-06-15",
    status: "needs_attention",
    country: "UK",
  },
  {
    id: "prop-uk-2",
    title: "12 James Holt Avenue, Liverpool",
    address: "12 James Holt Avenue, Liverpool",
    postcode: "L18",
    image: null,
    monthlyRent: 850,
    annualYieldPercent: 5.2,
    purchasePrice: 180_000,
    purchasePriceCurrency: "GBP",
    purchaseDate: "2022-11-20",
    status: "rented",
    country: "UK",
  },
];

function formatCurrency(value: number, currency: "ILS" | "GBP" | "EUR"): string {
  const n = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (currency === "ILS") return `₪${n}`;
  if (currency === "GBP") return `£${n}`;
  return `€${n}`;
}

function formatCompact(value: number, currency: "ILS" | "GBP" | "EUR"): string {
  const sym = currency === "ILS" ? "₪" : currency === "GBP" ? "£" : "€";
  if (value >= 1_000_000) return `${sym}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${sym}${(value / 1_000).toFixed(1)}k`;
  return formatCurrency(value, currency);
}

function MetricCard({
  label,
  value,
  icon,
  subtext,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  subtext?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="financial-value mt-0.5">{value}</p>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: KeyInsight }) {
  const config = {
    strongest: { icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
    weakest: { icon: TrendingDown, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    biggest_risk: { icon: AlertTriangle, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" },
  }[insight.type];
  const Icon = config.icon;

  return (
    <div className={cn("rounded-xl border p-4", config.bg, config.border)} dir="ltr">
      <div className="flex items-start gap-3">
        <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", config.color)} aria-hidden />
        <div>
          <p className="font-medium text-slate-900">{insight.assetTitle}</p>
          <p className="text-sm text-slate-600 mt-0.5">{insight.message}</p>
          {insight.metric && (
            <p className={cn("text-sm font-semibold mt-1", config.color)}>{insight.metric}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PortfolioAnalysisContent() {
  const [portfolio] = useState<PortfolioProperty[]>(INITIAL_PORTFOLIO);
  const displayCurrency = "GBP" as const;
  const [showAssets, setShowAssets] = useState(false);

  const result = useMemo(
    () => runPortfolioAnalysis(portfolio, displayCurrency),
    [portfolio, displayCurrency]
  );

  const { overview, assetMetrics, keyInsights, benchmarkDeltas } = result;

  return (
    <div className="min-h-screen bg-slate-50" dir="ltr">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm"
          >
            <ArrowRight className="w-4 h-4" aria-hidden />
            Back to app
          </Link>
          <h1 className="text-lg font-semibold">Portfolio Analysis — £ GBP</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Executive summary — 60 seconds */}
        <p className="text-slate-600 text-sm mb-6">
          Understand the state of your portfolio at a glance. Data-driven insights; not investment advice.
        </p>

        {/* 6 headline metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <MetricCard
            label="Total portfolio value"
            value={formatCompact(overview.totalValue, overview.displayCurrency)}
            icon={<Wallet className="w-5 h-5" />}
          />
          <MetricCard
            label="Total equity locked"
            value={formatCompact(overview.totalEquity, overview.displayCurrency)}
            icon={<Wallet className="w-5 h-5" />}
          />
          <MetricCard
            label="Net operating income (NOI)"
            value={formatCompact(overview.totalNoi, overview.displayCurrency)}
            subtext="Annual, estimated"
            icon={<PiggyBank className="w-5 h-5" />}
          />
          <MetricCard
            label="Cash-on-equity return"
            value={`${overview.cashOnEquityReturn.toFixed(1)}%`}
            icon={<Percent className="w-5 h-5" />}
          />
          <MetricCard
            label="Risk-adjusted score"
            value={`${overview.riskAdjustedScore} / 100`}
            subtext="Composite; higher = lower risk"
            icon={<Shield className="w-5 h-5" />}
          />
        </div>

        {/* 3 key insights */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Key insights
          </h2>
          <div className="space-y-3">
            {keyInsights.map((insight) => (
              <InsightCard key={`${insight.type}-${insight.assetId}`} insight={insight} />
            ))}
          </div>
        </section>

        {/* Drill-down: per-asset */}
        <section>
          <button
            type="button"
            onClick={() => setShowAssets(!showAssets)}
            className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 mb-3"
          >
            <ChevronDown className={cn("w-4 h-4 transition-transform", showAssets && "rotate-180")} />
            {showAssets ? "Hide" : "Show"} per-asset metrics
          </button>

          {showAssets && (
            <div className="space-y-4">
              {assetMetrics.map((m) => (
                <AssetCard
                  key={m.assetId}
                  metrics={m}
                  overview={overview}
                  deltas={benchmarkDeltas[m.assetId] ?? null}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function AssetCard({
  metrics,
  overview,
  deltas,
}: {
  metrics: AssetMetrics;
  overview: PortfolioOverview;
  deltas: BenchmarkDeltas | null;
}) {
  const formatVal = (v: number) =>
    `£${Math.round(v).toLocaleString()}`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm" dir="ltr">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">{metrics.title}</h3>
          <p className="text-xs text-slate-500">{metrics.country}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium",
              metrics.reviewSignal ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
            )}
          >
            {metrics.reviewSignal ? "May be worth reviewing" : "On track"}
          </span>
          <span className="text-xs text-slate-500">Risk: {metrics.riskScore}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-slate-500">Equity</p>
          <p className="font-semibold text-slate-900">{formatVal(metrics.equityLocked)}</p>
        </div>
        <div>
          <p className="text-slate-500">NOI</p>
          <p className="font-semibold text-slate-900">{formatVal(metrics.noi)}</p>
        </div>
        <div>
          <p className="text-slate-500">Cash-on-equity</p>
          <p
            className={cn(
              "font-semibold",
              metrics.cashOnEquityPercent >= overview.cashOnEquityReturn
                ? "text-emerald-600"
                : "text-amber-600"
            )}
          >
            {metrics.cashOnEquityPercent.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-slate-500">Gross yield</p>
          <p className="font-semibold text-slate-900">{metrics.grossYieldPercent}%</p>
        </div>
      </div>

      {deltas && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-600">vs benchmarks</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>Gov bond: {deltas.vsGovBond >= 0 ? "+" : ""}{deltas.vsGovBond.toFixed(1)}pp</span>
            <span>RE market: {deltas.vsReMarket >= 0 ? "+" : ""}{deltas.vsReMarket.toFixed(1)}pp</span>
            <span>Rent gap: {deltas.vsLocalRent >= 0 ? "+" : ""}{deltas.vsLocalRent.toFixed(0)}%</span>
          </div>
        </div>
      )}
      {metrics.reviewReason && (
        <p className="text-xs text-slate-500 mt-2">{metrics.reviewReason}</p>
      )}
    </div>
  );
}

export default function PortfolioAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="ltr">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PortfolioAnalysisContent />
    </Suspense>
  );
}
