"use client";

import { useState, useCallback, useMemo, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Wallet, Percent, Banknote, Gauge, ChevronDown, Calendar, ArrowRight, Pencil, Upload, Save, X } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "./lib/utils";
import Sidebar, { type PageId, SIDEBAR_WIDTH } from "./components/Sidebar";
import PropertyFileManager from "./components/PropertyFileManager";
import PropertyEditModal, { type PortfolioProperty, type PropertyEnrichment } from "./components/PropertyEditModal";
import PropertyCardImage from "./components/PropertyCardImage";
import FloatingAIAssistant from "./components/FloatingAIAssistant";
import MarketBenchCard from "./components/MarketBenchCard";
import {
  mapPropertyToArea,
  runBenchmark,
  type BenchmarkResult,
} from "./lib/market-benchmark";
import { fetchEnrichmentForPortfolio } from "./lib/property-enrichment";
import { useAuth } from "./lib/auth";
import { computeGrossYield, computeNetYield } from "./lib/property-yield";

// Sample portfolio properties (UK only)
const INITIAL_PORTFOLIO: PortfolioProperty[] = [
  {
    id: "prop-uk-1",
    title: "42 Penny Lane, Liverpool",
    address: "42 Penny Lane, Liverpool",
    postcode: "L18",
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

// Deterministic formatting (no locale) to avoid hydration mismatch. UK app — GBP only.
function formatPropertyCurrency(value: number, _currency: "GBP"): string {
  const n = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `£${n}`;
}

function formatPropertyDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Property cards use Street View → Static Map → OSM Map. No generic photos. */

// Placeholder KPI data (no real data yet)
const KPI = {
  portfolioValue: "£1.24M",
  trendUp: true,
  avgYield: "5.2%",
  monthlyNetCashflow: "£4,280",
  healthScore: 78,
};

type ChartMetric = "portfolio-value" | "cashflow" | "yield";

// Placeholder 12-month data — deterministic (no Math.random) to avoid hydration mismatch
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CHART_DATA_PORTFOLIO = MONTHS.map((month, i) => ({
  month,
  value: 1_000_000 + 40_000 * i + (i * 1234) % 20_000,
}));
const CHART_DATA_CASHFLOW = MONTHS.map((_, i) => ({
  month: MONTHS[i],
  value: 3_500 + 200 * i + (i * 317) % 500,
}));
const CHART_DATA_YIELD = MONTHS.map((_, i) => ({
  month: MONTHS[i],
  value: 4.2 + i * 0.08 + (i % 10) * 0.02,
}));

function healthScoreColor(score: number) {
  if (score >= 71) return "text-emerald-600";
  if (score >= 41) return "text-amber-600";
  return "text-red-600";
}

function healthScoreRing(score: number) {
  if (score >= 71) return "border-emerald-400";
  if (score >= 41) return "border-amber-400";
  return "border-red-400";
}

const CHART_METRIC_OPTIONS: { value: ChartMetric; label: string }[] = [
  { value: "portfolio-value", label: "Portfolio Value" },
  { value: "cashflow", label: "Cashflow" },
  { value: "yield", label: "Annual Yield" },
];

type ChartRange = "1M" | "6M" | "1Y" | "custom";

function formatDateForInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function AppContent() {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState<PageId>("dashboard");
  const [chartMetric, setChartMetric] = useState<ChartMetric>("portfolio-value");
  const [chartRange, setChartRange] = useState<ChartRange>("1Y");
  // Date range: stable initial values to avoid hydration mismatch; set real dates in useEffect
  const [customStart, setCustomStart] = useState("2024-01-01");
  const [customEnd, setCustomEnd] = useState("2024-12-31");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    const end = new Date();
    const start = new Date(end);
    start.setFullYear(start.getFullYear() - 1);
    setCustomStart(formatDateForInput(start));
    setCustomEnd(formatDateForInput(end));
  }, []);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const datePickerTriggerRef = useRef<HTMLButtonElement>(null);
  const handlePageChange = useCallback((page: PageId) => setCurrentPage(page), []);

  // Portfolio: properties list (editable), documents modal, detail view, edit modal
  const [portfolioProperties, setPortfolioProperties] = useState<PortfolioProperty[]>(INITIAL_PORTFOLIO);
  const [propertyForDocs, setPropertyForDocs] = useState<{ id: string; name: string } | null>(null);
  const [viewPropertyId, setViewPropertyId] = useState<string | null>(null);
  const [editingProperty, setEditingProperty] = useState<PortfolioProperty | null>(null);
  const [propertyEnrichment, setPropertyEnrichment] = useState<Record<string, PropertyEnrichment>>({});
  const [propertyImages, setPropertyImages] = useState<Record<string, string[]>>({});
  // Inline edit mode per card
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<{
    purchasePrice: number;
    monthlyRent: number;
    image?: string | null;
  } | null>(null);
  const [isSavingCard, setIsSavingCard] = useState(false);

  const handleSaveCard = useCallback(async () => {
    if (!editingCardId || !editingDraft) return;
    setIsSavingCard(true);
    try {
      const res = await fetch(`/api/properties/${editingCardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingDraft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");
      const grossYield = computeGrossYield(editingDraft.monthlyRent, editingDraft.purchasePrice);
      const updates = { ...editingDraft, annualYieldPercent: grossYield };
      setPortfolioProperties((prev) =>
        prev.map((p) =>
          p.id === editingCardId ? { ...p, ...updates } : p
        )
      );
      setEditingCardId(null);
      setEditingDraft(null);
    } catch (err) {
      console.error("[Portfolio] Save failed:", err);
    } finally {
      setIsSavingCard(false);
    }
  }, [editingCardId, editingDraft]);

  const handleCancelCard = useCallback(() => {
    setEditingCardId(null);
    setEditingDraft(null);
  }, []);

  // Market Analysis: benchmark results (Comparison Engine)
  const [benchmarkResults, setBenchmarkResults] = useState<Record<string, BenchmarkResult>>({});
  const [benchmarkReady, setBenchmarkReady] = useState(false);
  const { user } = useAuth();

  // Open portfolio view when visiting /?view=portfolio (e.g. redirect from /portfolio)
  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "portfolio") setCurrentPage("portfolio");
    if (view === "market-analysis") setCurrentPage("market-analysis");
  }, [searchParams]);

  // Fetch property enrichment (Street View, EPC, Land Registry) when viewing portfolio
  useEffect(() => {
    if (currentPage !== "portfolio" || portfolioProperties.length === 0) return;
    let cancelled = false;
    fetchEnrichmentForPortfolio(portfolioProperties).then((data) => {
      if (!cancelled) setPropertyEnrichment(data);
    });
    return () => { cancelled = true; };
  }, [currentPage, portfolioProperties]);

  // Fetch property document images (Zoopla-style gallery) when viewing portfolio
  useEffect(() => {
    if (currentPage !== "portfolio" || portfolioProperties.length === 0) return;
    const userId = user?.id ?? "anon";
    let cancelled = false;
    const run = async () => {
      const next: Record<string, string[]> = {};
      for (const p of portfolioProperties) {
        try {
          const res = await fetch(`/api/properties/${p.id}/images?userId=${encodeURIComponent(userId)}`);
          const data = await res.json().catch(() => ({}));
          if (!cancelled && Array.isArray(data.imageUrls)) next[p.id] = data.imageUrls;
        } catch (_) {}
      }
      if (!cancelled) setPropertyImages((prev) => ({ ...prev, ...next }));
    };
    run();
    return () => { cancelled = true; };
  }, [currentPage, portfolioProperties, user?.id]);

  // Run market benchmarks for properties with mapped areas
  useEffect(() => {
    setBenchmarkReady(false);
    let cancelled = false;
    const run = async () => {
      const results: Record<string, BenchmarkResult> = {};
      for (const prop of portfolioProperties) {
        const areaKey = mapPropertyToArea(prop.id, prop.country, prop.address, prop.title);
        if (!areaKey) continue;
        const b = await runBenchmark(areaKey, prop.monthlyRent, "GBP");
        if (!cancelled) results[prop.id] = b;
      }
      if (!cancelled) {
        setBenchmarkResults(results);
        setBenchmarkReady(true);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [portfolioProperties]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        isDatePickerOpen &&
        datePickerRef.current &&
        datePickerTriggerRef.current &&
        !datePickerRef.current.contains(e.target as Node) &&
        !datePickerTriggerRef.current.contains(e.target as Node)
      ) {
        setIsDatePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDatePickerOpen]);

  const applyCustomRange = useCallback(() => {
    setChartRange("custom");
    setIsDatePickerOpen(false);
  }, []);

  const chartData = useMemo(() => {
    if (chartMetric === "portfolio-value") return CHART_DATA_PORTFOLIO;
    if (chartMetric === "cashflow") return CHART_DATA_CASHFLOW;
    return CHART_DATA_YIELD;
  }, [chartMetric]);

  const formatY = useMemo(() => {
    if (chartMetric === "yield") return (v: number) => `${v.toFixed(1)}%`;
    if (chartMetric === "cashflow") return (v: number) => `£${(v / 1000).toFixed(1)}k`;
    return (v: number) => `£${(v / 1000).toFixed(0)}k`;
  }, [chartMetric]);

  return (
    <div className="min-h-screen bg-slate-50" dir="ltr" suppressHydrationWarning>
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />

      <main
        className="min-h-screen flex-1 min-w-0 bg-slate-50"
        style={{ marginLeft: SIDEBAR_WIDTH }}
      >
        {currentPage === "dashboard" && (
          <div className="p-8">
            {/* Step 1: KPI Ribbon - 4 cards, no borders, shadow-sm, maximum whitespace */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Portfolio Value — RTL: icon on right (first in DOM) */}
              <div className="bg-white rounded-xl shadow-sm p-6 flex flex-row items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                  <Wallet className="w-5 h-5" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-500 mb-1">Portfolio Value</p>
                  <p className="text-2xl font-semibold text-slate-900 tracking-tight">
                    {KPI.portfolioValue}
                  </p>
                  <span
                    className={`inline-flex items-center text-xs font-medium mt-1 ${
                      KPI.trendUp ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {KPI.trendUp ? "↑" : "↓"} 2.1%
                  </span>
                </div>
              </div>

              {/* Avg. Yield */}
              <div className="bg-white rounded-xl shadow-sm p-6 flex flex-row items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                  <Percent className="w-5 h-5" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-500 mb-1">Avg. Yield</p>
                  <p className="text-2xl font-semibold text-slate-900 tracking-tight">
                    {KPI.avgYield}
                  </p>
                </div>
              </div>

              {/* Monthly Net Cashflow */}
              <div className="bg-white rounded-xl shadow-sm p-6 flex flex-row items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                  <Banknote className="w-5 h-5" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-500 mb-1">Monthly Net Cashflow</p>
                  <p className="text-2xl font-semibold text-slate-900 tracking-tight">
                    {KPI.monthlyNetCashflow}
                  </p>
                </div>
              </div>

              {/* Health Score (AI) — color ring by score */}
              <div className="bg-white rounded-xl shadow-sm p-6 flex flex-row items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 bg-slate-50 ${healthScoreRing(KPI.healthScore)}`}
                  aria-hidden
                >
                  <Gauge className={`w-6 h-6 ${healthScoreColor(KPI.healthScore)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-500 mb-1">Health Score (AI)</p>
                  <p className={`text-2xl font-semibold tracking-tight ${healthScoreColor(KPI.healthScore)}`}>
                    {KPI.healthScore}
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Main Trend Chart — metric dropdown + time range (1M, 6M, 1Y) + date range picker */}
            <div className="mt-10 bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-row flex-wrap justify-between items-center gap-4 mb-6">
                {/* Time range + Custom date picker (RTL: left side) */}
                <div className="flex flex-row items-center gap-2">
                  {(["1M", "6M", "1Y"] as const).map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setChartRange(range)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        chartRange === range
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                  <div className="relative">
                    <button
                      ref={datePickerTriggerRef}
                      type="button"
                      onClick={() => setIsDatePickerOpen((o) => !o)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        chartRange === "custom"
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                      aria-expanded={isDatePickerOpen}
                      aria-haspopup="dialog"
                      aria-label="Select dates"
                    >
                      <Calendar className="w-4 h-4" aria-hidden />
                      <span>Select dates</span>
                    </button>
                    {isDatePickerOpen && (
                      <div
                        ref={datePickerRef}
                        role="dialog"
                        aria-label="Date range selection"
                        className="absolute top-full mt-2 left-0 z-50 min-w-[280px] rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
                        >
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="chart-start-date" className="block text-sm font-medium text-slate-700 mb-1">
                              Start date
                            </label>
                            <input
                              id="chart-start-date"
                              type="date"
                              value={customStart}
                              onChange={(e) => setCustomStart(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label htmlFor="chart-end-date" className="block text-sm font-medium text-slate-700 mb-1">
                              End date
                            </label>
                            <input
                              id="chart-end-date"
                              type="date"
                              value={customEnd}
                              onChange={(e) => setCustomEnd(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={applyCustomRange}
                            className="w-full rounded-lg bg-teal-600 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Metric dropdown (RTL: right side) */}
                <div className="relative">
                  <select
                    value={chartMetric}
                    onChange={(e) => setChartMetric(e.target.value as ChartMetric)}
                    className="appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2 pl-4 pr-9 text-sm font-medium text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    aria-label="Chart metric"
                  >
                    {CHART_METRIC_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" aria-hidden />
                </div>
              </div>
              <div className="h-[320px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                    <defs>
                      <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0d9488" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickMargin={8}
                    />
                    <YAxis
                      orientation="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickFormatter={formatY}
                      width={48}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.07)",
                      }}
                      formatter={(value: number | undefined) => [formatY(value ?? 0), ""]}
                      labelFormatter={(label) => label}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#0d9488"
                      strokeWidth={2}
                      fill="url(#trendFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Action Center — Today-only; not affected by date range filters */}
            <div className="mt-10">
              <p className="text-sm text-slate-500 mb-2">
                Since your last visit, 3 things have changed in your portfolio
              </p>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                Needs attention & insights
              </h3>
              <p className="text-xs text-slate-400 mb-6">Today only — not affected by date filters</p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Card 1 — Critical: yield drop */}
                <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
                  <div>
                    <span className="text-xs font-medium text-red-600">Critical</span>
                    <h4 className="text-base font-semibold text-slate-900 mt-0.5">Yield drop</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      A property has fallen below the regional benchmark. Worth checking.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="self-start text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    Check now
                  </button>
                </div>
                {/* Card 2 — Insight: upgrade opportunity */}
                <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
                  <div>
                    <span className="text-xs font-medium text-amber-600">Insight</span>
                    <h4 className="text-base font-semibold text-slate-900 mt-0.5">Upgrade opportunity</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Light refurbishment on Property B could raise rent by 12%.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="self-start text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    Check now
                  </button>
                </div>
                {/* Card 3 — Task: missing data */}
                <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
                  <div>
                    <span className="text-xs font-medium text-slate-500">Task</span>
                    <h4 className="text-base font-semibold text-slate-900 mt-0.5">Missing data</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      EPC document missing for Property C.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="self-start text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    Check now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === "portfolio" && (
          <div className="p-8">
            {viewPropertyId ? (
              <div className="max-w-2xl">
                <button
                  type="button"
                  onClick={() => setViewPropertyId(null)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-600 mb-6"
                >
                  <ArrowRight className="w-4 h-4" aria-hidden />
                  Back to portfolio
                </button>
                {(() => {
                  const prop = portfolioProperties.find((p) => p.id === viewPropertyId);
                  if (!prop) return null;
                  return (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                      {(() => {
                        const enrich = propertyEnrichment[prop.id];
                        return (
                          <>
                            <div className="mb-6 rounded-xl overflow-hidden border border-slate-200 aspect-[4/3]">
                              <PropertyCardImage
                                prop={prop}
                                enrichment={enrich}
                                propertyImageUrls={propertyImages[prop.id]}
                                alt={`${prop.title} — property photo`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h1 className="text-xl font-semibold text-slate-900">{prop.title}</h1>
                            <p className="text-slate-500 mt-1">{prop.address}</p>
                            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-slate-500">Monthly rent</span>
                                <div className="font-medium text-slate-900">
                                  {formatPropertyCurrency(prop.monthlyRent, prop.purchasePriceCurrency)}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-500">Gross yield</span>
                                <div className="font-medium text-slate-900">
                                  {prop.purchasePrice > 0 ? computeGrossYield(prop.monthlyRent, prop.purchasePrice).toFixed(1) : prop.annualYieldPercent}%
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-500">Net yield (incl. 10% mgmt)</span>
                                <div className="font-medium text-slate-900">
                                  {prop.purchasePrice > 0 ? computeNetYield(prop.monthlyRent, prop.purchasePrice).toFixed(1) : "—"}%
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-500">Purchase price</span>
                                <div className="font-medium text-slate-900">
                                  {formatPropertyCurrency(prop.purchasePrice, prop.purchasePriceCurrency)}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-500">Purchase date</span>
                                <div className="font-medium text-slate-900">{formatPropertyDate(prop.purchaseDate)}</div>
                              </div>
                              {enrich && (
                                <>
                                  {enrich.epcRating && (
                                    <div>
                                      <span className="text-slate-500">EPC rating</span>
                                      <div className="font-medium text-slate-900">{enrich.epcRating}</div>
                                    </div>
                                  )}
                                  {enrich.propertyType && (
                                    <div>
                                      <span className="text-slate-500">Property type</span>
                                      <div className="font-medium text-slate-900">{enrich.propertyType}</div>
                                    </div>
                                  )}
                                  {enrich.lastSoldPrice != null && (
                                    <div className="col-span-2">
                                      <span className="text-slate-500">Last sold (Land Registry)</span>
                                      <div className="font-medium text-slate-900">
                                        {formatPropertyCurrency(enrich.lastSoldPrice, prop.purchasePriceCurrency)}
                                        {enrich.lastSoldDate && ` — ${enrich.lastSoldDate}`}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </>
                        );
                      })()}
                      <span
                        className={cn(
                          "inline-block mt-4 px-3 py-1 rounded-full text-xs font-medium",
                          prop.status === "rented" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        )}
                      >
                        {prop.status === "rented" ? "Rented" : "Needs attention"}
                      </span>
                      <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingProperty(prop)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                        >
                          <Pencil className="w-4 h-4" aria-hidden />
                          Full Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setPropertyForDocs({ id: prop.id, name: prop.title })}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors border border-teal-200"
                        >
                          <Upload className="w-4 h-4" aria-hidden />
                          Upload Documents
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">My Portfolio</h1>
                <p className="text-slate-600 mb-6">Properties & documents</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {portfolioProperties.map((prop) => (
                    <div
                      key={prop.id}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative"
                    >
                      {/* Top-right: Edit (pencil) — toggles inline edit mode */}
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                        <button
                          type="button"
                          className={cn(
                            "p-2 rounded-lg shadow-md transition-colors border",
                            editingCardId === prop.id
                              ? "bg-teal-600 text-white border-teal-500/50"
                              : "bg-slate-900/85 text-white border-white/10 hover:bg-slate-800"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (editingCardId === prop.id) {
                              handleCancelCard();
                            } else {
                              setEditingCardId(prop.id);
                              setEditingDraft({
                                purchasePrice: prop.purchasePrice,
                                monthlyRent: prop.monthlyRent,
                                image: prop.image ?? undefined,
                              });
                            }
                          }}
                          aria-label="Edit property"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-inset rounded-t-xl"
                        onClick={() => {
                          if (editingCardId === prop.id) return;
                          setViewPropertyId(prop.id);
                        }}
                        aria-label={`View property ${prop.title}`}
                      >
                        <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden relative">
                          <PropertyCardImage
                            prop={prop}
                            enrichment={propertyEnrichment[prop.id]}
                            propertyImageUrls={propertyImages[prop.id]}
                            alt={`${prop.title} — property photo`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4 text-left">
                          <span
                            className={cn(
                              "inline-block mb-2 px-2.5 py-0.5 rounded-full text-xs font-medium",
                              prop.status === "rented" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            )}
                          >
                            {prop.status === "rented" ? "Rented" : "Needs attention"}
                          </span>
                          <h2 className="font-semibold text-slate-900">{prop.title}</h2>
                          <p className="text-sm text-slate-500 mt-0.5">{prop.address}</p>
                          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                            {editingCardId === prop.id && editingDraft ? (
                              <span className="col-span-2">
                                <label className="block text-slate-500 mb-0.5">Cashflow (£)</label>
                                <input
                                  type="number"
                                  value={editingDraft.monthlyRent}
                                  onChange={(e) =>
                                    setEditingDraft((d) =>
                                      d ? { ...d, monthlyRent: Math.max(0, Number(e.target.value) || 0) } : d
                                    )
                                  }
                                  className="w-full rounded border border-slate-300 px-2 py-1 text-slate-900 text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </span>
                            ) : (
                              <span>Cashflow: {formatPropertyCurrency(prop.monthlyRent, prop.purchasePriceCurrency)}</span>
                            )}
                            <span>Purchased: {formatPropertyDate(prop.purchaseDate)}</span>
                            {(() => {
                              const e = propertyEnrichment[prop.id];
                              if (!e) return null;
                              return (
                                <>
                                  {e.epcRating && <span className="col-span-2">EPC: <span className="font-semibold">{e.epcRating}</span></span>}
                                  {e.propertyType && <span>Type: {e.propertyType}</span>}
                                  {e.lastSoldPrice != null && <span>Last sold: {formatPropertyCurrency(e.lastSoldPrice, prop.purchasePriceCurrency)}{e.lastSoldDate ? ` (${e.lastSoldDate})` : ""}</span>}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </button>
                      {/* Card footer: Price, Yield, Upload — or inline edit inputs + Save/Cancel */}
                      <div className="p-4 pt-0 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 mt-2">
                        {editingCardId === prop.id && editingDraft ? (
                          <>
                            <div className="flex flex-wrap items-center gap-3 text-sm w-full">
                              <span className="w-full">
                                <label className="block text-xs text-slate-500 mb-0.5">Featured Image URL</label>
                                <input
                                  type="url"
                                  value={editingDraft.image ?? ""}
                                  onChange={(e) =>
                                    setEditingDraft((d) =>
                                      d ? { ...d, image: e.target.value.trim() || null } : d
                                    )
                                  }
                                  placeholder="Paste Zoopla/Rightmove photo URL"
                                  className="w-full rounded border border-slate-300 px-2 py-1 text-slate-900 text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </span>
                              <span>
                                <label className="block text-xs text-slate-500 mb-0.5">Price (£)</label>
                                <input
                                  type="number"
                                  value={editingDraft.purchasePrice}
                                  onChange={(e) =>
                                    setEditingDraft((d) =>
                                      d ? { ...d, purchasePrice: Math.max(0, Number(e.target.value) || 0) } : d
                                    )
                                  }
                                  className="w-24 rounded border border-slate-300 px-2 py-1 text-slate-900 text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </span>
                              <span>
                                <label className="block text-xs text-slate-500 mb-0.5">Rent (£/mo)</label>
                                <input
                                  type="number"
                                  value={editingDraft.monthlyRent}
                                  onChange={(e) =>
                                    setEditingDraft((d) =>
                                      d ? { ...d, monthlyRent: Math.max(0, Number(e.target.value) || 0) } : d
                                    )
                                  }
                                  className="w-20 rounded border border-slate-300 px-2 py-1 text-slate-900 text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </span>
                              <span className="self-end pb-1">
                                <span className="text-xs text-slate-500">Gross </span>
                                <span className="font-medium text-teal-600">
                                  {editingDraft.purchasePrice > 0
                                    ? computeGrossYield(editingDraft.monthlyRent, editingDraft.purchasePrice).toFixed(1)
                                    : "—"}
                                  %
                                </span>
                                <span className="text-xs text-slate-500 ml-1">Net </span>
                                <span className="font-medium text-slate-600">
                                  {editingDraft.purchasePrice > 0
                                    ? computeNetYield(editingDraft.monthlyRent, editingDraft.purchasePrice).toFixed(1)
                                    : "—"}
                                  %
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelCard();
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveCard();
                                }}
                                disabled={isSavingCard}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {isSavingCard ? (
                                  <span className="animate-pulse">Saving...</span>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4" />
                                    Save
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-slate-600">
                                <span className="font-medium text-slate-900">{formatPropertyCurrency(prop.purchasePrice, prop.purchasePriceCurrency)}</span>
                                <span className="text-slate-500 ml-1">Price</span>
                              </span>
                              <span className="text-slate-600">
                                <span className="font-medium text-teal-600">
                                  {prop.purchasePrice > 0 ? computeGrossYield(prop.monthlyRent, prop.purchasePrice).toFixed(1) : prop.annualYieldPercent}%
                                </span>
                                <span className="text-slate-500 ml-1">Gross</span>
                              </span>
                              <span className="text-slate-600">
                                <span className="font-medium text-slate-600">
                                  {prop.purchasePrice > 0 ? computeNetYield(prop.monthlyRent, prop.purchasePrice).toFixed(1) : "—"}%
                                </span>
                                <span className="text-slate-500 ml-1">Net</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPropertyForDocs({ id: prop.id, name: prop.title });
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors border border-teal-200"
                              aria-label="Upload documents"
                            >
                              <Upload className="w-4 h-4 shrink-0" aria-hidden />
                              Upload Documents
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {currentPage === "market-analysis" && (
          <div className="p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Market Insights</h1>
                <p className="text-slate-600">Compare your rent to market average — identify opportunities</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/market-analysis"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Strategic Market Analysis — UK Postcodes
                </Link>
                <Link
                  href="/market-radar"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Market Radar — Early Signals
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolioProperties
                .filter((p) => benchmarkResults[p.id])
                .map((prop) => (
                  <MarketBenchCard
                    key={prop.id}
                    title={prop.title}
                    benchmark={benchmarkResults[prop.id]}
                  />
                ))}
            </div>
            {benchmarkReady && Object.keys(benchmarkResults).length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
                No properties mapped to supported UK postcodes (e.g. L18 Liverpool)
              </div>
            )}
          </div>
        )}

        {currentPage === "ai-analyst" && (
          <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">AI Analyst</h1>
            <p className="text-slate-600 mb-6">Smart analysis of your portfolio & documents — use the floating assistant below for questions.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Link
                href="/portfolio-analysis"
                className="bento-card p-6 block hover:border-teal-300 transition-colors group"
              >
                <h3 className="font-semibold text-slate-900 group-hover:text-teal-700">Portfolio Analysis</h3>
                <p className="text-sm text-slate-600 mt-1">Total value, NOI, return on equity, risk score — insights in 60 seconds</p>
              </Link>
              <div className="bento-card p-6 opacity-75">
                <h3 className="font-semibold text-slate-900">AI Document Assistant</h3>
                <p className="text-sm text-slate-600 mt-1">Available via the floating assistant</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {propertyForDocs && (
        <PropertyFileManager
          propertyId={propertyForDocs.id}
          propertyName={propertyForDocs.name}
          onClose={() => setPropertyForDocs(null)}
          onExtractedData={(data) => {
            if (!data.monthlyRent && !data.purchasePrice) return;
            setPortfolioProperties((prev) =>
              prev.map((p) => {
                if (p.id !== propertyForDocs.id) return p;
                const updates: Partial<PortfolioProperty> = {};
                if (data.monthlyRent && data.monthlyRent > 0) updates.monthlyRent = data.monthlyRent;
                if (data.purchasePrice && data.purchasePrice > 0) updates.purchasePrice = data.purchasePrice;
                if (Object.keys(updates).length === 0) return p;
                const merged = { ...p, ...updates };
                const grossYield = computeGrossYield(merged.monthlyRent, merged.purchasePrice);
                return { ...merged, annualYieldPercent: grossYield };
              })
            );
          }}
        />
      )}

      {editingProperty && (
        <PropertyEditModal
          property={editingProperty}
          onSave={(updated) => {
            setPortfolioProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            setEditingProperty(null);
          }}
          onClose={() => setEditingProperty(null)}
        />
      )}

      <FloatingAIAssistant
        currentPage={currentPage}
        privateContextHint={currentPage === "portfolio" || currentPage === "dashboard" ? "private" : undefined}
      />
    </div>
  );
}

/** Root page: must be default export and return a single React element (Suspense wraps useSearchParams). */
function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="ltr">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AppContent />
    </Suspense>
  );
}

export default Page;
