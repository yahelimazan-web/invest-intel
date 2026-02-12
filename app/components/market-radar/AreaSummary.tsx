"use client";

interface AreaSummaryProps {
  areaCode: string;
  areaName?: string;
}

export default function AreaSummary({ areaCode, areaName }: AreaSummaryProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Selected area
        </span>
      </div>
      <h2 className="text-xl font-bold text-slate-900 mt-1">
        {areaName ? `${areaName} (${areaCode})` : areaCode}
      </h2>
      <p className="text-sm text-slate-600 mt-0.5">
        UK postcode district • Market signals for this area
      </p>
    </div>
  );
}
