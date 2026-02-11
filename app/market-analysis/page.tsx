"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, Home, BarChart3, Zap, Lightbulb } from "lucide-react";
import { cn } from "../lib/utils";
import {
  fetchMarketAnalysis,
  generateActionableInsight,
  type MarketTab,
  type PropertyAnalysis,
} from "../lib/market-analysis-data";

function formatCurrency(value: number, currency: "GBP" | "ILS"): string {
  const n = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (currency === "ILS") return `₪${n}`;
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
  return (
    <div
      className={cn(
        "rounded-xl border p-5 text-right",
        variant === "highlight"
          ? "bg-slate-50 border-slate-200 border-s-4 border-s-teal-500"
          : "bg-white border-slate-200 shadow-sm"
      )}
      dir="rtl"
    >
      <div className="flex items-center gap-2 mb-3 justify-end">
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
  const [tab, setTab] = useState<MarketTab>("israel");
  const [properties, setProperties] = useState<PropertyAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMarketAnalysis(tab).then((data) => {
      if (!cancelled) {
        setProperties(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [tab]);

  const tabLabel = tab === "israel" ? "ישראל" : "אנגליה";
  const currencySymbol = tab === "israel" ? "₪" : "£";

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/?view=market-analysis"
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm"
          >
            <ArrowRight className="w-4 h-4" aria-hidden />
            חזרה לאפליקציה
          </Link>
          <h1 className="text-lg font-semibold">ניתוח שוק אסטרטגי</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8">
          {(["israel", "england"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "px-6 py-3 rounded-xl font-medium transition-all",
                tab === t
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              )}
            >
              {t === "israel" ? "ישראל (₪)" : "אנגליה (£)"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {properties.map((prop) => (
              <div key={prop.id} className="space-y-6">
                {/* Property Header + Health Score */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="text-right">
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
                    <div className="text-right">
                      <span className="text-xs font-medium text-slate-600 block">ציון בריאות הנכס</span>
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
                    title="פער שכירות"
                    icon={<TrendingUp className="w-4 h-4" aria-hidden />}
                    variant={prop.rentGapPercent > 5 ? "highlight" : "default"}
                  >
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">השכירות שלך</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(prop.currentRent, prop.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">ממוצע שוק (שכונה)</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(prop.marketRent, prop.currency)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-slate-500">פער</span>
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
                        תפוסה באזור: {prop.neighborhoodOccupancy}%
                      </p>
                    </div>
                  </InsightCard>

                  <InsightCard
                    title="פער ערך"
                    icon={<Home className="w-4 h-4" aria-hidden />}
                  >
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">שווי משוער</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(prop.estimatedValue, prop.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">ממוצע מכירות (מיקוד)</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(prop.avgSoldInArea, prop.currency)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-slate-500">פער</span>
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
                        {prop.recentSalesCount} מכירות אחרונות באזור
                      </p>
                    </div>
                  </InsightCard>

                  <InsightCard
                    title="יעילות ניהולית"
                    icon={<BarChart3 className="w-4 h-4" aria-hidden />}
                  >
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">ימי ריק (שלך)</span>
                        <span className="font-semibold text-slate-900">{prop.voidDaysOnMarket} ימים</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">ממוצע אזורי</span>
                        <span className="font-semibold text-slate-900">{prop.benchmarkVoidDays} ימים</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between">
                        <span className="text-slate-500">דמי ניהול</span>
                        <span className="font-semibold text-slate-900">{prop.managementFeePercent}%</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        ממוצע שוק: {prop.benchmarkFeePercent}%
                      </p>
                    </div>
                  </InsightCard>
                </div>

                {/* Actionable Insights Panel — rendered after mount to avoid hydration mismatch */}
                {mounted && (
                  <div className="bg-slate-900 rounded-xl p-6 text-white text-right" dir="rtl">
                    <div className="flex items-center gap-2 mb-3 justify-end">
                      <Lightbulb className="w-5 h-5 text-teal-400" aria-hidden />
                      <h3 className="font-semibold">תובנות מעשיות</h3>
                    </div>
                    <p className="text-slate-200 leading-relaxed">
                      {generateActionableInsight(prop)}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {properties.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                אין נכסים בתיק עבור {tabLabel}
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="rtl">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MarketAnalysisContent />
    </Suspense>
  );
}
