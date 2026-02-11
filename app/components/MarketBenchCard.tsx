"use client";

import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { cn } from "../lib/utils";
import type { BenchmarkResult } from "../lib/market-benchmark";

function formatCurrency(value: number, currency: "GBP" | "ILS" | "EUR"): string {
  const n = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (currency === "ILS") return `₪${n}`;
  if (currency === "GBP") return `£${n}`;
  return `€${n}`;
}

interface MarketBenchCardProps {
  title: string;
  benchmark: BenchmarkResult;
}

export default function MarketBenchCard({ title, benchmark }: MarketBenchCardProps) {
  const { yourRent, marketRent, gapPercent, isOpportunity, aiAdvice, currency } = benchmark;
  const gapPct = Math.round(gapPercent * 100);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className="bento-card p-5 border border-slate-200 rounded-xl shadow-sm bg-white text-right"
      dir="rtl"
      role="article"
      aria-label={`שוואת שוק: ${title}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
            isOpportunity ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
          )}
        >
          {isOpportunity ? (
            <>
              <TrendingUp className="w-3.5 h-3.5" aria-hidden />
              הזדמנות
            </>
          ) : (
            "מאוזן"
          )}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <span className="text-slate-500 font-medium">השכירות שלך</span>
          <div className="financial-value mt-0.5 text-slate-900">
            {formatCurrency(yourRent, currency)}
          </div>
        </div>
        <div>
          <span className="text-slate-500 font-medium">ממוצע שוק</span>
          <div className="financial-value mt-0.5 text-slate-900">
            {formatCurrency(marketRent, currency)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 justify-end">
        <span className="text-slate-500 text-sm">פער תשואה:</span>
        <span
          className={cn(
            "font-semibold text-sm",
            gapPct > 0 ? "text-emerald-600" : gapPct < 0 ? "text-amber-600" : "text-slate-600"
          )}
        >
          {gapPct > 0 ? "+" : ""}{gapPct}%
        </span>
      </div>

      {mounted && (
        <div className="pt-3 border-t border-slate-200">
          <p className="text-sm text-slate-600 leading-relaxed">{aiAdvice}</p>
        </div>
      )}
    </div>
  );
}
