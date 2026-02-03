"use client";

import { useMemo, useState, useEffect } from "react";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Wallet,
  PiggyBank,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  Send,
  Loader2,
  MapPin,
} from "lucide-react";
import {
  PRICE_HISTORY,
  ALERTS,
  type PricePoint,
} from "../../lib/data";
import { useAuth } from "../../lib/auth";
import { loadUserFolders } from "../../lib/portfolio-db";
import RecentSales from "../RecentSales";
import InfrastructureRadar from "../InfrastructureRadar";
import {
  formatCurrency,
  formatPercent,
  calculateGrossYield,
  calculateNetYield,
  calculateROI,
  calculateTotalEquity,
  convertCurrency,
  CURRENCIES,
  type CurrencyCode,
} from "../../lib/utils";
import { cn } from "../../lib/utils";

const CURRENCY_COLORS: Record<string, string> = {
  GBP: "#10b981",
  EUR: "#3b82f6",
  ILS: "#f59e0b",
  USD: "#ef4444",
  GEL: "#8b5cf6",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>("GBP");
  const [portfolioAssets, setPortfolioAssets] = useState<any[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const getAssetCurrency = (country?: string): CurrencyCode => {
    if (country === "Israel") return "ILS";
    if (country === "USA") return "USD";
    if (country === "Cyprus" || country === "Greece" || country === "Portugal") return "EUR";
    if (country === "Georgia") return "GEL";
    return "GBP";
  };

  // Load portfolio from Supabase
  useEffect(() => {
    if (!user?.id) {
      console.log("[Dashboard] No user ID, skipping portfolio load");
      setIsLoadingPortfolio(false);
      return;
    }

    const loadPortfolio = async () => {
      try {
        console.log("[Dashboard] Loading portfolio for user:", user.id);
        const folders = await loadUserFolders(user.id);
        console.log("[Dashboard] Folders loaded:", folders);
        console.log("[Dashboard] Folders count:", folders.length);
        
        const allProperties = folders.flatMap((f) => {
          const props = f.properties || [];
          console.log(`[Dashboard] Folder "${f.name}" has ${props.length} properties:`, props);
          return props;
        });
        
        console.log("[Dashboard] Total properties found:", allProperties.length);
        console.log("[Dashboard] Properties data:", allProperties);
        
        setPortfolioAssets(allProperties);
      } catch (error) {
        console.error("[Dashboard] Failed to load portfolio:", error);
        setPortfolioAssets([]);
      } finally {
        setIsLoadingPortfolio(false);
      }
    };

    loadPortfolio();
  }, [user?.id]);

  // Portfolio calculations - with optional chaining
  const portfolioStats = useMemo(() => {
    console.log("[Dashboard] Calculating portfolio stats for", portfolioAssets?.length || 0, "assets");
    
    if (!portfolioAssets || portfolioAssets.length === 0) {
      console.log("[Dashboard] No portfolio assets, returning zero stats");
      return {
        totalEquity: 0,
        totalPurchase: 0,
        totalRent: 0,
        avgGrossYield: 0,
        avgNetYield: 0,
        totalGain: 0,
        totalGainPercent: 0,
        propertyCount: 0,
      };
    }

    const totalEquity = calculateTotalEquity(portfolioAssets, displayCurrency);
    const getAssetCurrency = (country?: string): CurrencyCode => {
      if (country === "Israel") return "ILS";
      if (country === "USA") return "USD";
      if (country === "Cyprus" || country === "Greece" || country === "Portugal") return "EUR";
      if (country === "Georgia") return "GEL";
      return "GBP"; // Default
    };

    const totalPurchase = portfolioAssets.reduce(
      (sum, a) => sum + (convertCurrency(a?.purchasePrice || a?.lastPrice || 0, getAssetCurrency(a?.country), displayCurrency) || 0),
      0
    );
    const totalRent = portfolioAssets.reduce(
      (sum, a) => sum + (convertCurrency(a?.monthlyRent || 0, getAssetCurrency(a?.country), displayCurrency) || 0),
      0
    );
    const avgGrossYield =
      portfolioAssets.reduce((sum, a) => {
        const price = a?.purchasePrice || a?.lastPrice || 0;
        const rent = a?.monthlyRent || 0;
        return sum + (price > 0 ? (rent * 12 / price) * 100 : 0);
      }, 0) / (portfolioAssets.length || 1);
    const avgNetYield = avgGrossYield * 0.7; // Approximate
    const totalGain = totalEquity - totalPurchase;
    const totalGainPercent = totalPurchase > 0 ? (totalGain / totalPurchase) * 100 : 0;

    const stats = {
      totalEquity,
      totalPurchase,
      totalRent,
      avgGrossYield,
      avgNetYield,
      totalGain,
      totalGainPercent,
      propertyCount: portfolioAssets.length,
    };
    
    console.log("[Dashboard] Calculated portfolio stats:", stats);
    return stats;
  }, [displayCurrency, portfolioAssets]);

  // Send test email
  const handleSendTestEmail = async () => {
    if (!user?.email || !user?.name) {
      setEmailStatus({ success: false, message: "נדרש אימייל ושם משתמש" });
      return;
    }

    setEmailSending(true);
    setEmailStatus(null);

    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          userEmail: user.email,
          userName: user.name,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setEmailStatus({ success: true, message: "אימייל נשלח בהצלחה!" });
      } else {
        setEmailStatus({ success: false, message: result.error || "שגיאה בשליחת אימייל" });
      }
    } catch (error: any) {
      setEmailStatus({ success: false, message: error?.message || "שגיאה בשליחת אימייל" });
    } finally {
      setEmailSending(false);
    }
  };

  // Currency exposure - with optional chaining
  const currencyExposure = useMemo(() => {
    if (!portfolioAssets || portfolioAssets.length === 0) {
      return [];
    }

    // Calculate total value in display currency
    const total = portfolioAssets.reduce((sum, a) => {
      const assetValue = a?.lastPrice || a?.purchasePrice || 0;
      const assetCurrency: CurrencyCode = a?.country === "Israel" ? "ILS" : a?.country === "USA" ? "USD" : "GBP";
      const convertedValue = convertCurrency(assetValue, assetCurrency, displayCurrency);
      return sum + convertedValue;
    }, 0);
    
    if (total === 0) return [];

    const exposure: { currency: CurrencyCode; value: number; percent: number }[] = [];

    // Group by currency and convert to display currency
    const grouped = portfolioAssets.reduce((acc, a) => {
      let assetCurrency: CurrencyCode = "GBP"; // Default
      if (a?.country === "Israel") assetCurrency = "ILS";
      else if (a?.country === "USA") assetCurrency = "USD";
      else if (a?.country === "Cyprus" || a?.country === "Greece" || a?.country === "Portugal") assetCurrency = "EUR";
      else if (a?.country === "Georgia") assetCurrency = "GEL";
      
      const assetValue = a?.lastPrice || a?.purchasePrice || 0;
      const convertedValue = convertCurrency(assetValue, assetCurrency, displayCurrency);
      acc[assetCurrency] = (acc[assetCurrency] || 0) + convertedValue;
      return acc;
    }, {} as Record<CurrencyCode, number>);

    (Object.keys(grouped) as CurrencyCode[]).forEach((currency) => {
      exposure.push({
        currency,
        value: grouped[currency],
        percent: (grouped[currency] / total) * 100,
      });
    });

    return exposure;
  }, [portfolioAssets, displayCurrency]);

  // Combined portfolio value chart - with optional chaining
  const portfolioValueChart = useMemo(() => {
    if (!portfolioAssets || portfolioAssets.length === 0) {
      return [];
    }

    // Try to get historical data from PRICE_HISTORY
    const allDates = new Set<string>();
    Object.values(PRICE_HISTORY || {}).forEach((history) => {
      if (Array.isArray(history)) {
        history.forEach((p) => {
          if (p?.date) allDates.add(p.date);
        });
      }
    });

    // If we have historical data, use it
    if (allDates.size > 0) {
      const sortedDates = Array.from(allDates).sort();
      return sortedDates.map((date) => {
        let totalValue = 0;
        portfolioAssets?.forEach((asset) => {
          const history = PRICE_HISTORY[asset?.id || ""];
          if (history && Array.isArray(history)) {
            const point = history.find((p) => p?.date === date);
            if (point?.value) {
              let assetCurrency: CurrencyCode = "GBP";
              if (asset?.country === "Israel") assetCurrency = "ILS";
              else if (asset?.country === "USA") assetCurrency = "USD";
              else if (asset?.country === "Cyprus" || asset?.country === "Greece" || asset?.country === "Portugal") assetCurrency = "EUR";
              else if (asset?.country === "Georgia") assetCurrency = "GEL";
              totalValue += convertCurrency(point.value, assetCurrency, displayCurrency) || 0;
            }
          }
        });
        return { date, value: totalValue };
      }).filter((d) => d.value > 0);
    }

    // Fallback: Create a simple chart from current values
    // Show purchase price vs current value over time
    const now = new Date();
    const purchaseDates: string[] = [];
    const currentValues: { date: string; value: number }[] = [];
    
    portfolioAssets?.forEach((asset) => {
      if (asset?.purchaseDate) {
        purchaseDates.push(asset.purchaseDate);
      }
    });

    if (purchaseDates.length > 0) {
      // Create timeline: earliest purchase -> now
      const sortedPurchaseDates = [...new Set(purchaseDates)].sort();
      const earliestDate = sortedPurchaseDates[0];
      const monthsAgo = Math.max(6, Math.ceil((now.getTime() - new Date(earliestDate).getTime()) / (1000 * 60 * 60 * 24 * 30)));
      
      // Generate monthly points
      for (let i = monthsAgo; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        let totalValue = 0;
        portfolioAssets?.forEach((asset) => {
          let assetCurrency: CurrencyCode = "GBP";
          if (asset?.country === "Israel") assetCurrency = "ILS";
          else if (asset?.country === "USA") assetCurrency = "USD";
          else if (asset?.country === "Cyprus" || asset?.country === "Greece" || asset?.country === "Portugal") assetCurrency = "EUR";
          else if (asset?.country === "Georgia") assetCurrency = "GEL";
          
          const purchaseDate = asset?.purchaseDate ? new Date(asset.purchaseDate) : null;
          const currentValue = asset?.lastPrice || asset?.purchasePrice || 0;
          
          if (purchaseDate && date >= purchaseDate) {
            // After purchase: show current value
            totalValue += convertCurrency(currentValue, assetCurrency, displayCurrency) || 0;
          } else if (!purchaseDate) {
            // No purchase date: always show current value
            totalValue += convertCurrency(currentValue, assetCurrency, displayCurrency) || 0;
          }
        });
        
        if (totalValue > 0) {
          currentValues.push({ date: dateStr, value: totalValue });
        }
      }
    } else {
      // No purchase dates: just show current value
      const totalValue = portfolioAssets.reduce((sum, asset) => {
        let assetCurrency: CurrencyCode = "GBP";
        if (asset?.country === "Israel") assetCurrency = "ILS";
        else if (asset?.country === "USA") assetCurrency = "USD";
        else if (asset?.country === "Cyprus" || asset?.country === "Greece" || asset?.country === "Portugal") assetCurrency = "EUR";
        else if (asset?.country === "Georgia") assetCurrency = "GEL";
        
        const currentValue = asset?.lastPrice || asset?.purchasePrice || 0;
        return sum + (convertCurrency(currentValue, assetCurrency, displayCurrency) || 0);
      }, 0);
      
      if (totalValue > 0) {
        const today = now.toISOString().split('T')[0];
        currentValues.push({ date: today, value: totalValue });
      }
    }

    return currentValues;
  }, [portfolioAssets, displayCurrency]);

  // Unread alerts
  const unreadAlerts = ALERTS.filter((a) => !a.read);

  const currencySymbol = CURRENCIES[displayCurrency]?.symbol || "£";

  // Show loading state
  if (isLoadingPortfolio) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00C805] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm">טוען תיק השקעות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">דשבורד תיק ההשקעות</h1>
          <p className="text-slate-400">סקירה כללית של הנכסים שלך</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Send Test Email Button */}
          {user?.email && (
            <button
              onClick={handleSendTestEmail}
              disabled={emailSending}
              className="flex items-center gap-2 px-4 py-2 bg-[#00C805]/20 hover:bg-[#00C805]/30 border border-[#00C805]/50 text-[#00C805] rounded-lg transition-all text-sm font-medium disabled:opacity-50"
            >
              {emailSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  שולח...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  שלח אימייל בדיקה
                </>
              )}
            </button>
          )}
          {emailStatus && (
            <div className={cn(
              "px-3 py-2 rounded-lg text-sm",
              emailStatus.success
                ? "bg-[#00C805]/20 text-[#00C805] border border-[#00C805]/50"
                : "bg-red-500/20 text-red-400 border border-red-500/50"
            )}>
              {emailStatus.message}
            </div>
          )}
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
            {(["GBP", "EUR", "ILS"] as CurrencyCode[]).map((curr) => (
              <button
                key={curr}
                onClick={() => setDisplayCurrency(curr)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  displayCurrency === curr
                    ? "bg-emerald-500 text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {CURRENCIES[curr].flag} {curr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Equity */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              (portfolioStats?.totalGainPercent ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {(portfolioStats?.totalGainPercent ?? 0) >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              {formatPercent(portfolioStats?.totalGainPercent ?? 0)}
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(portfolioStats?.totalEquity ?? 0, displayCurrency)}
          </p>
          <p className="text-sm text-slate-400">שווי תיק כולל</p>
        </div>

        {/* Monthly Income */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(portfolioStats?.totalRent ?? 0, displayCurrency)}
          </p>
          <p className="text-sm text-slate-400">הכנסה חודשית</p>
        </div>

        {/* Avg Yield */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Percent className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {(portfolioStats?.avgNetYield ?? 0).toFixed(1)}%
          </p>
          <p className="text-sm text-slate-400">תשואה נטו ממוצעת</p>
          <p className="text-xs text-slate-500 mt-1">
            ({(portfolioStats?.avgGrossYield ?? 0).toFixed(1)}% ברוטו)
          </p>
        </div>

        {/* Properties */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {portfolioStats?.propertyCount ?? 0}
          </p>
          <p className="text-sm text-slate-400">נכסים בתיק</p>
          <div className="flex gap-2 mt-1">
            <span className="text-xs text-slate-500">
              🇬🇧 {portfolioAssets?.filter((a) => a?.country === "UK").length || 0}
            </span>
            <span className="text-xs text-slate-500">
              🇨🇾 {portfolioAssets?.filter((a) => a?.country === "Cyprus").length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Portfolio Value Chart */}
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">מגמת שווי תיק</h3>
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              <span>{formatPercent(portfolioStats?.totalGainPercent ?? 0)}</span>
            </div>
          </div>
          <div className="h-64">
            {portfolioValueChart && portfolioValueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioValueChart}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => `${currencySymbol}${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  formatter={(value) =>
                    formatCurrency(Number(value) || 0, displayCurrency)
                  }
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorValue)"
                />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                אין נתוני היסטוריה להצגה
              </div>
            )}
          </div>
        </div>

        {/* Currency Exposure */}
        <div className="card p-4">
          <h3 className="font-semibold text-white mb-4">חשיפה מטבעית</h3>
          <div className="h-48">
            {currencyExposure && currencyExposure.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currencyExposure}
                    dataKey="percent"
                    nameKey="currency"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                     >
                    {currencyExposure.map((entry) => (
                      <Cell
                        key={entry.currency}
                        fill={CURRENCY_COLORS[entry.currency] || "#64748b"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => `${Number(value) || 0}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                אין נכסים בתיק
              </div>
            )}
          </div>
          {currencyExposure && currencyExposure.length > 0 && (
            <div className="space-y-2 mt-2">
              {currencyExposure.map((exp) => (
              <div key={exp.currency} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CURRENCY_COLORS[exp.currency] }}
                  />
                  <span className="text-sm text-slate-300">
                    {CURRENCIES[exp.currency]?.flag || "💰"} {exp.currency}
                  </span>
                </div>
                <span className="text-sm font-medium text-white">
                  {exp.percent.toFixed(1)}%
                </span>
              </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Properties List */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">נכסים בתיק</h3>
            <button className="btn-ghost text-sm text-emerald-400 flex items-center gap-1">
              צפה בהכל
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {portfolioAssets?.map((asset) => {
              const price = asset?.purchasePrice || asset?.lastPrice || 0;
              const rent = asset?.monthlyRent || 0;
              const currentValue = asset?.lastPrice || price;
              const grossYield = price > 0 ? (rent * 12 / price) * 100 : 0;
              const roi = grossYield * 0.7; // Approximate
              const gain = currentValue - price;
              const gainPercent = price > 0 ? (gain / price) * 100 : 0;

              return (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center text-lg">
                      {asset?.country === "UK" ? "🇬🇧" : asset?.country === "Israel" ? "🇮🇱" : asset?.country === "USA" ? "🇺🇸" : "🇨🇾"}
                    </div>
                    <div>
                      <p className="font-medium text-white">{asset?.address || "נכס ללא שם"}</p>
                      <p className="text-sm text-slate-400">{asset?.postcode || ""}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">
                      {formatCurrency(
                        convertCurrency(currentValue, getAssetCurrency(asset?.country), displayCurrency),
                        displayCurrency
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          gainPercent >= 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {formatPercent(gainPercent)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {grossYield.toFixed(1)}% yield
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              התראות
              {unreadAlerts.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadAlerts.length}
                </span>
              )}
            </h3>
            <button className="btn-ghost text-sm text-emerald-400 flex items-center gap-1">
              כל ההתראות
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {ALERTS.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "p-3 rounded-xl border transition-colors cursor-pointer",
                  alert.read
                    ? "bg-slate-800/30 border-slate-800"
                    : "bg-slate-800/50 border-slate-700"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      alert.priority === "high"
                        ? "bg-red-500/20 text-red-400"
                        : alert.priority === "medium"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-blue-500/20 text-blue-400"
                    )}
                  >
                    {alert.priority === "high" ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">{alert.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span className="text-xs text-slate-500">{alert.date}</span>
                      {alert.postcode && (
                        <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">
                          {alert.postcode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights Section - Recent Sales & Infrastructure */}
      {portfolioAssets && portfolioAssets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Recent Sales - Show for first property */}
          {portfolioAssets[0]?.postcode && (
            <RecentSales
              propertyPostcode={portfolioAssets[0]?.postcode}
              country={portfolioAssets[0]?.country || "UK"}
              radius={1000}
            />
          )}

          {/* Infrastructure Radar - Note: Requires coordinates */}
          {/* Can be enhanced to fetch coordinates from postcode */}
          {portfolioAssets[0]?.postcode && (
            <div className="bg-[#151921] border border-[#2D333F] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">תשתית בקרבת מקום</h3>
              </div>
              <p className="text-sm text-slate-400">
                תכונת תשתית זמינה עבור נכסים עם קואורדינטות
              </p>
              <p className="text-xs text-slate-500 mt-2">
                הוסף נכס דרך Market Explorer כדי לראות תשתית בקרבת מקום
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
