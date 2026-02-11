"use client";

import { useState, useCallback, useMemo, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Wallet, Percent, Banknote, Gauge, ChevronDown, Calendar, FolderOpen, ArrowRight, Pencil } from "lucide-react";
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
import PropertyDocumentUploadZone from "./components/PropertyDocumentUploadZone";
import PropertyEditModal, { type PortfolioProperty } from "./components/PropertyEditModal";
import FloatingAIAssistant from "./components/FloatingAIAssistant";
import MarketBenchCard from "./components/MarketBenchCard";
import {
  mapPropertyToArea,
  runBenchmark,
  type BenchmarkResult,
} from "./lib/market-benchmark";

// Sample portfolio properties (Property A Israel, Property B UK)
const INITIAL_PORTFOLIO: PortfolioProperty[] = [
  {
    id: "prop-il-1",
    title: "דיזנגוף 120, תל אביב",
    address: "דיזנגוף 120, תל אביב",
    image: null,
    monthlyRent: 8500,
    annualYieldPercent: 3.2,
    purchasePrice: 3_200_000,
    purchasePriceCurrency: "ILS",
    purchaseDate: "2021-01-01",
    status: "rented",
    country: "IL",
  },
  {
    id: "prop-uk-1",
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
];

// Deterministic formatting (no locale) to avoid hydration mismatch between server and client
function formatPropertyCurrency(value: number, currency: "ILS" | "GBP" | "EUR"): string {
  const n = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (currency === "ILS") return `₪${n}`;
  if (currency === "GBP") return `£${n}`;
  return `€${n}`;
}

function formatPropertyDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Image URL for card: use prop.image or a map/street-style placeholder by address. */
function getPropertyCardImageUrl(prop: PortfolioProperty): string {
  if (prop.image) return prop.image;
  const seed = encodeURIComponent(prop.address || prop.id);
  return `https://picsum.photos/seed/${seed}/400/300`;
}

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
const MONTHS = ["ינו", "פבר", "מרץ", "אפר", "מאי", "יונ", "יול", "אוג", "ספט", "אוק", "נוב", "דצמ"];

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
  { value: "portfolio-value", label: "שווי פורטפוליו" },
  { value: "cashflow", label: "תזרים מזומנים" },
  { value: "yield", label: "תשואה שנתית" },
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

  // Market Analysis: benchmark results (Comparison Engine)
  const [benchmarkResults, setBenchmarkResults] = useState<Record<string, BenchmarkResult>>({});
  const [benchmarkReady, setBenchmarkReady] = useState(false);

  // Open portfolio view when visiting /?view=portfolio (e.g. redirect from /portfolio)
  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "portfolio") setCurrentPage("portfolio");
    if (view === "market-analysis") setCurrentPage("market-analysis");
  }, [searchParams]);

  // Run market benchmarks for properties with mapped areas
  useEffect(() => {
    setBenchmarkReady(false);
    let cancelled = false;
    const run = async () => {
      const results: Record<string, BenchmarkResult> = {};
      for (const prop of portfolioProperties) {
        const areaKey = mapPropertyToArea(prop.id, prop.country, prop.address, prop.title);
        if (!areaKey) continue;
        const b = await runBenchmark(areaKey, prop.monthlyRent, prop.purchasePriceCurrency);
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
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />

      <main
        className="min-h-screen flex-1 min-w-0 bg-slate-50"
        style={{ marginRight: SIDEBAR_WIDTH }}
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
                  <p className="text-sm font-medium text-slate-500 mb-1">שווי תיק</p>
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
                  <p className="text-sm font-medium text-slate-500 mb-1">תשואה ממוצעת</p>
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
                  <p className="text-sm font-medium text-slate-500 mb-1">מזומן נטו חודשי</p>
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
                      aria-label="בחר תאריכים"
                    >
                      <Calendar className="w-4 h-4" aria-hidden />
                      <span>בחר תאריכים</span>
                    </button>
                    {isDatePickerOpen && (
                      <div
                        ref={datePickerRef}
                        role="dialog"
                        aria-label="בחירת טווח תאריכים"
                        className="absolute top-full mt-2 left-0 z-50 min-w-[280px] rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
                        dir="rtl"
                      >
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="chart-start-date" className="block text-sm font-medium text-slate-700 mb-1">
                              תאריך התחלה
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
                              תאריך סיום
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
                            החל
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
                    aria-label="בחירת מדד גרף"
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
                      orientation="right"
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
                      formatter={(value: number) => [formatY(value), ""]}
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
                שלום, מאז הביקור האחרון שלך השתנו 3 דברים בתיק
              </p>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                דורש תשומת לב ותובנות
              </h3>
              <p className="text-xs text-slate-400 mb-6">היום בלבד — לא מושפע מפילטרי תאריך</p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Card 1 — Critical: yield drop */}
                <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
                  <div>
                    <span className="text-xs font-medium text-red-600">קריטי</span>
                    <h4 className="text-base font-semibold text-slate-900 mt-0.5">ירידה בתשואה</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      נכס מסוים ירד מתחת ל benchmark האזורי. כדאי לבדוק.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="self-start text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    בדוק עכשיו
                  </button>
                </div>
                {/* Card 2 — Insight: upgrade opportunity */}
                <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
                  <div>
                    <span className="text-xs font-medium text-amber-600">תובנה</span>
                    <h4 className="text-base font-semibold text-slate-900 mt-0.5">הזדמנות שדרוג</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      שיפוץ קל בנכס B עשוי להעלות את השכירות ב-12%.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="self-start text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    בדוק עכשיו
                  </button>
                </div>
                {/* Card 3 — Task: missing data */}
                <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
                  <div>
                    <span className="text-xs font-medium text-slate-500">משימה</span>
                    <h4 className="text-base font-semibold text-slate-900 mt-0.5">נתונים חסרים</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      חסר מסמך EPC לנכס C.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="self-start text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    בדוק עכשיו
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
                  חזרה לתיק הנכסים
                </button>
                {(() => {
                  const prop = portfolioProperties.find((p) => p.id === viewPropertyId);
                  if (!prop) return null;
                  return (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                      <h1 className="text-xl font-semibold text-slate-900">{prop.title}</h1>
                      <p className="text-slate-500 mt-1">{prop.address}</p>
                      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">תזרים חודשי</span>
                          <div className="font-medium text-slate-900">
                            {formatPropertyCurrency(prop.monthlyRent, prop.purchasePriceCurrency)}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">תשואה שנתית</span>
                          <div className="font-medium text-slate-900">{prop.annualYieldPercent}%</div>
                        </div>
                        <div>
                          <span className="text-slate-500">מחיר קנייה</span>
                          <div className="font-medium text-slate-900">
                            {formatPropertyCurrency(prop.purchasePrice, prop.purchasePriceCurrency)}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">תאריך קנייה</span>
                          <div className="font-medium text-slate-900">{formatPropertyDate(prop.purchaseDate)}</div>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "inline-block mt-4 px-3 py-1 rounded-full text-xs font-medium",
                          prop.status === "rented" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        )}
                      >
                        {prop.status === "rented" ? "מושכר" : "דורש טיפול"}
                      </span>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">תיק הנכסים שלי</h1>
                <p className="text-slate-600 mb-6">נכסים ומסמכים</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {portfolioProperties.map((prop) => (
                    <div
                      key={prop.id}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative"
                    >
                      {/* Top-right: Documents (folder) + Edit (pencil) - always visible on card */}
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                        <button
                          type="button"
                          className="p-2 rounded-lg bg-slate-900/85 text-white shadow-md hover:bg-slate-800 transition-colors border border-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPropertyForDocs({ id: prop.id, name: prop.title });
                          }}
                          aria-label="מסמכים"
                        >
                          <FolderOpen className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-lg bg-slate-900/85 text-white shadow-md hover:bg-slate-800 transition-colors border border-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProperty(prop);
                          }}
                          aria-label="ערוך נכס"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="block w-full text-right focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-inset rounded-t-xl"
                        onClick={() => setViewPropertyId(prop.id)}
                        aria-label={`עבור לנכס ${prop.title}`}
                      >
                        <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden relative">
                          <img
                            src={getPropertyCardImageUrl(prop)}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const el = e.currentTarget;
                              el.onerror = null;
                              el.style.display = "none";
                              const wrap = el.parentElement;
                              if (wrap && !wrap.querySelector(".img-fallback")) {
                                const fallback = document.createElement("div");
                                fallback.className = "img-fallback absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300";
                                wrap.style.position = "relative";
                                wrap.appendChild(fallback);
                              }
                            }}
                          />
                        </div>
                        <div className="p-4 text-right">
                          <span
                            className={cn(
                              "inline-block mb-2 px-2.5 py-0.5 rounded-full text-xs font-medium",
                              prop.status === "rented" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            )}
                          >
                            {prop.status === "rented" ? "מושכר" : "דורש טיפול"}
                          </span>
                          <h2 className="font-semibold text-slate-900">{prop.title}</h2>
                          <p className="text-sm text-slate-500 mt-0.5">{prop.address}</p>
                          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                            <span>תזרים: {formatPropertyCurrency(prop.monthlyRent, prop.purchasePriceCurrency)}</span>
                            <span>תשואה: {prop.annualYieldPercent}%</span>
                            <span className="col-span-2">מחיר קנייה: {formatPropertyCurrency(prop.purchasePrice, prop.purchasePriceCurrency)}</span>
                            <span className="col-span-2">תאריך קנייה: {formatPropertyDate(prop.purchaseDate)}</span>
                          </div>
                        </div>
                      </button>
                      <div className="p-4 pt-0 flex justify-start">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPropertyForDocs({ id: prop.id, name: prop.title });
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-colors"
                          aria-label="מסמכים"
                        >
                          <FolderOpen className="w-4 h-4 text-slate-400" aria-hidden />
                          מסמכים
                        </button>
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
                <h1 className="text-2xl font-bold text-slate-900 mb-2">ניתוח שוק</h1>
                <p className="text-slate-600">השוואת השכירות שלך לממוצע שוק — זיהוי הזדמנויות</p>
              </div>
              <Link
                href="/market-analysis"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors"
              >
                ניתוח שוק אסטרטגי — ישראל / אנגליה
              </Link>
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
                אין נכסים מתוחזרים לאזורים נתמכים (L18 Liverpool, מרכז תל אביב)
              </div>
            )}
          </div>
        )}

        {currentPage === "ai-analyst" && (
          <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">אנליסט AI</h1>
            <p className="text-slate-600 mb-6">ניתוח חכם של התיק והמסמכים — השתמש בעוזר הצף (למטה) לשאלות.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Link
                href="/portfolio-analysis"
                className="bento-card p-6 block hover:border-teal-300 transition-colors group"
              >
                <h3 className="font-semibold text-slate-900 group-hover:text-teal-700">ניתוח תיק השקעות</h3>
                <p className="text-sm text-slate-600 mt-1">שווי כולל, NOI, תשואה על הון, ניקוד סיכון — תובנות ב־60 שניות</p>
              </Link>
              <div className="bento-card p-6 opacity-75">
                <h3 className="font-semibold text-slate-900">עוזר AI למסמכים</h3>
                <p className="text-sm text-slate-600 mt-1">באפשרות להפעיל באמצעות העוזר הצף</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {propertyForDocs && (
        <PropertyDocumentUploadZone
          propertyName={propertyForDocs.name}
          onClose={() => setPropertyForDocs(null)}
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="rtl">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AppContent />
    </Suspense>
  );
}

export default Page;
