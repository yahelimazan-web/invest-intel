"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
} from "recharts";
import {
  Building2,
  MapPin,
  Calendar,
  Percent,
  TrendingUp,
  TrendingDown,
  PoundSterling,
  Edit2,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Car,
  Trees,
  Zap,
  Key,
  AlertCircle,
  CheckCircle2,
  Calculator,
  ArrowLeftRight,
  X,
  Eye,
} from "lucide-react";
import {
  PORTFOLIO_ASSETS,
  PRICE_HISTORY,
  type PricePoint,
} from "../../lib/data";
import {
  formatCurrency,
  formatPercent,
  formatDate,
  calculateGrossYield,
  calculateNetYield,
  calculateROI,
  convertCurrency,
  CURRENCIES,
  type CurrencyCode,
  type PropertyAsset,
  cn,
} from "../../lib/utils";

interface PropertyDetailProps {
  asset: PropertyAsset;
  priceHistory: PricePoint[];
  onClose: () => void;
  comparisonAsset?: PropertyAsset | null;
  onCompare?: (asset: PropertyAsset) => void;
}

function PropertyDetail({
  asset,
  priceHistory,
  onClose,
  comparisonAsset,
  onCompare,
}: PropertyDetailProps) {
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>(asset.currency);

  const grossYield = calculateGrossYield(asset);
  const netYield = calculateNetYield(asset);
  const roi = calculateROI(asset);
  const gain = asset.currentValue - asset.purchasePrice;
  const gainPercent = (gain / asset.purchasePrice) * 100;

  // Compare chart data
  const comparisonData = useMemo(() => {
    if (!comparisonAsset) return null;
    const compHistory = PRICE_HISTORY[comparisonAsset.id] || [];

    // Normalize to percentage growth
    const normalizeHistory = (history: PricePoint[], currency: CurrencyCode) => {
      if (history.length === 0) return [];
      const baseValue = history[0].value;
      return history.map((p) => ({
        date: p.date,
        growth: ((p.value - baseValue) / baseValue) * 100,
      }));
    };

    const asset1Data = normalizeHistory(priceHistory, asset.currency);
    const asset2Data = normalizeHistory(compHistory, comparisonAsset.currency);

    // Merge by date
    const allDates = new Set([
      ...asset1Data.map((d) => d.date),
      ...asset2Data.map((d) => d.date),
    ]);

    return Array.from(allDates)
      .sort()
      .map((date) => ({
        date,
        [asset.name]: asset1Data.find((d) => d.date === date)?.growth || null,
        [comparisonAsset.name]:
          asset2Data.find((d) => d.date === date)?.growth || null,
      }));
  }, [asset, comparisonAsset, priceHistory]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-xl">
              {asset.country === "uk" ? "🇬🇧" : "🇨🇾"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{asset.name}</h2>
              <p className="text-sm text-slate-400">{asset.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 rounded-lg p-1">
              {(["GBP", "EUR", "ILS"] as CurrencyCode[]).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setDisplayCurrency(curr)}
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium transition-all",
                    displayCurrency === curr
                      ? "bg-emerald-500 text-white"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {curr}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">שווי נוכחי</p>
              <p className="text-lg font-bold text-white">
                {formatCurrency(
                  convertCurrency(asset.currentValue, asset.currency, displayCurrency),
                  displayCurrency
                )}
              </p>
              <p
                className={cn(
                  "text-xs font-medium mt-1",
                  gainPercent >= 0 ? "text-emerald-400" : "text-red-400"
                )}
              >
                {formatPercent(gainPercent)} מרכישה
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">שכירות חודשית</p>
              <p className="text-lg font-bold text-white">
                {formatCurrency(
                  convertCurrency(asset.monthlyRent, asset.currency, displayCurrency),
                  displayCurrency
                )}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {formatCurrency(
                  convertCurrency(asset.monthlyRent * 12, asset.currency, displayCurrency),
                  displayCurrency
                )}{" "}
                / שנה
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">תשואה נטו</p>
              <p className="text-lg font-bold text-emerald-400">{netYield.toFixed(1)}%</p>
              <p className="text-xs text-slate-500 mt-1">{grossYield.toFixed(1)}% ברוטו</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">ROI כולל</p>
              <p
                className={cn(
                  "text-lg font-bold",
                  roi >= 0 ? "text-emerald-400" : "text-red-400"
                )}
              >
                {roi.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">מתאריך רכישה</p>
            </div>
          </div>

          {/* Price Chart */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">מגמת שווי</h3>
              {!comparisonAsset && (
                <button
                  onClick={() =>
                    onCompare?.(PORTFOLIO_ASSETS.find((a) => a.id !== asset.id)!)
                  }
                  className="btn-ghost text-xs text-emerald-400"
                >
                  <ArrowLeftRight className="w-4 h-4 ml-1" />
                  השווה נכס
                </button>
              )}
              {comparisonAsset && (
                <button
                  onClick={() => onCompare?.(null as any)}
                  className="btn-ghost text-xs text-red-400"
                >
                  <X className="w-4 h-4 ml-1" />
                  בטל השוואה
                </button>
              )}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {comparisonAsset ? (
                  <LineChart data={comparisonData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={12}
                      tickFormatter={(v) => `${v.toFixed(0)}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value?.toFixed(1)}%`, "צמיחה"]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey={asset.name}
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey={comparisonAsset.name}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                ) : (
                  <AreaChart data={priceHistory}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={12}
                      tickFormatter={(v) =>
                        `${CURRENCIES[displayCurrency].symbol}${(v / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [
                        formatCurrency(
                          convertCurrency(value, asset.currency, displayCurrency),
                          displayCurrency
                        ),
                        "שווי",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#colorPrice)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Costs Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-3">פירוט הוצאות שנתיות</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">דמי ניהול ({asset.managementFee}%)</span>
                  <span className="text-white">
                    {formatCurrency(
                      convertCurrency(
                        (asset.monthlyRent * 12 * asset.managementFee) / 100,
                        asset.currency,
                        displayCurrency
                      ),
                      displayCurrency
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">תחזוקה</span>
                  <span className="text-white">
                    {formatCurrency(
                      convertCurrency(asset.maintenanceCosts, asset.currency, displayCurrency),
                      displayCurrency
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Council Tax</span>
                  <span className="text-white">
                    {formatCurrency(
                      convertCurrency(asset.councilTax, asset.currency, displayCurrency),
                      displayCurrency
                    )}
                  </span>
                </div>
                <div className="border-t border-slate-700 pt-2 mt-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-300">סה״כ הוצאות</span>
                    <span className="text-red-400">
                      {formatCurrency(
                        convertCurrency(
                          (asset.monthlyRent * 12 * asset.managementFee) / 100 +
                            asset.maintenanceCosts +
                            asset.councilTax,
                          asset.currency,
                          displayCurrency
                        ),
                        displayCurrency
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-3">מידע נוסף</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    תאריך רכישה
                  </span>
                  <span className="text-white">{formatDate(asset.purchaseDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1">
                    <PoundSterling className="w-4 h-4" />
                    מחיר רכישה
                  </span>
                  <span className="text-white">
                    {formatCurrency(
                      convertCurrency(asset.purchasePrice, asset.currency, displayCurrency),
                      displayCurrency
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    מיקוד
                  </span>
                  <span className="text-white">{asset.postcode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    רווח הון
                  </span>
                  <span
                    className={cn("font-medium", gain >= 0 ? "text-emerald-400" : "text-red-400")}
                  >
                    {formatCurrency(
                      convertCurrency(gain, asset.currency, displayCurrency),
                      displayCurrency
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800">
          <div className="flex gap-2">
            <button className="btn-secondary text-sm">
              <Edit2 className="w-4 h-4 ml-1" />
              ערוך נכס
            </button>
            <button className="btn-ghost text-red-400 text-sm">
              <Trash2 className="w-4 h-4 ml-1" />
              מחק
            </button>
          </div>
          <button onClick={onClose} className="btn-primary text-sm">
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyProperties() {
  const router = useRouter();
  const [selectedAsset, setSelectedAsset] = useState<PropertyAsset | null>(null);
  const [comparisonAsset, setComparisonAsset] = useState<PropertyAsset | null>(null);
  const [filter, setFilter] = useState<"all" | "uk" | "cyprus">("all");
  const [sortBy, setSortBy] = useState<"value" | "yield" | "date">("value");
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<PropertyAsset | null>(null);
  const [editFormData, setEditFormData] = useState<{
    purchasePrice: string;
    monthlyRent: string;
  }>({ purchasePrice: "", monthlyRent: "" });
  const [isSaving, setIsSaving] = useState(false);
  
  // Load assets from localStorage or use default
  const [assets, setAssets] = useState<PropertyAsset[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('investintel_my_properties');
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Failed to load from localStorage:', e);
      }
    }
    return PORTFOLIO_ASSETS;
  });

  const filteredAssets = useMemo(() => {
    let assets = [...PORTFOLIO_ASSETS];

    if (filter !== "all") {
      assets = assets.filter((a) => a.country === filter);
    }

    assets.sort((a, b) => {
      switch (sortBy) {
        case "value":
          return b.currentValue - a.currentValue;
        case "yield":
          return calculateGrossYield(b) - calculateGrossYield(a);
        case "date":
          return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        default:
          return 0;
      }
    });

    return assets;
  }, [filter, sortBy]);

  const totals = useMemo(() => {
    const totalValue = filteredAssets.reduce(
      (sum, a) => sum + convertCurrency(a.currentValue, a.currency, "GBP"),
      0
    );
    const totalRent = filteredAssets.reduce(
      (sum, a) => sum + convertCurrency(a.monthlyRent, a.currency, "GBP"),
      0
    );
    return { totalValue, totalRent };
  }, [filteredAssets]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">הנכסים שלי</h1>
          <p className="text-slate-400">ניהול ומעקב תיק הנכסים</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 ml-1" />
          הוסף נכס
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-500/30">
          <p className="text-sm text-slate-300 mb-1">שווי תיק כולל</p>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(totals.totalValue, "GBP")}
          </p>
          <p className="text-xs text-slate-400 mt-1">{filteredAssets.length} נכסים</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-300 mb-1">הכנסה חודשית כוללת</p>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(totals.totalRent, "GBP")}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {formatCurrency(totals.totalRent * 12, "GBP")} / שנה
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-300 mb-1">תשואה ממוצעת</p>
          <p className="text-2xl font-bold text-emerald-400">
            {(
              filteredAssets.reduce((sum, a) => sum + calculateGrossYield(a), 0) /
              filteredAssets.length
            ).toFixed(1)}
            %
          </p>
          <p className="text-xs text-slate-400 mt-1">Gross Yield</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
          {[
            { id: "all", label: "הכל" },
            { id: "uk", label: "🇬🇧 UK" },
            { id: "cyprus", label: "🇨🇾 Cyprus" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                filter === f.id
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>מיון:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
          >
            <option value="value">שווי</option>
            <option value="yield">תשואה</option>
            <option value="date">תאריך רכישה</option>
          </select>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => {
          const grossYield = calculateGrossYield(asset);
          const gain = asset.currentValue - asset.purchasePrice;
          const gainPercent = (gain / asset.purchasePrice) * 100;

          return (
            <div
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className="card-hover p-4 cursor-pointer"
            >
              {/* Property Image Placeholder */}
              <div className="h-32 bg-slate-800 rounded-lg mb-3 flex items-center justify-center">
                <Building2 className="w-12 h-12 text-slate-600" />
              </div>

              {/* Info */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-white">{asset.name}</h3>
                  <p className="text-sm text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {asset.postcode}
                  </p>
                </div>
                <span className="text-xl">{asset.country === "uk" ? "🇬🇧" : "🇨🇾"}</span>
              </div>

              {/* Value & Yield */}
              <div className="flex items-end justify-between mt-3">
                <div>
                  <p className="text-lg font-bold text-white">
                    {formatCurrency(asset.currentValue, asset.currency)}
                  </p>
                  <p
                    className={cn(
                      "text-xs font-medium flex items-center gap-1",
                      gainPercent >= 0 ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {gainPercent >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {formatPercent(gainPercent)}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-emerald-400">{grossYield.toFixed(1)}%</p>
                  <p className="text-xs text-slate-500">Yield</p>
                </div>
              </div>

              {/* Rent */}
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">שכירות</span>
                  <span className="text-white">
                    {formatCurrency(asset.monthlyRent, asset.currency)}/חודש
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Property Card */}
        <div className="card border-dashed border-slate-700 p-4 flex flex-col items-center justify-center min-h-[280px] cursor-pointer hover:border-emerald-500/50 transition-colors">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-3">
            <Plus className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400 font-medium">הוסף נכס חדש</p>
          <p className="text-sm text-slate-500 mt-1">לחץ להוספת נכס לתיק</p>
        </div>
      </div>

      {/* Property Detail Modal */}
      {selectedAsset && (
        <PropertyDetail
          asset={selectedAsset}
          priceHistory={PRICE_HISTORY[selectedAsset.id] || []}
          onClose={() => {
            setSelectedAsset(null);
            setComparisonAsset(null);
          }}
          comparisonAsset={comparisonAsset}
          onCompare={setComparisonAsset}
        />
      )}
    </div>
  );
}
