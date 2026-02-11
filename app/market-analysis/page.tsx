"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, Home, BarChart3, Zap, Lightbulb } from "lucide-react";
import { cn } from "../lib/utils";
import {
  fetchMarketAnalysis,
  generateActionableInsight,
  type PropertyAnalysis,
} from "../lib/market-analysis-data";

function formatCurrency(value: number): string {
  const n = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `£${n}`;
}

function healthScoreColor(score: number) {
  if (score >= 70) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function healthScoreBg(score: number) {
  if (score >= 70) return "bg-emerald-100 border-emerald-200";
  if (score >= 50) return "bg-amber-100 border-amber-200";
  return "bg-red-100 border-red-200";
}

interface InsightCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "highlight";
}

function InsightCard({ title, icon, children, variant = "default" }: InsightCardProps) {
  const variantClasses = variant === "highlight"
    ? "bg-slate-50 border-slate-200 border-l-4 border-l-teal-500"
    : "bg-white border-slate-200 shadow-sm";
  return (
    <div
      className={cn("rounded-xl border p-5 text-left", variantClasses)}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-slate-100">
          {icon}
        </div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function MarketAnalysisContent() {
  const [properties, setProperties] = useState<PropertyAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMarketAnalysis().then((data) => {
      if (!cancelled) {
        setProperties(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50" dir="ltr">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/?view=market-analysis"
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm"
          >
            <ArrowRight className="w-4 h-4" aria-hidden />
            Back to app
          </Link>
          <h1 className="text-lg font-semibold">Strategic Market Analysis</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-1">United Kingdom — £ GBP</h2>
          <p className="text-slate-600 text-sm">UK postcodes (e.g. L18, L15 Liverpool)</p>
        </div>

        {loading || !mounted ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {properties.map((prop) => (
              <div key={prop.id} className="space-y-6">
                {/* Property Header + Health Score */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{prop.title}</h2>
                    <p className="text-slate-600 text-sm mt-0.5">{prop.address} • {prop.zipCode}</p>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-5 py-3 rounded-xl border",
                      healthScoreBg(prop.healthScore)
                    )}
                  >
                    <Zap className={cn("w-5 h-5", healthScoreColor(prop.healthScore))} aria-hidden />
                    <div>
                      <span className="text-xs font-medium text-slate-600 block">Property Health Score</span>
                      <span className={cn("text-2xl font-bold", healthScoreColor(prop.healthScore))}>
                        {prop.healthScore}
                      </span>
                      <span className="text-slate-600">/100</span>
                    </div>
                  </div>
                </div>

                {/* Insight Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InsightCard
                    title="Rent Gap"
                    icon={<TrendingUp className="w-4 h-4" aria-hidden />}
                    variant={prop.rentGapPercent > 5 ? "highlight" : "default"}
                  >
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Your rent</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(prop.currentRent)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Market avg (neighbourhood)</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(prop.marketRent)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-slate-500">Gap</span>
                        <span
                          className={cn(
                            "font-bold",
                            prop.rentGapPercent > 0 ? "text-emerald-600" : "text-amber-600"
                          )}
                        >
                          {prop.rentGapPercent > 0 ? "+" : ""}{prop.rentGapPercent.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Area occupancy: {prop.neighborhoodOccupancy}%
                      </p>
                    </div>
                  </InsightCard>

                  <InsightCard
                    title="Value Gap"
                    icon={<Home className="w-4 h-4" aria-hidden />}
                  >
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Estimated value</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(prop.estimatedValue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Avg sold in area</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(prop.avgSoldInArea)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-slate-500">Gap</span>
                        <span
                          className={cn(
                            "font-bold",
                            prop.valueGapPercent >= 0 ? "text-emerald-600" : "text-amber-600"
                          )}
                        >
                          {prop.valueGapPercent >= 0 ? "+" : ""}{prop.valueGapPercent.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {prop.recentSalesCount} recent sales in area
                      </p>
                    </div>
                  </InsightCard>

                  <InsightCard
                    title="Operational Efficiency"
                    icon={<BarChart3 className="w-4 h-4" aria-hidden />}
                  >
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Void days (yours)</span>
                        <span className="font-semibold text-slate-900">{prop.voidDaysOnMarket} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Area average</span>
                        <span className="font-semibold text-slate-900">{prop.benchmarkVoidDays} days</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between">
                        <span className="text-slate-500">Management fee</span>
                        <span className="font-semibold text-slate-900">{prop.managementFeePercent}%</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Market average: {prop.benchmarkFeePercent}%
                      </p>
                    </div>
                  </InsightCard>
                </div>

                {/* Actionable Insights Panel — shown only when mounted (hydration-safe) */}
                <div className="bg-slate-900 rounded-xl p-6 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-teal-400" aria-hidden />
                    <h3 className="font-semibold">Actionable Insights</h3>
                  </div>
                  <p className="text-slate-200 leading-relaxed">
                    {generateActionableInsight(prop)}
                  </p>
                </div>
              </div>
            ))}

            {properties.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                No properties for UK market
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/** Root page: Suspense boundary for future async data; useEffect handles current fetch. */
export default function MarketAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="ltr">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MarketAnalysisContent />
    </Suspense>
  );
}
