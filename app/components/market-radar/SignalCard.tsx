"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { MarketSignal } from "../../lib/market-radar/types";
import { cn } from "../../lib/utils";

const SIGNAL_LABELS: Record<MarketSignal["signalType"], string> = {
  PRICE_MOMENTUM: "Price Momentum",
  RENT_MOMENTUM: "Rent Momentum",
  PLANNING_SPIKE: "Planning Spike",
};

function TrendIcon({ trend }: { trend: MarketSignal["trend"] }) {
  if (trend === "up")
    return <TrendingUp className="w-4 h-4 text-emerald-600" aria-hidden />;
  if (trend === "down")
    return <TrendingDown className="w-4 h-4 text-amber-600" aria-hidden />;
  return <Minus className="w-4 h-4 text-slate-500" aria-hidden />;
}

interface SignalCardProps {
  signal: MarketSignal;
}

export default function SignalCard({ signal }: SignalCardProps) {
  const title = SIGNAL_LABELS[signal.signalType];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-left">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <div className="flex items-center gap-2">
          <TrendIcon trend={signal.trend} />
          <span className="text-sm font-medium text-slate-600">
            Score: <span className="text-slate-900">{signal.score}</span>/100
          </span>
        </div>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed mb-4">
        {signal.summary}
      </p>
      <p className="text-xs text-slate-500 mb-2">
        Why this matters for investors:{" "}
        {signal.signalType === "PRICE_MOMENTUM" &&
          "Price momentum indicates capital appreciation potential and market demand."}
        {signal.signalType === "RENT_MOMENTUM" &&
          "Rent growth outpacing prices can improve yields; monitor for sustainable demand."}
        {signal.signalType === "PLANNING_SPIKE" &&
          "Increased planning activity suggests supply pipeline changes and neighbourhood evolution."}
      </p>
      <div className="pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-500">Sources:</span>
        <ul className="text-xs text-slate-600 mt-0.5">
          {signal.sources.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
