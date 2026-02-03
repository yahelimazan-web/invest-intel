"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Bar,
} from "recharts";
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Percent,
  Building2,
  Landmark,
  Globe,
  ExternalLink,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Filter,
  ArrowUpRight,
  DollarSign,
  Home,
  Brain,
  Activity,
  Loader2,
  Radio,
  RefreshCw,
  BookOpen,
  Link as LinkIcon,
} from "lucide-react";
import {
  UK_MACRO_DATA,
  CYPRUS_MACRO_DATA,
} from "../../lib/data";
import { cn, formatCurrency } from "../../lib/utils";
import MarketSentiment from "../MarketSentiment";
import { translateToHebrew } from "../../lib/translation";
import { useAuth } from "../../lib/auth";
import { getResourcesForCountries, getUniqueResources, type Country as ResourceCountry } from "../../lib/resources";
import type { Country } from "../../lib/portfolio-db";

// =============================================================================
// Live Data Types
// =============================================================================

interface LiveMacroData {
  bankRate: { current: number; previous: number; change: number; lastUpdated: string; source: string; isLive: boolean };
  inflation: { cpi: number; cpih: number; rpi: number; lastUpdated: string; source: string; isLive: boolean };
  housePrice: { averagePrice: number; annualChange: number; monthlyChange: number; lastUpdated: string; source: string; isLive: boolean };
  gdp: { quarterly: number; annual: number; lastUpdated: string; source: string; isLive: boolean };
  employment: { rate: number; unemploymentRate: number; lastUpdated: string; source: string; isLive: boolean };
  regionalData: { [region: string]: { averagePrice: number; annualChange: number; yield: number } };
}

interface LiveNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
  sentiment: string;
  country?: string;
  isLive: boolean;
}

const CATEGORY_CONFIG = {
  planning: { label: "תכנון", color: "bg-purple-500/20 text-purple-400" },
  market: { label: "שוק", color: "bg-emerald-500/20 text-emerald-400" },
  policy: { label: "מדיניות", color: "bg-blue-500/20 text-blue-400" },
  development: { label: "פיתוח", color: "bg-amber-500/20 text-amber-400" },
  rates: { label: "ריביות", color: "bg-cyan-500/20 text-cyan-400" },
  housing: { label: "דיור", color: "bg-pink-500/20 text-pink-400" },
  economy: { label: "כלכלה", color: "bg-orange-500/20 text-orange-400" },
};

// Translation is now handled by the translation.ts module

export default function NewsPage() {
  const [mainTab, setMainTab] = useState<"news" | "sentiment" | "resources">("sentiment");
  const [selectedCountry, setSelectedCountry] = useState<string>("all"); // For news filter (uk/cyprus/all)
  const [selectedResourceCountry, setSelectedResourceCountry] = useState<string>("all"); // For resources filter
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [chartType, setChartType] = useState<"prices" | "inflation" | "rates">("prices");
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);
  
  // Live data state
  const [liveMacro, setLiveMacro] = useState<LiveMacroData | null>(null);
  const [liveNews, setLiveNews] = useState<LiveNewsItem[]>([]);
  const [analysts, setAnalysts] = useState<any[]>([]);
  const [isLoadingMacro, setIsLoadingMacro] = useState(true);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showAnalysts, setShowAnalysts] = useState(true);

  // Fetch live macro data
  const fetchMacroData = useCallback(async () => {
    setIsLoadingMacro(true);
    try {
      const response = await fetch("/api/macro-data");
      if (response.ok) {
        const data = await response.json();
        setLiveMacro(data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch macro data:", error);
    } finally {
      setIsLoadingMacro(false);
    }
  }, []);

  // Get user's portfolio countries for news filtering and resources
  const { user } = useAuth();
  const [portfolioCountries, setPortfolioCountries] = useState<Country[]>([]);

  // Load portfolio countries
  useEffect(() => {
    if (!user?.id) return;
    const loadCountries = async () => {
      try {
        const { loadUserFolders } = await import("../../lib/portfolio-db");
        const { getPortfolioCountries } = await import("../../lib/currency");
        const folders = await loadUserFolders(user.id);
        const allProperties = folders.flatMap(f => f.properties);
        const countries = getPortfolioCountries(allProperties) as Country[];
        setPortfolioCountries(countries.length > 0 ? countries : ["UK"]);
      } catch (e) {
        console.error("Failed to load portfolio countries:", e);
        setPortfolioCountries(["UK"]);
      }
    };
    loadCountries();
  }, [user?.id]);

  // Fetch live news and analysts - FILTERED BY PORTFOLIO COUNTRIES
  const fetchNews = useCallback(async () => {
    setIsLoadingNews(true);
    try {
      const countriesParam = portfolioCountries.length > 0 ? portfolioCountries.join(",") : "UK";
      const response = await fetch(`/api/news?limit=15&analysts=true&countries=${encodeURIComponent(countriesParam)}`);
      if (response.ok) {
        const data = await response.json();
        setLiveNews(data.news || []);
        setAnalysts(data.analysts || []);
      }
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setIsLoadingNews(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchMacroData();
    fetchNews();
  }, [fetchMacroData, fetchNews]);

  // Refresh all data
  const refreshData = () => {
    fetchMacroData();
    fetchNews();
  };

  // Filter news - ONLY live news from API (no static/mock data)
  const filteredNews = useMemo(() => {
    return liveNews.filter((item) => {
      if (selectedCountry !== "all" && item.country !== selectedCountry) return false;
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      return true;
    });
  }, [selectedCountry, selectedCategory, liveNews]);

  // Translated news state
  const [translatedNews, setTranslatedNews] = useState<Array<{
    id: string;
    title: string;
    summary: string;
    sourceUrl?: string;
    source?: string;
    category?: string;
    country?: string;
    isLive?: boolean;
    [key: string]: any;
  }>>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  // Translate news when it changes
  useEffect(() => {
    if (filteredNews.length === 0) {
      setTranslatedNews([]);
      setIsTranslating(false);
      return;
    }

    setIsTranslating(true);
    const translateNews = async () => {
      try {
        const translated = await Promise.all(
          filteredNews.map(async (item: any) => ({
            ...item,
            title: await translateToHebrew(item.title || ""),
            summary: await translateToHebrew(item.summary || ""),
          }))
        );
        setTranslatedNews(translated);
      } catch (error) {
        console.error("Translation error:", error);
        // Fallback to original text if translation fails
        setTranslatedNews(filteredNews.map((item: any) => ({
          ...item,
          title: item.title || "טוען תרגום...",
          summary: item.summary || "טוען תרגום...",
        })));
      } finally {
        setIsTranslating(false);
      }
    };

    translateNews();
  }, [filteredNews]);

  // Macro data for selected country (use live data for UK)
  const macroData = selectedCountry === "cyprus" ? CYPRUS_MACRO_DATA : UK_MACRO_DATA;
  const latestMacro = macroData[macroData.length - 1];
  const prevMacro = macroData[macroData.length - 2];

  // Use live values when available - Default to 3.75% (BoE Base Rate)
  const BOE_BASE_RATE = 3.75;
  const currentBankRate = liveMacro?.bankRate.current ?? BOE_BASE_RATE;
  const currentInflation = liveMacro?.inflation.cpi ?? latestMacro.inflation;
  const currentHousePrice = liveMacro?.housePrice.averagePrice ?? latestMacro.housePrice;
  const currentPriceChange = liveMacro?.housePrice.annualChange ?? ((latestMacro.housePrice - prevMacro.housePrice) / prevMacro.housePrice) * 100;
  const currentGDP = liveMacro?.gdp.quarterly ?? latestMacro.gdpGrowth;

  // Calculate changes
  const priceChange = currentPriceChange;
  const inflationChange = liveMacro ? ((liveMacro?.inflation?.cpi ?? 0) - prevMacro.inflation) : (latestMacro.inflation - prevMacro.inflation);
  const rateChange = liveMacro ? (liveMacro?.bankRate?.change ?? 0) : (latestMacro.interestRate - prevMacro.interestRate);

  // Market sentiment
  const sentiment = useMemo(() => {
    if (priceChange > 1 && currentGDP > 0.3) return { label: "חיובי", color: "text-emerald-400" };
    if (priceChange < -1 || currentGDP < 0) return { label: "שלילי", color: "text-red-400" };
    return { label: "ניטרלי", color: "text-amber-400" };
  }, [priceChange, currentGDP]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            חדשות ומאקרו
            {/* Live Indicator */}
            {liveMacro && (
              <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 rounded-full">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-emerald-400">LIVE</span>
              </span>
            )}
          </h1>
          <p className="text-slate-400 flex items-center gap-2">
            עדכוני שוק ונתונים כלכליים
            {lastRefresh && (
              <span className="text-xs text-slate-500">
                • עודכן: {lastRefresh.toLocaleTimeString("he-IL")}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={refreshData}
            disabled={isLoadingMacro || isLoadingNews}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white disabled:opacity-50"
            title="רענן נתונים"
          >
            <RefreshCw className={cn("w-5 h-5", (isLoadingMacro || isLoadingNews) && "animate-spin")} />
          </button>
          
          {/* Main Tab Toggle */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setMainTab("sentiment")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                mainTab === "sentiment"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Brain className="w-4 h-4" />
              Sentiment Tracker
            </button>
            <button
              onClick={() => setMainTab("news")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                mainTab === "news"
                  ? "bg-emerald-500 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Newspaper className="w-4 h-4" />
              חדשות
            </button>
            <button
              onClick={() => setMainTab("resources")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                mainTab === "resources"
                  ? "bg-blue-500 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <BookOpen className="w-4 h-4" />
              משאבים
            </button>
          </div>
          
          {/* Country Filter - only show for news tab */}
          {mainTab === "news" && (
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
              {[
                { id: "all", label: "הכל" },
                { id: "uk", label: "🇬🇧 UK" },
                { id: "cyprus", label: "🇨🇾 Cyprus" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCountry(c.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    selectedCountry === c.id
                      ? "bg-emerald-500 text-white"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Market Sentiment Module */}
      {mainTab === "sentiment" && (
        <MarketSentiment
          selectedCity={selectedCity}
          onCitySelect={setSelectedCity}
        />
      )}

      {/* News Tab Content */}
      {mainTab === "news" && (
        <>
      {/* Macro Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* House Prices */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-emerald-400" />
            </div>
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              priceChange >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(1)}%
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(latestMacro.housePrice, selectedCountry === "cyprus" ? "EUR" : "GBP")}
          </p>
          <p className="text-sm text-slate-400">מחיר בית ממוצע</p>
        </div>

        {/* Inflation */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Percent className="w-5 h-5 text-blue-400" />
            </div>
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              inflationChange <= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {inflationChange <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              {inflationChange >= 0 ? "+" : ""}{inflationChange.toFixed(1)}%
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{latestMacro.inflation.toFixed(1)}%</p>
          <p className="text-sm text-slate-400">אינפלציה</p>
        </div>

        {/* Interest Rate */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Landmark className="w-5 h-5 text-purple-400" />
            </div>
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              rateChange <= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {rateChange <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              {rateChange >= 0 ? "+" : ""}{rateChange.toFixed(2)}%
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {liveMacro?.bankRate.current ?? latestMacro.interestRate}%
          </p>
          <p className="text-sm text-slate-400">ריבית בנק מרכזי (BoE)</p>
          <a
            href="https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate"
            target="_blank"
            rel="noopener noreferrer"
            className="source-link mt-2"
          >
            <ExternalLink className="w-3 h-3" />
            Bank of England
          </a>
        </div>

        {/* GDP Growth */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-amber-400" />
            </div>
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              latestMacro.gdpGrowth >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {latestMacro.gdpGrowth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {latestMacro.gdpGrowth >= 0 ? "+" : ""}{latestMacro.gdpGrowth.toFixed(1)}%
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{latestMacro.gdpGrowth.toFixed(1)}%</p>
          <p className="text-sm text-slate-400">צמיחת GDP</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Chart */}
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">מגמות מאקרו</h3>
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              {[
                { id: "prices", label: "מחירים" },
                { id: "inflation", label: "אינפלציה" },
                { id: "rates", label: "ריבית" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setChartType(t.id as any)}
                  className={cn(
                    "px-3 py-1 rounded text-xs font-medium transition-all",
                    chartType === t.id
                      ? "bg-slate-700 text-white"
                      : "text-slate-500 hover:text-white"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "prices" ? (
                <AreaChart data={macroData}>
                  <defs>
                    <linearGradient id="colorHouse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    formatter={(value) =>
                      formatCurrency(Number(value) || 0, selectedCountry === "cyprus" ? "EUR" : "GBP")
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="housePrice"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#colorHouse)"
                  />
                </AreaChart>
              ) : chartType === "inflation" ? (
                <ComposedChart data={macroData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => `${Number(value) ?? 0}%`}
                  />
                  <Legend />
                  <Bar dataKey="inflation" name="אינפלציה" fill="#3b82f6" fillOpacity={0.6} />
                  <Line
                    type="monotone"
                    dataKey="gdpGrowth"
                    name="צמיחת GDP"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              ) : (
                <LineChart data={macroData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => `${Number(value) ?? 0}%`}
                  />
                  <Line
                    type="monotone"
                    dataKey="interestRate"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={{ fill: "#a855f7", r: 4 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market Sentiment */}
        <div className="card p-4">
          <h3 className="font-semibold text-white mb-4">סנטימנט שוק</h3>
          
          <div className="text-center py-6">
            <div className={cn(
              "w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4",
              sentiment.label === "חיובי" ? "bg-emerald-500/20" :
              sentiment.label === "שלילי" ? "bg-red-500/20" : "bg-amber-500/20"
            )}>
              {sentiment.label === "חיובי" ? (
                <TrendingUp className="w-10 h-10 text-emerald-400" />
              ) : sentiment.label === "שלילי" ? (
                <TrendingDown className="w-10 h-10 text-red-400" />
              ) : (
                <ArrowUpRight className="w-10 h-10 text-amber-400" />
              )}
            </div>
            <p className={cn("text-2xl font-bold", sentiment.color)}>{sentiment.label}</p>
            <p className="text-sm text-slate-500 mt-1">
              {selectedCountry === "cyprus" ? "🇨🇾 Cyprus" : "🇬🇧 UK"} Market
            </p>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">מומנטום מחירים</span>
              <span className={priceChange >= 0 ? "text-emerald-400" : "text-red-400"}>
                {priceChange >= 0 ? "חיובי" : "שלילי"}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">סביבת ריבית</span>
              <span className={latestMacro.interestRate <= 4 ? "text-emerald-400" : "text-amber-400"}>
                {latestMacro.interestRate <= 4 ? "נוחה" : "גבוהה"}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">אינפלציה</span>
              <span className={latestMacro.inflation <= 3 ? "text-emerald-400" : "text-red-400"}>
                {latestMacro.inflation <= 3 ? "בשליטה" : "גבוהה"}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">צמיחה כלכלית</span>
              <span className={latestMacro.gdpGrowth >= 0.2 ? "text-emerald-400" : "text-amber-400"}>
                {latestMacro.gdpGrowth >= 0.2 ? "חיובית" : "איטית"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* News Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-[#00C805]" />
            חדשות אחרונות
            {!isLoadingNews && liveNews.length > 0 && (
              <span className="live-indicator text-xs">LIVE</span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#1D2430] border border-[#2D333F] rounded-lg px-3 py-1.5 text-sm text-white"
            >
              <option value="all">כל הקטגוריות</option>
              <option value="planning">תכנון</option>
              <option value="market">שוק</option>
              <option value="policy">מדיניות</option>
              <option value="development">פיתוח</option>
              <option value="rates">ריביות</option>
            </select>
          </div>
        </div>

        {/* Skeleton Loaders */}
        {isLoadingNews && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="skeleton skeleton-button w-16 h-5" />
                  <div className="skeleton skeleton-avatar w-8 h-8" />
                </div>
                <div className="skeleton skeleton-title w-3/4 mb-2" />
                <div className="skeleton skeleton-text w-full" />
                <div className="skeleton skeleton-text w-2/3" />
                <div className="mt-4 pt-3 border-t border-[#2D333F] flex justify-between">
                  <div className="skeleton skeleton-button w-24 h-6" />
                  <div className="skeleton skeleton-text w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoadingNews && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isTranslating && translatedNews.length === 0 && filteredNews.length > 0 ? (
            <div className="col-span-full text-center py-8">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">טוען תרגום...</p>
            </div>
          ) : translatedNews.length === 0 && !isLoadingNews ? (
            <div className="col-span-full text-center py-12">
              <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">אין חדשות זמינות מהשעות האחרונות</p>
              <p className="text-sm text-slate-500">נסה לרענן את הדף או לבדוק מאוחר יותר</p>
            </div>
          ) : (
            translatedNews.map((item: any) => (
              <div key={item.id} className="card-hover p-4 cursor-pointer relative news-card-rtl" dir="rtl">
                {/* Live indicator for real-time news */}
                {item.isLive && (
                  <span className="absolute top-2 left-2 live-indicator">
                    <span className="w-1.5 h-1.5 bg-[#00C805] rounded-full animate-pulse" />
                    LIVE
                  </span>
                )}
                
                <div className="flex items-start justify-between mb-2">
                  <span className="text-lg">{item.country === "uk" ? "🇬🇧" : "🇨🇾"}</span>
                  <span className={cn("badge", CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG]?.color || "bg-slate-500/20 text-slate-400")}>
                    {CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG]?.label || item.category}
                  </span>
                </div>

                {/* Hebrew translated title and summary */}
                <h4 className="font-semibold text-white mb-2 line-clamp-2 text-right">
                  {item.title}
                </h4>
                <p className="text-sm text-slate-400 line-clamp-2 mb-3 text-right">
                  {item.summary}
                </p>

              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>{item.date || item.publishedAt}</span>
                </div>
              </div>

              {item.postcode && (
                <div className="mt-2 flex items-center gap-1 text-xs text-slate-500 justify-end">
                  <span>{item.postcode}</span>
                  <MapPin className="w-3 h-3" />
                </div>
              )}

                {/* Source Link - MANDATORY with Hebrew label - use url from NewsAPI */}
                <div className="mt-3 pt-3 border-t border-[#2D333F] flex items-center justify-between">
                  {item.sourceUrl && item.sourceUrl !== "#" ? (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                      לכתבה המקורית
                    </a>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-[#1D2430] border border-[#2D333F] rounded text-xs text-slate-500">
                      קישור לא זמין
                    </span>
                  )}
                  <span className="text-xs text-slate-500">{item.source}</span>
                </div>
              </div>
            ))
          )}
        </div>
        )}
      </div>

      {/* Analyst Recommendations - Real Data */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            המלצות אנליסטים
            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
              VERIFIED
            </span>
          </h3>
          <button
            type="button"
            onClick={() => setShowAnalysts(!showAnalysts)}
            className="text-sm text-slate-400 hover:text-white"
          >
            {showAnalysts ? "הסתר" : "הצג"}
          </button>
        </div>
        
        {showAnalysts && (
          <div className="space-y-4">
            {/* Real Analyst Reports from API */}
            {analysts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysts.map((analyst: any) => (
                  <div key={analyst.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          analyst.rating === "bullish" && "bg-emerald-500/20",
                          analyst.rating === "bearish" && "bg-red-500/20",
                          analyst.rating === "neutral" && "bg-amber-500/20"
                        )}>
                          {analyst.rating === "bullish" && <TrendingUp className="w-5 h-5 text-emerald-400" />}
                          {analyst.rating === "bearish" && <TrendingDown className="w-5 h-5 text-red-400" />}
                          {analyst.rating === "neutral" && <ArrowUpRight className="w-5 h-5 text-amber-400" />}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{analyst.firm}</p>
                          <p className="text-xs text-slate-500">{analyst.analyst}</p>
                        </div>
                      </div>
                      {analyst.isVerified && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    
                    <h4 className="text-sm font-medium text-white mb-2">{analyst.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-3 mb-3">{analyst.summary}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          analyst.rating === "bullish" && "bg-emerald-500/20 text-emerald-400",
                          analyst.rating === "bearish" && "bg-red-500/20 text-red-400",
                          analyst.rating === "neutral" && "bg-amber-500/20 text-amber-400"
                        )}>
                          {analyst.rating === "bullish" ? "BUY" : analyst.rating === "bearish" ? "SELL" : "HOLD"}
                        </span>
                        {analyst.priceTarget && (
                          <span className="text-xs text-slate-500">{analyst.priceTarget}</span>
                        )}
                      </div>
                      {analyst.targetRegion && (
                        <span className="text-xs text-slate-500">{analyst.targetRegion}</span>
                      )}
                    </div>
                    
                    {/* Source Link - MANDATORY */}
                    <a
                      href={analyst.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      צפה בדוח המקור
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 text-slate-500 animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-400">טוען המלצות אנליסטים...</p>
              </div>
            )}
            
            {/* Data Sources Attribution */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-700">
              <span className="text-xs text-slate-500">מקורות נתונים:</span>
              {[
                { name: "RICS", url: "https://www.rics.org" },
                { name: "Savills", url: "https://www.savills.co.uk/research" },
                { name: "Knight Frank", url: "https://www.knightfrank.co.uk/research" },
                { name: "Zoopla", url: "https://www.zoopla.co.uk/discover/property-news" },
                { name: "JLL", url: "https://www.jll.co.uk/en/trends-and-insights" },
              ].map((source) => (
                <a
                  key={source.name}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  {source.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
        </>
      )}

      {/* Resources Tab Content */}
      {mainTab === "resources" && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">משאבים גלובליים</h2>
                <p className="text-sm text-slate-400">קישורים רשמיים למקורות נתונים לפי מדינה</p>
              </div>
            </div>

            {/* Country Filter */}
            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-2">סינון לפי מדינה:</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedResourceCountry("all")}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    selectedResourceCountry === "all"
                      ? "bg-[#00C805] text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  )}
                >
                  הכל
                </button>
                {portfolioCountries.map((country) => (
                  <button
                    key={country}
                    onClick={() => setSelectedResourceCountry(country.toLowerCase())}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      selectedResourceCountry === country.toLowerCase()
                        ? "bg-[#00C805] text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    )}
                  >
                    {country === "UK" && "🇬🇧 UK"}
                    {country === "Israel" && "🇮🇱 ישראל"}
                    {country === "USA" && "🇺🇸 USA"}
                    {country === "Cyprus" && "🇨🇾 קפריסין"}
                    {country === "Greece" && "🇬🇷 יוון"}
                    {country === "Portugal" && "🇵🇹 פורטוגל"}
                    {country === "Georgia" && "🇬🇪 גאורגיה"}
                  </button>
                ))}
              </div>
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(() => {
                // Get resources based on filter
                let resourcesToShow: any[] = [];
                
                if (selectedResourceCountry === "all") {
                  // Show resources for all portfolio countries
                  const portfolioCountriesTyped = portfolioCountries as Country[];
                  resourcesToShow = getUniqueResources(
                    getResourcesForCountries(portfolioCountriesTyped.length > 0 ? portfolioCountriesTyped : ["UK"])
                  );
                } else {
                  // Show resources for selected country
                  const countryMap: Record<string, Country> = {
                    uk: "UK",
                    israel: "Israel",
                    usa: "USA",
                    cyprus: "Cyprus",
                    greece: "Greece",
                    portugal: "Portugal",
                    georgia: "Georgia",
                  };
                  const country = countryMap[selectedResourceCountry] || "UK";
                  resourcesToShow = getResourcesForCountries([country]);
                }

                if (resourcesToShow.length === 0) {
                  return (
                    <div className="col-span-full text-center py-12">
                      <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">אין משאבים זמינים למדינות שנבחרו</p>
                      <p className="text-sm text-slate-500 mt-2">הוסף נכסים מהמדינות הרלוונטיות כדי לראות משאבים</p>
                    </div>
                  );
                }

                return resourcesToShow.map((resource) => {
                  const categoryIcons: Record<string, any> = {
                    marketplace: Building2,
                    government: Landmark,
                    bank: DollarSign,
                    statistics: Activity,
                    news: Newspaper,
                  };
                  const Icon = categoryIcons[resource.category] || LinkIcon;
                  
                  const categoryColors: Record<string, string> = {
                    marketplace: "bg-emerald-500/20 text-emerald-400",
                    government: "bg-blue-500/20 text-blue-400",
                    bank: "bg-amber-500/20 text-amber-400",
                    statistics: "bg-purple-500/20 text-purple-400",
                    news: "bg-cyan-500/20 text-cyan-400",
                  };

                  return (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card p-4 hover:border-[#00C805]/50 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", categoryColors[resource.category])}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white group-hover:text-[#00C805] transition-colors mb-1">
                            {resource.nameHe || resource.name}
                          </h3>
                          {resource.descriptionHe && (
                            <p className="text-xs text-slate-400 mb-2">{resource.descriptionHe}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={cn("text-xs px-2 py-1 rounded", categoryColors[resource.category])}>
                              {resource.category === "marketplace" && "שוק נדל\"ן"}
                              {resource.category === "government" && "ממשלתי"}
                              {resource.category === "bank" && "בנק מרכזי"}
                              {resource.category === "statistics" && "סטטיסטיקה"}
                              {resource.category === "news" && "חדשות"}
                            </span>
                            <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-[#00C805] transition-colors" />
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
