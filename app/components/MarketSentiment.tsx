"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Users,
  Briefcase,
  Activity,
  Brain,
  Newspaper,
  Target,
  CircleDollarSign,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  ExternalLink,
  Filter,
  Gauge,
  BarChart3,
  Map,
  PieChartIcon,
  Loader2,
  RefreshCw,
  Radio,
} from "lucide-react";
import { cn, formatCurrency } from "../lib/utils";
import {
  INSTITUTIONAL_ACTIVITY,
  UK_CITIES_DATA,
  COUNCIL_EMPLOYMENT,
  MACRO_TIME_SERIES,
  NEWS_HEADLINES,
} from "../lib/marketData";

// =============================================================================
// Types for Live Data
// =============================================================================

interface LiveAnalystReport {
  id: string;
  analyst: string;
  firm: string;
  title: string;
  summary: string;
  rating: "bullish" | "bearish" | "neutral";
  targetRegion?: string;
  priceTarget?: string;
  sourceUrl: string;
  publishedAt: string;
  isVerified: boolean;
}

interface LiveMacroData {
  bankRate: { current: number; previous: number; change: number; lastUpdated: string; source: string; sourceUrl: string; isLive: boolean };
  inflation: { cpi: number; cpih: number; rpi: number; lastUpdated: string; source: string; sourceUrl: string; isLive: boolean };
  housePrice: { averagePrice: number; annualChange: number; monthlyChange: number; lastUpdated: string; source: string; sourceUrl: string; isLive: boolean };
  gdp: { quarterly: number; annual: number; lastUpdated: string; source: string; sourceUrl: string; isLive: boolean };
  employment: { rate: number; unemploymentRate: number; lastUpdated: string; source: string; sourceUrl: string; isLive: boolean };
  regionalData: { [region: string]: { averagePrice: number; annualChange: number; yield: number } };
}

// Action colors
const ACTION_COLORS = {
  upgrade: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Upgrade" },
  downgrade: { bg: "bg-red-500/20", text: "text-red-400", label: "Downgrade" },
  reiterated: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Reiterated" },
  initiated: { bg: "bg-purple-500/20", text: "text-purple-400", label: "Initiated" },
};

// Transaction colors
const TRANSACTION_COLORS = {
  acquisition: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "רכישה" },
  disposal: { bg: "bg-red-500/20", text: "text-red-400", label: "מכירה" },
  development: { bg: "bg-blue-500/20", text: "text-blue-400", label: "פיתוח" },
};

// Fund type labels
const FUND_TYPES = {
  reit: "REIT",
  pension: "פנסיה",
  private_equity: "PE",
  sovereign: "קרן ריבונית",
  insurance: "ביטוח",
};

// Get color based on price change
function getPriceChangeColor(change: number): string {
  if (change >= 6) return "bg-emerald-500";
  if (change >= 4) return "bg-emerald-400";
  if (change >= 2) return "bg-emerald-300";
  if (change >= 0) return "bg-slate-400";
  if (change >= -2) return "bg-red-300";
  if (change >= -4) return "bg-red-400";
  return "bg-red-500";
}

function getPriceChangeTextColor(change: number): string {
  if (change >= 2) return "text-white";
  if (change >= 0) return "text-slate-900";
  return "text-white";
}

interface MarketSentimentProps {
  selectedCity?: string;
  onCitySelect?: (city: string) => void;
}

export default function MarketSentiment({ selectedCity, onCitySelect }: MarketSentimentProps) {
  const [activeTab, setActiveTab] = useState<"ratings" | "institutional" | "heatmap" | "macro">("ratings");
  const [sortBy, setSortBy] = useState<"date" | "change">("date");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [selectedCouncil, setSelectedCouncil] = useState("Knowsley");
  const [macroChartType, setMacroChartType] = useState<"rates" | "employment">("rates");

  // Live data state
  const [macroData, setMacroData] = useState<LiveMacroData | null>(null);
  const [analysts, setAnalysts] = useState<LiveAnalystReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Fetch live data
  const fetchLiveData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch macro data
      const macroResponse = await fetch("/api/macro-data");
      if (macroResponse.ok) {
        const data = await macroResponse.json();
        setMacroData(data);
        console.log("[MarketSentiment] Macro data received:", {
          bankRate: data.bankRate?.current,
          inflation: data.inflation?.cpi,
          housePrice: data.housePrice?.averagePrice,
        });
      }

      // Fetch news/analysts
      const newsResponse = await fetch("/api/news?analysts=true");
      if (newsResponse.ok) {
        const data = await newsResponse.json();
        setAnalysts(data.analysts || []);
        console.log("[MarketSentiment] Analysts received:", data.analysts?.length);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error("[MarketSentiment] Failed to fetch live data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchLiveData();
  }, [fetchLiveData]);

  // Calculate sentiment from live data - ALWAYS returns complete object
  const sentiment = useMemo(() => {
    // Default fallback object with all required properties
    const defaultSentiment = {
      score: 50,
      label: "טוען...",
      color: "text-slate-400",
      trend: "neutral" as "bullish" | "bearish" | "neutral",
      breakdown: { positive: 0, negative: 0, neutral: 0 },
      summary: "מחשב סנטימנט שוק...",
    };

    // Safety check - always return default if macroData is missing
    if (!macroData || !macroData.bankRate || !macroData.housePrice || !macroData.gdp || !macroData.inflation) {
      return defaultSentiment;
    }
    
    let score = 50;
    let positiveFactors = 0;
    let negativeFactors = 0;
    let neutralFactors = 0;
    
    // Bank rate impact (lower is better for property)
    if (macroData.bankRate.current <= 4) { score += 10; positiveFactors++; }
    else { neutralFactors++; }
    
    if (macroData.bankRate.change < 0) { score += 10; positiveFactors++; }
    else if (macroData.bankRate.change > 0) { score -= 5; negativeFactors++; }
    else { neutralFactors++; }
    
    // House price changes
    if (macroData.housePrice.annualChange > 3) { score += 15; positiveFactors++; }
    else if (macroData.housePrice.annualChange > 0) { score += 8; positiveFactors++; }
    else { score -= 10; negativeFactors++; }
    
    // GDP growth
    if (macroData.gdp.quarterly > 0.5) { score += 10; positiveFactors++; }
    else if (macroData.gdp.quarterly > 0) { score += 5; positiveFactors++; }
    else { negativeFactors++; }
    
    // Inflation (moderate is good)
    if (macroData.inflation.cpi < 3) { score += 5; positiveFactors++; }
    else if (macroData.inflation.cpi > 5) { score -= 10; negativeFactors++; }
    else { neutralFactors++; }
    
    score = Math.max(0, Math.min(100, score));
    
    let label = "ניטרלי";
    let color = "text-amber-400";
    let trend: "bullish" | "bearish" | "neutral" = "neutral";
    
    if (score >= 70) { label = "חיובי מאוד"; color = "text-[#00C805]"; trend = "bullish"; }
    else if (score >= 55) { label = "חיובי"; color = "text-[#00C805]"; trend = "bullish"; }
    else if (score >= 45) { label = "ניטרלי"; color = "text-amber-400"; trend = "neutral"; }
    else if (score >= 30) { label = "שלילי"; color = "text-red-400"; trend = "bearish"; }
    else { label = "שלילי מאוד"; color = "text-red-400"; trend = "bearish"; }
    
    // Generate summary - OPTIONAL CHAINING
    const summaryParts = [];
    if ((macroData?.bankRate?.current ?? 3.75) <= 4) summaryParts.push("ריבית נמוכה תומכת בשוק");
    if ((macroData?.housePrice?.annualChange ?? 0) > 0) summaryParts.push("מחירי דירות בעלייה");
    if ((macroData?.gdp?.quarterly ?? 0) > 0) summaryParts.push("צמיחה כלכלית חיובית");
    if ((macroData?.inflation?.cpi ?? 2.5) < 3) summaryParts.push("אינפלציה בשליטה");
    
    const summary = summaryParts.length > 0 
      ? summaryParts.join(" • ")
      : "השוק נמצא במצב יציב";
    
    return {
      score,
      label,
      color,
      trend,
      breakdown: {
        positive: positiveFactors,
        negative: negativeFactors,
        neutral: neutralFactors,
      },
      summary,
    };
  }, [macroData]);

  // Filter analysts by rating
  const filteredRatings = useMemo(() => {
    let ratings = [...analysts];
    
    if (filterAction !== "all") {
      ratings = ratings.filter((r) => r.rating === filterAction);
    }
    
    if (sortBy === "change") {
      ratings.sort((a, b) => {
        const getScore = (r: LiveAnalystReport) => r.rating === "bullish" ? 2 : r.rating === "bearish" ? 0 : 1;
        return getScore(b) - getScore(a);
      });
    } else {
      ratings.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }
    
    return ratings;
  }, [filterAction, sortBy, analysts]);

  // Regional data for heatmap
  const regionalData = useMemo(() => {
    if (!macroData?.regionalData) return [];
    return Object.entries(macroData?.regionalData ?? {}).map(([region, data]: [string, any]) => ({
      city: region,
      priceChange: data.annualChange,
      avgPrice: data.averagePrice,
      yield: data.yield,
    }));
  }, [macroData]);

  // Council employment data
  const councilData = useMemo(() => {
    return COUNCIL_EMPLOYMENT[selectedCouncil] || null;
  }, [selectedCouncil]);

  return (
    <div className="space-y-6">
      {/* Sentiment Score Header */}
      <div className="card p-4 bg-gradient-to-br from-[#151921] to-[#0B0E14] border border-[#2D333F]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#00C805] to-[#00A004] rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                AI Market Sentiment
                {macroData && (
                  <span className="live-indicator">
                    LIVE
                  </span>
                )}
              </h2>
              <p className="text-sm text-slate-400 flex items-center gap-2">
                נתונים מ-Bank of England, ONS, Land Registry
                {lastRefresh && (
                  <span className="text-xs text-slate-500">
                    • {lastRefresh.toLocaleTimeString("he-IL")}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchLiveData}
            disabled={isLoading}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-slate-400 hover:text-white disabled:opacity-50 ml-4"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>
          
          {/* Sentiment Gauge */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#334155"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={(sentiment?.score ?? 50) >= 65 ? "#10b981" : (sentiment?.score ?? 50) >= 35 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${((sentiment?.score ?? 50) / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{sentiment?.score ?? 50}</span>
                  <span className="text-xs text-slate-400">/100</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                sentiment?.trend === "bullish" ? "bg-[#00C805]/20" :
                sentiment?.trend === "bearish" ? "bg-red-500/20" : "bg-amber-500/20"
              )}>
                {sentiment?.trend === "bullish" ? (
                  <TrendingUp className="w-4 h-4 text-[#00C805]" />
                ) : sentiment?.trend === "bearish" ? (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                ) : (
                  <Activity className="w-4 h-4 text-amber-400" />
                )}
                <span className={cn(
                  "font-medium",
                  sentiment?.trend === "bullish" ? "text-[#00C805]" :
                  sentiment?.trend === "bearish" ? "text-red-400" : "text-amber-400"
                )}>
                  {sentiment?.trend === "bullish" ? "שורי" : sentiment?.trend === "bearish" ? "דובי" : "ניטרלי"}
                </span>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-[#00C805]">👍 {sentiment?.breakdown?.positive ?? 0}</span>
                <span className="text-red-400">👎 {sentiment?.breakdown?.negative ?? 0}</span>
                <span className="text-slate-400">➖ {sentiment?.breakdown?.neutral ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-slate-300 bg-[#1D2430] rounded-lg p-3 border border-[#2D333F]">
          <Sparkles className="w-4 h-4 inline ml-2 text-[#00C805]" />
          {sentiment?.summary ?? "מחשב סנטימנט שוק..."}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-[#1D2430] border border-[#2D333F] rounded-lg p-1">
        {[
          { id: "ratings", label: "דירוגי אנליסטים", icon: Target },
          { id: "institutional", label: "פעילות מוסדית", icon: Building2 },
          { id: "heatmap", label: "מפת חום", icon: Map },
          { id: "macro", label: "מאקרו", icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-[#00C805] text-white"
                : "text-slate-400 hover:text-white hover:bg-[#2D333F]"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "ratings" && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              City Ratings - דירוגי ערים
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
              >
                <option value="all">כל הפעולות</option>
                <option value="upgrade">Upgrades</option>
                <option value="downgrade">Downgrades</option>
                <option value="reiterated">Reiterated</option>
                <option value="initiated">Initiated</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
              >
                <option value="date">תאריך</option>
                <option value="change">שינוי %</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-2" />
              <p className="text-slate-500">טוען נתוני אנליסטים...</p>
            </div>
          ) : filteredRatings.length === 0 ? (
            <div className="py-12 text-center">
              <Brain className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400">אין דוחות אנליסטים זמינים</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-right py-3 px-2 text-xs font-medium text-slate-400">חברה</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-slate-400">אנליסט</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-slate-400">המלצה</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-slate-400">אזור</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-slate-400">יעד</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-slate-400">מקור</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRatings.map((rating) => (
                    <tr key={rating.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-2">
                        <span className="font-medium text-white">{rating.firm}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-slate-400">{rating.analyst}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          rating.rating === "bullish" && "bg-emerald-500/20 text-emerald-400",
                          rating.rating === "bearish" && "bg-red-500/20 text-red-400",
                          rating.rating === "neutral" && "bg-amber-500/20 text-amber-400"
                        )}>
                          {rating.rating === "bullish" ? "BUY" : rating.rating === "bearish" ? "SELL" : "HOLD"}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-white">{rating.targetRegion || "UK"}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-cyan-400 font-medium">{rating.priceTarget || "-"}</span>
                      </td>
                      <td className="py-3 px-2">
                        {rating.sourceUrl ? (
                          <a
                            href={rating.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                            מקור
                          </a>
                        ) : (
                          <span className="text-slate-500 text-xs">לא זמין</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "institutional" && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              Institutional Activity - פעילות מוסדית
            </h3>
            <span className="text-xs text-slate-400">
              סה״כ: £{INSTITUTIONAL_ACTIVITY.reduce((a, b) => a + b.value, 0)}M
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-right py-3 px-2 text-xs font-medium text-slate-400">קרן</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-slate-400">סוג</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-slate-400">עסקה</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-slate-400">עיר</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-slate-400">ערך</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-slate-400">יחידות</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-slate-400">סקטור</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-slate-400">תאריך</th>
                </tr>
              </thead>
              <tbody>
                {INSTITUTIONAL_ACTIVITY.map((activity) => (
                  <tr key={activity.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 px-2">
                      <span className="font-medium text-white">{activity.fund}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                        {FUND_TYPES[activity.fundType]}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        TRANSACTION_COLORS[activity.transaction].bg,
                        TRANSACTION_COLORS[activity.transaction].text
                      )}>
                        {TRANSACTION_COLORS[activity.transaction].label}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => onCitySelect?.(activity.city)}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        {activity.city}
                      </button>
                    </td>
                    <td className="py-3 px-2 text-white font-medium">
                      £{activity.value}M
                    </td>
                    <td className="py-3 px-2 text-slate-300">
                      {activity.units.toLocaleString()}
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase">
                        {activity.sector}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-slate-400">{activity.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">
                £{INSTITUTIONAL_ACTIVITY.filter(a => a.transaction === "acquisition").reduce((s, a) => s + a.value, 0)}M
              </p>
              <p className="text-xs text-slate-400">רכישות</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                £{INSTITUTIONAL_ACTIVITY.filter(a => a.transaction === "development").reduce((s, a) => s + a.value, 0)}M
              </p>
              <p className="text-xs text-slate-400">פיתוח</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">
                £{INSTITUTIONAL_ACTIVITY.filter(a => a.transaction === "disposal").reduce((s, a) => s + a.value, 0)}M
              </p>
              <p className="text-xs text-slate-400">מכירות</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "heatmap" && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Map className="w-5 h-5 text-emerald-400" />
              UK Regional Heatmap - מפת חום אזורית
              {macroData && (
                <span className="live-indicator text-xs">
                  LIVE
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded"></span>-4%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-400 rounded"></span>0%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded"></span>+6%</span>
            </div>
          </div>

          {/* Live Regional Grid */}
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-2" />
              <p className="text-slate-500">טוען נתוני אזורים...</p>
            </div>
          ) : regionalData.length === 0 ? (
            <div className="py-12 text-center">
              <Map className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400">אין נתוני אזורים זמינים</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {regionalData.map((region) => {
                const bgColor = getPriceChangeColor(region.priceChange);
                const textColor = getPriceChangeTextColor(region.priceChange);
                
                return (
                  <button
                    key={region.city}
                    onClick={() => onCitySelect?.(region.city)}
                    className={cn(
                      "p-3 rounded-lg transition-all hover:scale-105 hover:z-10",
                      bgColor,
                      textColor,
                      selectedCity === region.city ? "ring-2 ring-white" : ""
                    )}
                  >
                    <p className="text-xs font-bold truncate">{region.city}</p>
                    <p className="text-2xl font-bold">
                      {region.priceChange >= 0 ? "+" : ""}{region.priceChange.toFixed(1)}%
                    </p>
                    <div className="flex justify-between text-xs opacity-75 mt-1">
                      <span>£{(region.avgPrice / 1000).toFixed(0)}k</span>
                      <span>תשואה: {region.yield.toFixed(1)}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected City Details */}
          {selectedCity && (() => {
            const city = UK_CITIES_DATA.find((c) => c.name === selectedCity);
            if (!city) return null;

            return (
              <div className="mt-4 p-4 bg-slate-800/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white">{city.name} ({city.nameHe})</h4>
                  <span className="text-sm text-slate-400">{city.region}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">מחיר ממוצע</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(city.avgPrice, "GBP")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">שינוי שנתי</p>
                    <p className={cn("text-lg font-bold", city.priceChange1Y >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {city.priceChange1Y >= 0 ? "+" : ""}{city.priceChange1Y}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">תשואה ממוצעת</p>
                    <p className="text-lg font-bold text-blue-400">{city.avgYield}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">תעסוקה</p>
                    <p className="text-lg font-bold text-amber-400">{city.employmentRate}%</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">ביקוש</p>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${city.demandScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">היצע</p>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${city.supplyScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === "macro" && (
        <div className="space-y-4">
          {/* Chart Type Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setMacroChartType("rates")}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                macroChartType === "rates"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              ריבית vs. ביקוש לדיור
            </button>
            <button
              onClick={() => setMacroChartType("employment")}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                macroChartType === "employment"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              תעסוקה לפי רשות
            </button>
          </div>

          {macroChartType === "rates" && (
            <div className="card p-4">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Interest Rate vs. Housing Demand
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={MACRO_TIME_SERIES}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis 
                      yAxisId="left" 
                      stroke="#64748b" 
                      fontSize={12}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      stroke="#64748b" 
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="interestRate"
                      name="ריבית (%)"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: "#ef4444", r: 4 }}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="housingDemandIndex"
                      name="אינדקס ביקוש"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.2}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="mortgageApprovals"
                      name="אישורי משכנתאות"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              {/* Insight */}
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-300">
                  <Info className="w-4 h-4 inline ml-2 text-blue-400" />
                  מגמת ירידה בריבית צפויה לתמוך בעלייה בביקוש לדיור ב-Q2 2024
                </p>
              </div>
            </div>
          )}

          {macroChartType === "employment" && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  Employment by Council Area
                </h3>
                <select
                  value={selectedCouncil}
                  onChange={(e) => setSelectedCouncil(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                >
                  {Object.keys(COUNCIL_EMPLOYMENT).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {councilData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Employment Stats */}
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400">שיעור תעסוקה</span>
                        <span className={cn(
                          "flex items-center gap-1 text-sm font-medium",
                          councilData.change12m >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {councilData.change12m >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {councilData.change12m >= 0 ? "+" : ""}{councilData.change12m}%
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-white">{councilData.employmentRate}%</p>
                    </div>
                    
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-sm text-slate-400 mb-3">פילוח סקטורים</p>
                      <div className="space-y-2">
                        {councilData.sectors.map((sector) => (
                          <div key={sector.name}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-300">{sector.name}</span>
                              <span className="text-white font-medium">{sector.percent}%</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                style={{ width: `${sector.percent}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pie Chart */}
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <p className="text-sm text-slate-400 mb-3">התפלגות סקטורים</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={councilData.sectors}
                            dataKey="percent"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                          >
                            {councilData.sectors.map((_, idx) => (
                              <Cell 
                                key={idx} 
                                fill={["#10b981", "#3b82f6", "#f59e0b", "#a855f7", "#6b7280"][idx % 5]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1e293b",
                              border: "1px solid #334155",
                              borderRadius: "8px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent Headlines */}
      <div className="card p-4">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-emerald-400" />
          Recent Headlines - כותרות אחרונות
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {NEWS_HEADLINES.slice(0, 6).map((headline) => (
            <div
              key={headline.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800/50"
            >
              <div className={cn(
                "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                headline.sentiment === "positive" ? "bg-emerald-500" :
                headline.sentiment === "negative" ? "bg-red-500" : "bg-slate-500"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{headline.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500">{headline.source}</span>
                  <span className="text-xs text-slate-600">•</span>
                  <span className="text-xs text-slate-500">{headline.date}</span>
                </div>
              </div>
              <span className="text-xs text-slate-500 flex-shrink-0">
                {headline.relevance}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
