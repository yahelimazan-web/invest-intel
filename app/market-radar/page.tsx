"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Radio, Search } from "lucide-react";
import MarketRadarMap from "../components/market-radar/MarketRadarMap";
import SignalCard from "../components/market-radar/SignalCard";
import AreaSummary from "../components/market-radar/AreaSummary";
import { generateSignalsForArea } from "../lib/market-radar/signalGenerators";
import { UK_AREAS } from "../lib/market-radar/mockData";
import type { MarketSignal } from "../lib/market-radar/types";
import { cn } from "../lib/utils";

function MarketRadarContent() {
  const [selectedArea, setSelectedArea] = useState(UK_AREAS[0]?.code ?? "L18");
  const [customInput, setCustomInput] = useState("");
  const [signals, setSignals] = useState<MarketSignal[]>([]);

  const areaCode = customInput.trim() || selectedArea;
  const areaInfo = UK_AREAS.find((a) => a.code === areaCode);

  const loadSignals = useCallback(() => {
    const next = generateSignalsForArea(areaCode);
    setSignals(next);
  }, [areaCode]);

  useEffect(() => {
    loadSignals();
  }, [loadSignals]);

  return (
    <div className="min-h-screen bg-slate-50" dir="ltr" suppressHydrationWarning>
      <header className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm"
          >
            <ArrowRight className="w-4 h-4" aria-hidden />
            Back to app
          </Link>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-teal-400" aria-hidden />
            <h1 className="text-lg font-semibold">Market Radar</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-1">
            UK Market Intelligence
          </h2>
          <p className="text-slate-600 text-sm">
            Discover investment opportunities using early signals — price trends,
            rental momentum, and planning activity.
          </p>
        </div>

        {/* Area selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select area (postcode or area code)
          </label>
          <div className="flex flex-wrap gap-3">
            <select
              value={customInput ? "" : selectedArea}
              onChange={(e) => {
                setCustomInput("");
                setSelectedArea(e.target.value);
              }}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {UK_AREAS.map((area) => (
                <option key={area.code} value={area.code}>
                  {area.name} ({area.code})
                </option>
              ))}
            </select>
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Or enter postcode (e.g. L18, M20)"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 w-64 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={loadSignals}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <Search className="w-4 h-4" aria-hidden />
              Load signals
            </button>
          </div>
        </div>

        {/* Map + Area summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <MarketRadarMap areaCode={areaCode} className="aspect-[4/3]" />
          </div>
          <div>
            <AreaSummary
              areaCode={areaCode}
              areaName={areaInfo?.name}
            />
          </div>
        </div>

        {/* Signals */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Market signals for {areaCode}
          </h3>
          {signals.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              <p className="mb-2">No signals loaded yet.</p>
              <p className="text-sm">
                Select an area and click &quot;Load signals&quot; to view price
                momentum, rental trends, and planning activity.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {signals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function MarketRadarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="ltr">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MarketRadarContent />
    </Suspense>
  );
}
