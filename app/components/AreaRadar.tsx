"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Radar,
  Bell,
  Plus,
  X,
  Trash2,
  TrendingDown,
  TrendingUp,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Star,
  Target,
  ExternalLink,
  Zap,
  Globe,
  Filter,
} from "lucide-react";
import { cn, formatCurrency } from "../lib/utils";
import { useAuth, getUserData, setUserData } from "../lib/auth";

// =============================================================================
// Types
// =============================================================================

interface PropertyDeal {
  id: string;
  address: string;
  postcode: string;
  region: string;
  askingPrice: number;
  averagePrice: number;
  lastSoldPrice?: number;
  lastSoldDate?: string;
  discount: number;
  pricePerSqm?: number;
  propertyType: string;
  source: string;
  sourceUrl: string;
  detectedAt: string;
  isHotDeal: boolean;
  seen?: boolean;
}

interface RegionalSummary {
  region: string;
  averagePrice: number;
  medianPrice: number;
  transactionCount: number;
  yearChange: number;
  source: string;
  dealsCount: number;
}

interface WatchedPostcode {
  id: string;
  postcode: string;
  addedAt: string;
  lastChecked?: string;
  deals: PropertyDeal[];
}

interface AreaRadarProps {
  isOpen: boolean;
  onClose: () => void;
  onDealClick?: (postcode: string, address: string) => void;
}

// UK Regions for filter
const UK_REGIONS = [
  "All Regions",
  "North East",
  "North West",
  "Yorkshire and The Humber",
  "East Midlands",
  "West Midlands",
  "East of England",
  "London",
  "South East",
  "South West",
];

// =============================================================================
// Area Radar Component - UK-Wide Deal Scanner
// =============================================================================

export default function AreaRadar({
  isOpen,
  onClose,
  onDealClick,
}: AreaRadarProps) {
  const { user, isLoading: authLoading } = useAuth();

  const [watchedPostcodes, setWatchedPostcodes] = useState<WatchedPostcode[]>(
    [],
  );
  const [newPostcode, setNewPostcode] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isScanningUK, setIsScanningUK] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["deals", "watched"]),
  );

  // UK-wide deals feed
  const [ukDeals, setUkDeals] = useState<PropertyDeal[]>([]);
  const [regionalSummary, setRegionalSummary] = useState<RegionalSummary[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [totalDealsFound, setTotalDealsFound] = useState(0);
  const [hotDealsCount, setHotDealsCount] = useState(0);

  // Load watched postcodes from user-specific localStorage
  useEffect(() => {
    if (authLoading) return;

    try {
      const userId = user?.id || null;
      const saved = getUserData<WatchedPostcode[]>(
        userId,
        "investintel-watched-postcodes",
        [],
      );
      setWatchedPostcodes(saved);
    } catch (e) {
      console.error("Failed to load watched postcodes:", e);
    }
  }, [authLoading, user?.id]);

  // Save watched postcodes to user-specific localStorage
  useEffect(() => {
    if (authLoading) return;

    try {
      const userId = user?.id || null;
      setUserData(userId, "investintel-watched-postcodes", watchedPostcodes);
    } catch (e) {
      console.error("Failed to save watched postcodes:", e);
    }
  }, [watchedPostcodes, authLoading, user?.id]);

  // Add new postcode to watch
  const addPostcode = useCallback(async () => {
    if (!newPostcode.trim()) return;

    const normalized = newPostcode.toUpperCase().trim().replace(/\s+/g, " ");

    // Check if already watching
    if (watchedPostcodes.some((p) => p.postcode === normalized)) {
      setNewPostcode("");
      return;
    }

    setIsAdding(true);

    const newWatched: WatchedPostcode = {
      id: `watched-${Date.now()}`,
      postcode: normalized,
      addedAt: new Date().toISOString(),
      deals: [],
    };

    // Scan this postcode for deals
    try {
      const response = await fetch(
        `/api/market-radar?postcode=${encodeURIComponent(normalized)}&minDiscount=15`,
      );
      if (response.ok) {
        const data = await response.json();
        newWatched.deals = data.deals || [];
        newWatched.lastChecked = new Date().toISOString();
      }
    } catch (error) {
      console.error("Failed to scan postcode:", error);
    }

    setWatchedPostcodes((prev) => [...prev, newWatched]);
    setNewPostcode("");
    setIsAdding(false);
  }, [newPostcode, watchedPostcodes]);

  // Remove postcode from watch
  const removePostcode = useCallback((id: string) => {
    setWatchedPostcodes((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Scan all watched postcodes
  const scanWatched = useCallback(async () => {
    if (watchedPostcodes.length === 0) return;

    setIsScanning(true);

    try {
      const postcodeList = watchedPostcodes.map((w) => w.postcode);
      const response = await fetch("/api/market-radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcodes: postcodeList }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update each watched postcode with its deals
        setWatchedPostcodes((prev) =>
          prev.map((wp) => ({
            ...wp,
            deals:
              data.deals?.filter((d: PropertyDeal) =>
                d.postcode
                  .toUpperCase()
                  .startsWith(wp.postcode.replace(/\s+/g, "").toUpperCase()),
              ) || [],
            lastChecked: new Date().toISOString(),
          })),
        );
      }
    } catch (error) {
      console.error("Failed to scan watched postcodes:", error);
    }

    setIsScanning(false);
  }, [watchedPostcodes]);

  // Scan UK-wide for deals
  const scanUKWide = useCallback(async (region?: string) => {
    setIsScanningUK(true);

    try {
      const params = new URLSearchParams({
        minDiscount: "15",
        limit: "100",
      });

      if (region && region !== "All Regions") {
        params.set("region", region);
      }

      const response = await fetch(`/api/market-radar?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setUkDeals(data.deals || []);
        setRegionalSummary(data.regionalSummary || []);
        setTotalDealsFound(data.totalDeals || 0);
        setHotDealsCount(data.hotDeals || 0);
        setLastScanTime(new Date());
      }
    } catch (error) {
      console.error("Failed to scan UK:", error);
    }

    setIsScanningUK(false);
  }, []);

  // Initial scan on open
  useEffect(() => {
    if (isOpen && ukDeals.length === 0) {
      scanUKWide();
    }
  }, [isOpen, ukDeals.length, scanUKWide]);

  // Filter deals by region
  const filteredDeals =
    selectedRegion === "All Regions"
      ? ukDeals
      : ukDeals.filter((d) => d.region === selectedRegion);

  // Toggle section
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Mark deal as seen
  const markAsSeen = useCallback((dealId: string) => {
    setUkDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, seen: true } : d)),
    );
  }, []);

  // Count new deals
  const newDealsCount =
    ukDeals.filter((d) => !d.seen).length +
    watchedPostcodes.reduce(
      (sum, wp) => sum + wp.deals.filter((d) => !d.seen).length,
      0,
    );

  if (!isOpen) return null;

  return (
    <div className="fixed left-0 top-0 h-full w-96 bg-slate-900 border-r border-slate-700 z-50 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Radar className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-bold text-white flex items-center gap-2">
                Market Radar
                {newDealsCount > 0 && (
                  <span className="px-2 py-0.5 bg-cyan-500 text-white text-xs font-bold rounded-full animate-pulse">
                    {newDealsCount} NEW
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">UK-Wide Deal Scanner</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-800 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-cyan-400">{totalDealsFound}</p>
            <p className="text-xs text-slate-500">Total Deals</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-amber-400">{hotDealsCount}</p>
            <p className="text-xs text-slate-500">Hot Deals (20%+)</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-emerald-400">
              {watchedPostcodes.length}
            </p>
            <p className="text-xs text-slate-500">Watching</p>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* UK-Wide Deals Feed */}
        <div className="border-b border-slate-700">
          <button
            type="button"
            onClick={() => toggleSection("deals")}
            className="w-full p-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="font-medium text-white">UK Deals Feed</span>
              <span className="text-xs text-slate-500">
                ({filteredDeals.length})
              </span>
            </div>
            {expandedSections.has("deals") ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSections.has("deals") && (
            <div className="p-3 pt-0 space-y-3">
              {/* Postcode Search */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="חיפוש לפי מיקוד (M1, L32...)"
                  value={newPostcode}
                  onChange={(e) => setNewPostcode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newPostcode.trim() && !isAdding) {
                      e.preventDefault();
                      addPostcode();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#00C805]"
                  style={{ color: "white" }}
                  autoComplete="off"
                  disabled={isAdding}
                />
                <button
                  type="button"
                  onClick={addPostcode}
                  disabled={isAdding || !newPostcode.trim()}
                  className="px-3 py-2 bg-[#00C805] hover:bg-[#00D806] disabled:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Filter & Scan Controls */}
              <div className="flex gap-2">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                  style={{ color: "white" }}
                >
                  {UK_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => scanUKWide(selectedRegion)}
                  disabled={isScanningUK}
                  className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  {isScanningUK ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </button>
              </div>

              {lastScanTime && (
                <p className="text-xs text-slate-500">
                  Last scan: {lastScanTime.toLocaleTimeString("he-IL")}
                </p>
              )}

              {/* Deals List */}
              {isScanningUK ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">
                    Scanning UK market...
                  </p>
                </div>
              ) : filteredDeals.length === 0 ? (
                <div className="py-6 text-center">
                  <Target className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No deals found</p>
                  <p className="text-slate-500 text-xs">
                    Try scanning again or change region
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filteredDeals.slice(0, 20).map((deal) => (
                    <div
                      key={deal.id}
                      onClick={() => {
                        markAsSeen(deal.id);
                        onDealClick?.(deal.postcode, deal.address);
                      }}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-all",
                        deal.isHotDeal
                          ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:border-amber-400/50"
                          : "bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50",
                        !deal.seen && "ring-1 ring-cyan-500/50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {deal.isHotDeal && (
                              <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            )}
                            <span className="font-medium text-white text-sm truncate">
                              {deal.address}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <MapPin className="w-3 h-3" />
                            <span>{deal.postcode}</span>
                            <span className="text-slate-600">•</span>
                            <span>{deal.region}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div
                            className={cn(
                              "font-bold text-sm",
                              deal.discount >= 20
                                ? "text-amber-400"
                                : "text-emerald-400",
                            )}
                          >
                            -{deal.discount}%
                          </div>
                          <div className="text-xs text-slate-500">
                            £{(deal.askingPrice / 1000).toFixed(0)}K
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          vs avg £{(deal.averagePrice / 1000).toFixed(0)}K
                        </span>
                        <a
                          href={deal.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          {deal.source}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Watched Postcodes Section */}
        <div className="border-b border-slate-700">
          <button
            type="button"
            onClick={() => toggleSection("watched")}
            className="w-full p-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span className="font-medium text-white">Watched Postcodes</span>
              <span className="text-xs text-slate-500">
                ({watchedPostcodes.length})
              </span>
            </div>
            {expandedSections.has("watched") ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedSections.has("watched") && (
            <div className="p-3 pt-0 space-y-3">
              {/* Add Postcode Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPostcode}
                  onChange={(e) => setNewPostcode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && addPostcode()}
                  placeholder="e.g. L32 or M1"
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  style={{ color: "white" }}
                />
                <button
                  type="button"
                  onClick={addPostcode}
                  disabled={isAdding || !newPostcode.trim()}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Scan Button */}
              {watchedPostcodes.length > 0 && (
                <button
                  type="button"
                  onClick={scanWatched}
                  disabled={isScanning}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Scan All Watched
                    </>
                  )}
                </button>
              )}

              {/* Watched List */}
              <div className="space-y-2">
                {watchedPostcodes.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-slate-500 text-sm">
                      No postcodes watched yet
                    </p>
                    <p className="text-slate-600 text-xs">
                      Add a postcode to get alerts
                    </p>
                  </div>
                ) : (
                  watchedPostcodes.map((wp) => (
                    <div
                      key={wp.id}
                      className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          <span className="font-medium text-white">
                            {wp.postcode}
                          </span>
                          {wp.deals.length > 0 && (
                            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                              {wp.deals.length} deals
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removePostcode(wp.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Deals for this postcode */}
                      {wp.deals.length > 0 && (
                        <div className="space-y-1 mt-2">
                          {wp.deals.slice(0, 3).map((deal) => (
                            <div
                              key={deal.id}
                              onClick={() =>
                                onDealClick?.(deal.postcode, deal.address)
                              }
                              className="p-2 bg-slate-700/50 rounded cursor-pointer hover:bg-slate-700 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-300 truncate flex-1">
                                  {deal.address}
                                </span>
                                <span
                                  className={cn(
                                    "text-sm font-medium",
                                    deal.discount >= 20
                                      ? "text-amber-400"
                                      : "text-emerald-400",
                                  )}
                                >
                                  -{deal.discount}%
                                </span>
                              </div>
                            </div>
                          ))}
                          {wp.deals.length > 3 && (
                            <p className="text-xs text-slate-500 text-center">
                              +{wp.deals.length - 3} more deals
                            </p>
                          )}
                        </div>
                      )}

                      {wp.lastChecked && (
                        <p className="text-xs text-slate-600 mt-2">
                          Checked:{" "}
                          {new Date(wp.lastChecked).toLocaleString("he-IL")}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Regional Summary */}
        {regionalSummary.length > 0 && (
          <div className="p-3">
            <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Regional Averages
            </h3>
            <div className="space-y-1">
              {regionalSummary.slice(0, 6).map((region) => (
                <div
                  key={region.region}
                  className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-800/50 rounded transition-colors"
                >
                  <span className="text-sm text-slate-300">
                    {region.region}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white">
                      £{(region.averagePrice / 1000).toFixed(0)}K
                    </span>
                    <span
                      className={cn(
                        "text-xs",
                        region.yearChange >= 0
                          ? "text-emerald-400"
                          : "text-red-400",
                      )}
                    >
                      {region.yearChange >= 0 ? "+" : ""}
                      {region.yearChange.toFixed(1)}%
                    </span>
                    {region.dealsCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">
                        {region.dealsCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Data: HM Land Registry</span>
          <a
            href="https://landregistry.data.gov.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            Source <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

// Toggle button component for external use
export function RadarToggleButton({
  onClick,
  alertCount = 0,
}: {
  onClick: () => void;
  alertCount?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative p-3 bg-slate-800/90 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-cyan-400"
    >
      <Radar className="w-5 h-5" />
      {alertCount > 0 && (
        <>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {alertCount > 9 ? "9+" : alertCount}
          </span>
        </>
      )}
    </button>
  );
}
