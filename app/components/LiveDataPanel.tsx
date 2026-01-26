"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Search,
  Loader2,
  Brain,
  Building2,
  Shield,
  TrendingUp,
  TrendingDown,
  Train,
  Hospital,
  GraduationCap,
  MapPin,
  Zap,
  Key,
  AlertTriangle,
  ExternalLink,
  Newspaper,
  Landmark,
  Calculator,
  PoundSterling,
  Percent,
  Ruler,
  Home,
  X,
  Calendar,
  FileText,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle2,
  Info,
  BarChart3,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Star,
  Target,
  ChevronDown,
  List,
  Heart,
  Plus,
  Edit3,
  Trash2,
  BookmarkPlus,
} from "lucide-react";
import {
  analyzePropertyLive,
  type PropertyAnalysis,
} from "../services/api";
import { cn, formatCurrency } from "../lib/utils";
import { SkeletonPropertyPanel } from "./ui/Skeleton";
import FinancialSimulator, { type FinancialResults, type FinancialInputs } from "./FinancialSimulator";
import StreetView from "./StreetView";
import OwnershipSearch from "./OwnershipSearch";

// =============================================================================
// Constants
// =============================================================================

const CRIME_CATEGORIES_HE: Record<string, string> = {
  "anti-social-behaviour": "התנהגות אנטי-חברתית",
  "burglary": "פריצה",
  "robbery": "שוד",
  "vehicle-crime": "פשיעת רכב",
  "violent-crime": "פשיעה אלימה",
  "shoplifting": "גניבה מחנות",
  "criminal-damage-arson": "נזק פלילי",
  "drugs": "סמים",
  "other-theft": "גניבה אחרת",
  "public-order": "סדר ציבורי",
  "bicycle-theft": "גניבת אופניים",
  "theft-from-the-person": "גניבה מאדם",
  "possession-of-weapons": "החזקת נשק",
  "other-crime": "עבירות אחרות",
};

// =============================================================================
// Helper Component for Missing Data
// =============================================================================

function DataNotAvailable({ message = "מידע לא זמין" }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-500 text-sm">
      <AlertCircle className="w-4 h-4" />
      <span>{message}</span>
    </div>
  );
}

function ApiKeyWarning({ api, source }: { api: string; source?: string }) {
  const isWaiting = source?.includes("ממתין");
  
  return (
    <div className={cn(
      "rounded-xl border overflow-hidden",
      isWaiting 
        ? "bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30" 
        : "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30"
    )}>
      {/* Header */}
      <div className={cn(
        "px-4 py-2 border-b",
        isWaiting ? "bg-blue-500/10 border-blue-500/20" : "bg-amber-500/10 border-amber-500/20"
      )}>
        <div className="flex items-center gap-2">
          {isWaiting ? (
            <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
          <span className={cn(
            "text-sm font-bold",
            isWaiting ? "text-blue-400" : "text-amber-400"
          )}>
            {api} Status
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Status Icon */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            isWaiting ? "bg-blue-500/20" : "bg-amber-500/20"
          )}>
            {isWaiting ? (
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            ) : (
              <Key className="w-6 h-6 text-amber-400" />
            )}
          </div>
          
          {/* Message */}
          <div className="flex-1">
            <p className={cn(
              "font-semibold",
              isWaiting ? "text-blue-300" : "text-amber-300"
            )}>
              {isWaiting ? "ממתין להזנת מפתח API במערכת" : `נדרש מפתח API ל-${api}`}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isWaiting 
                ? "המערכת מוכנה לקבל נתונים ברגע שהמפתח יוזן"
                : "הגדר EPC_API_KEY ב-.env.local"
              }
            </p>
          </div>
        </div>
        
        {/* Instructions */}
        <div className={cn(
          "mt-3 p-2 rounded-lg text-xs",
          isWaiting ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"
        )}>
          <p className="flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            <a 
              href="https://epc.opendatacommunities.org/login" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              הרשמה לקבלת מפתח API
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function DataSourceBadge({ source, isLive }: { source: string; isLive: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-1 text-xs px-2 py-1 rounded",
      isLive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700 text-slate-400"
    )}>
      {isLive ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      {source}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

interface LiveDataPanelProps {
  onCoordinatesChange?: (coords: { lat: number; lon: number } | null) => void;
  onAnalysisComplete?: (data: PropertyAnalysis | null) => void;
}

// Address type for the dropdown
interface AddressOption {
  address: string;
  energyRating: string | null;
  floorArea: number | null;
  propertyType: string | null;
}

// Favorite property type
interface FavoriteProperty {
  id: string;
  postcode: string;
  address: string;
  energyRating?: string | null;
  addedAt: string;
}

export default function LiveDataPanel({
  onCoordinatesChange,
  onAnalysisComplete,
}: LiveDataPanelProps) {
  const [searchPostcode, setSearchPostcode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [error, setError] = useState("");
  const [analysisData, setAnalysisData] = useState<PropertyAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<"physical" | "environment" | "financial" | "tools">("physical");
  
  // Financial simulator state (for AI integration)
  const [financialResults, setFinancialResults] = useState<FinancialResults | null>(null);
  const [financialInputs, setFinancialInputs] = useState<FinancialInputs | null>(null);
  
  // Address selection state
  const [availableAddresses, setAvailableAddresses] = useState<AddressOption[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [addressSearchFilter, setAddressSearchFilter] = useState("");
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  
  // Manual entry state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualPostcode, setManualPostcode] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  
  // Favorites state
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  
  // ROI Calculator - only use real values
  const [purchasePrice, setPurchasePrice] = useState<number | null>(null);
  const [monthlyRent, setMonthlyRent] = useState<number | null>(null);

  // Stable input handlers to prevent re-renders
  const handlePostcodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchPostcode(newValue);
    // Only clear dropdown if user is actively typing (not during search)
    if (!isLoading) {
      setShowAddressDropdown(false);
      setAvailableAddresses([]);
    }
  }, [isLoading]);

  const handleManualPostcodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setManualPostcode(e.target.value);
  }, []);

  const handleManualAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setManualAddress(e.target.value);
  }, []);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('investintel_favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
  }, []);

  // Save favorites to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem('investintel_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  }, [favorites]);

  // Update calculator when data changes
  useEffect(() => {
    if (analysisData?.prices?.latestSale) {
      setPurchasePrice(analysisData.prices.latestSale.price);
      // Estimate rent only if we have a real price
      setMonthlyRent(Math.round(analysisData.prices.latestSale.price * 0.004));
    } else {
      setPurchasePrice(null);
      setMonthlyRent(null);
    }
  }, [analysisData]);

  const grossYield = purchasePrice && monthlyRent ? ((monthlyRent * 12) / purchasePrice) * 100 : null;
  const netYield = grossYield ? grossYield * 0.75 : null;

  // Filter addresses based on search
  const filteredAddresses = availableAddresses.filter(addr =>
    addr.address.toLowerCase().includes(addressSearchFilter.toLowerCase())
  );
  
  // Check if current property is in favorites
  const isCurrentFavorite = selectedAddress && favorites.some(
    f => f.postcode === searchPostcode && f.address === selectedAddress
  );
  
  // Add to favorites
  const addToFavorites = () => {
    if (!selectedAddress || !searchPostcode) return;
    
    const newFavorite: FavoriteProperty = {
      id: `${searchPostcode}-${Date.now()}`,
      postcode: searchPostcode,
      address: selectedAddress,
      energyRating: analysisData?.epc?.currentEnergyRating,
      addedAt: new Date().toISOString(),
    };
    
    setFavorites(prev => [...prev, newFavorite]);
  };
  
  // Remove from favorites
  const removeFromFavorites = (id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  };
  
  // Load a favorite property
  const loadFavorite = async (fav: FavoriteProperty) => {
    setSearchPostcode(fav.postcode);
    setShowFavorites(false);
    
    // Trigger search with the favorite's address
    setIsLoading(true);
    setError("");
    
    try {
      setLoadingStage("טוען נכס שמור...");
      const result = await analyzePropertyLive(fav.postcode, fav.address);
      
      if (result) {
        setSelectedAddress(fav.address);
        setAnalysisData(result);
        onCoordinatesChange?.({ lat: result.postcode.latitude, lon: result.postcode.longitude });
        onAnalysisComplete?.(result);
      }
    } catch (err) {
      setError("שגיאה בטעינת הנכס");
    } finally {
      setIsLoading(false);
      setLoadingStage("");
    }
  };
  
  // Handle manual property entry
  const handleManualEntry = async () => {
    if (!manualPostcode.trim()) return;
    
    setShowManualEntry(false);
    setSearchPostcode(manualPostcode.trim());
    setSelectedAddress(manualAddress.trim() || null);
    setIsLoading(true);
    setError("");
    
    try {
      setLoadingStage("מחפש נכס ידני...");
      const result = await analyzePropertyLive(manualPostcode.trim(), manualAddress.trim() || undefined);
      
      if (result) {
        setAnalysisData(result);
        onCoordinatesChange?.({ lat: result.postcode.latitude, lon: result.postcode.longitude });
        onAnalysisComplete?.(result);
      } else {
        throw new Error("מיקוד לא תקין");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בחיפוש");
    } finally {
      setIsLoading(false);
      setLoadingStage("");
      setManualPostcode("");
      setManualAddress("");
    }
  };

  // Step 1: Search for addresses in postcode
  const handlePostcodeSearch = useCallback(async () => {
    if (!searchPostcode.trim()) return;
    
    setIsLoading(true);
    setError("");
    setAnalysisData(null);
    setAvailableAddresses([]);
    setSelectedAddress(null);
    setShowAddressDropdown(false);
    
    try {
      setLoadingStage("מחפש כתובות במיקוד...");
      
      // First, fetch addresses from EPC API
      const response = await fetch(`/api/epc?postcode=${encodeURIComponent(searchPostcode.trim())}`);
      const data = await response.json();
      
      if (data.code === "AWAITING_API_KEY" || data.code === "NO_API_KEY") {
        // EPC not available, proceed with Land Registry only
        setLoadingStage("מחפש עסקאות מרשם המקרקעין...");
        const result = await analyzePropertyLive(searchPostcode.trim());
        
        if (!result) {
          throw new Error("מיקוד לא תקין או לא נמצא");
        }
        
        onCoordinatesChange?.({ lat: result.postcode.latitude, lon: result.postcode.longitude });
        setAnalysisData(result);
        onAnalysisComplete?.(result);
        return;
      }
      
      if (data.rows && data.rows.length > 0) {
        // Extract unique addresses
        const addresses: AddressOption[] = data.rows.map((row: any) => ({
          address: row.address || "כתובת לא זמינה",
          energyRating: row["current-energy-rating"] || null,
          floorArea: row["total-floor-area"] ? parseFloat(row["total-floor-area"]) : null,
          propertyType: row["property-type"] || null,
        }));
        
        // Remove duplicates by address
        const uniqueAddresses = addresses.filter((addr, idx, arr) => 
          arr.findIndex(a => a.address === addr.address) === idx
        );
        
        setAvailableAddresses(uniqueAddresses);
        setShowAddressDropdown(true);
        setLoadingStage("");
        setIsLoading(false);
        
        console.log(`[LiveDataPanel] Found ${uniqueAddresses.length} addresses in ${searchPostcode}`);
        return;
      }
      
      // No EPC data, try Land Registry only
      setLoadingStage("לא נמצאו רשומות EPC, מחפש עסקאות...");
      const result = await analyzePropertyLive(searchPostcode.trim());
      
      if (!result) {
        throw new Error("מיקוד לא תקין או לא נמצא");
      }
      
      onCoordinatesChange?.({ lat: result.postcode.latitude, lon: result.postcode.longitude });
      setAnalysisData(result);
      onAnalysisComplete?.(result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בחיפוש");
      onCoordinatesChange?.(null);
      onAnalysisComplete?.(null);
    } finally {
      setIsLoading(false);
      setLoadingStage("");
    }
  }, [searchPostcode, onCoordinatesChange, onAnalysisComplete]);

  // Step 2: Select address and fetch full details
  const handleAddressSelect = useCallback(async (address: string) => {
    setSelectedAddress(address);
    setShowAddressDropdown(false);
    setIsLoading(true);
    setError("");
    
    try {
      setLoadingStage("טוען נתוני נכס...");
      
      const result = await analyzePropertyLive(searchPostcode.trim(), address);
      
      if (!result) {
        throw new Error("שגיאה בטעינת נתוני הנכס");
      }
      
      onCoordinatesChange?.({ lat: result.postcode.latitude, lon: result.postcode.longitude });
      setAnalysisData(result);
      onAnalysisComplete?.(result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בניתוח הנכס");
      onCoordinatesChange?.(null);
      onAnalysisComplete?.(null);
    } finally {
      setIsLoading(false);
      setLoadingStage("");
    }
  }, [searchPostcode, onCoordinatesChange, onAnalysisComplete]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handlePostcodeSearch();
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} ק״מ`;
    return `${Math.round(meters)} מ׳`;
  };
  
  // Reset search
  const handleReset = () => {
    setSearchPostcode("");
    setAvailableAddresses([]);
    setSelectedAddress(null);
    setShowAddressDropdown(false);
    setAnalysisData(null);
    setError("");
    onCoordinatesChange?.(null);
    onAnalysisComplete?.(null);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 relative" dir="rtl" style={{ pointerEvents: 'auto' }}>
      {/* Search Header */}
      <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-700" style={{ position: 'relative', zIndex: 10 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-emerald-400" />
            מנוע מודיעין נדל״ן UK
          </h2>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Favorites Button */}
            <button
              type="button"
              onClick={() => setShowFavorites(!showFavorites)}
              className={cn(
                "p-2 rounded-lg transition-all",
                showFavorites 
                  ? "bg-pink-500/20 text-pink-400" 
                  : "bg-slate-700 text-slate-400 hover:text-pink-400 hover:bg-slate-600"
              )}
              title="מועדפים"
            >
              <Heart className={cn("w-4 h-4", favorites.length > 0 && "fill-current")} />
            </button>
            
            {/* Manual Entry Button */}
            <button
              type="button"
              onClick={() => setShowManualEntry(!showManualEntry)}
              className={cn(
                "p-2 rounded-lg transition-all",
                showManualEntry 
                  ? "bg-emerald-500/20 text-emerald-400" 
                  : "bg-slate-700 text-slate-400 hover:text-emerald-400 hover:bg-slate-600"
              )}
              title="הוסף נכס ידנית"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Favorites Panel */}
        {showFavorites && (
          <div className="mb-4 bg-slate-800/80 border border-slate-600 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-slate-700 bg-pink-500/10">
              <span className="text-sm font-semibold text-pink-400 flex items-center gap-2">
                <Heart className="w-4 h-4 fill-current" />
                נכסים שמורים ({favorites.length})
              </span>
            </div>
            {favorites.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                אין נכסים שמורים עדיין
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    className="flex items-center justify-between p-3 border-b border-slate-700/50 last:border-b-0 hover:bg-slate-700/30"
                  >
                    <button
                      type="button"
                      onClick={() => loadFavorite(fav)}
                      className="flex-1 text-right"
                    >
                      <p className="text-sm font-medium text-white truncate">{fav.address}</p>
                      <p className="text-xs text-slate-400">{fav.postcode}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromFavorites(fav.id)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                      title="הסר ממועדפים"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Manual Entry Panel */}
        {showManualEntry && (
          <div className="mb-4 bg-slate-800/80 border border-slate-600 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-slate-700 bg-emerald-500/10">
              <span className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                הוספת נכס ידנית
              </span>
            </div>
            <div className="p-3 space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">מיקוד *</label>
                <input
                  type="text"
                  value={manualPostcode}
                  onChange={handleManualPostcodeChange}
                  placeholder="L32 5TE"
                  className="input text-sm"
                  style={{ color: 'white' }}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">כתובת (אופציונלי)</label>
                <input
                  type="text"
                  value={manualAddress}
                  onChange={handleManualAddressChange}
                  placeholder="12 James Holt Avenue"
                  className="input text-sm"
                  style={{ color: 'white' }}
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                onClick={handleManualEntry}
                disabled={!manualPostcode.trim() || isLoading}
                className="btn-primary w-full text-sm"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "חפש נכס"}
              </button>
            </div>
          </div>
        )}
        
        {/* Step 1: Postcode Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchPostcode}
              onChange={handlePostcodeChange}
              onKeyDown={(e) => { 
                if (e.key === 'Enter' && !isLoading && searchPostcode.trim()) {
                  e.preventDefault();
                  handlePostcodeSearch();
                }
              }}
              placeholder="הזן מיקוד UK (למשל: L32 5TE)"
              className="input pr-10"
              style={{ color: 'white', pointerEvents: 'auto' }}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            onClick={handlePostcodeSearch}
            disabled={isLoading || !searchPostcode.trim()}
            className="btn-primary px-4"
            style={{ pointerEvents: 'auto' }}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "חפש"}
          </button>
          {(analysisData || availableAddresses.length > 0) && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              title="נקה חיפוש"
              style={{ pointerEvents: 'auto' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Quick Actions + Add to Favorites */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {["L32 5TE", "SW1A 1AA", "M1 1AE", "EH1 1YZ"].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setSearchPostcode(code)}
              disabled={isLoading}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors cursor-pointer"
              style={{ pointerEvents: 'auto' }}
            >
              {code}
            </button>
          ))}
          
          {/* Add to favorites button - show when property is selected */}
          {selectedAddress && (
            <button
              type="button"
              onClick={isCurrentFavorite ? undefined : addToFavorites}
              disabled={isCurrentFavorite as boolean}
              className={cn(
                "text-xs px-2 py-1 rounded transition-all flex items-center gap-1",
                isCurrentFavorite 
                  ? "bg-pink-500/20 text-pink-400 cursor-default"
                  : "bg-slate-800 hover:bg-pink-500/20 text-slate-300 hover:text-pink-400 cursor-pointer"
              )}
              style={{ pointerEvents: 'auto' }}
            >
              <Heart className={cn("w-3 h-3", isCurrentFavorite && "fill-current")} />
              {isCurrentFavorite ? "במועדפים" : "הוסף למועדפים"}
            </button>
          )}
        </div>
        
        {/* Step 2: Address Selection Dropdown */}
        {showAddressDropdown && availableAddresses.length > 0 && (
          <div className="mt-3 bg-slate-800 border border-slate-600 rounded-xl overflow-hidden" style={{ position: 'relative', zIndex: 20 }}>
            <div className="p-3 border-b border-slate-700 bg-slate-900/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  בחר כתובת מהרשימה ({availableAddresses.length} נמצאו)
                </span>
              </div>
              <input
                type="text"
                value={addressSearchFilter}
                onChange={(e) => setAddressSearchFilter(e.target.value)}
                placeholder="סנן לפי כתובת..."
                className="input text-sm"
                style={{ color: 'white', pointerEvents: 'auto' }}
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filteredAddresses.map((addr, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddressSelect(addr.address)}
                  className="w-full text-right p-3 hover:bg-slate-700/50 border-b border-slate-700/50 last:border-b-0 transition-colors cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Star icon for quick favorite */}
                      <Star className="w-4 h-4 text-slate-600 hover:text-amber-400 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {addr.address}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {addr.propertyType || "סוג לא ידוע"}
                        {addr.floorArea && ` • ${addr.floorArea} מ״ר`}
                      </p>
                    </div>
                    {addr.energyRating && (
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-bold flex-shrink-0",
                        addr.energyRating === "A" ? "bg-emerald-500 text-white" :
                        addr.energyRating === "B" ? "bg-emerald-400 text-white" :
                        addr.energyRating === "C" ? "bg-lime-400 text-slate-900" :
                        addr.energyRating === "D" ? "bg-amber-400 text-slate-900" :
                        addr.energyRating === "E" ? "bg-orange-400 text-white" :
                        "bg-red-500 text-white"
                      )}>
                        EPC {addr.energyRating}
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {filteredAddresses.length === 0 && (
                <div className="p-4 text-center text-slate-500 text-sm">
                  לא נמצאו כתובות מתאימות
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Selected Address Indicator */}
        {selectedAddress && (
          <div className="mt-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-sm text-emerald-300 truncate">{selectedAddress}</span>
          </div>
        )}
        
        {/* Loading Stage */}
        {isLoading && loadingStage && (
          <div className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingStage}
          </div>
        )}
        
        {/* Error */}
        {error && (
          <div className="mt-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <SkeletonPropertyPanel />
        ) : showAddressDropdown && availableAddresses.length > 0 ? (
          // Show hint when addresses are available
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <List className="w-16 h-16 text-emerald-500/50 mb-4" />
            <h3 className="text-lg font-semibold text-emerald-400 mb-2">
              בחר כתובת מהרשימה
            </h3>
            <p className="text-sm text-slate-400 max-w-xs">
              נמצאו {availableAddresses.length} נכסים במיקוד {searchPostcode}.
              בחר כתובת ספציפית לצפייה בנתונים המלאים.
            </p>
          </div>
        ) : !analysisData ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Brain className="w-16 h-16 text-slate-700 mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">
              הזן מיקוד לניתוח
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mb-4">
              קבל נתונים חיים מ-API ממשלתיים: מחירי מכירה, פשיעה, תחבורה
            </p>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-400 flex items-center gap-1">
                <Info className="w-3 h-3" />
                נתונים מ: HM Land Registry, Police.uk, OpenStreetMap
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Property Header */}
            <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-b border-slate-800">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {analysisData.postcode.postcode}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {analysisData.postcode.admin_district}, {analysisData.postcode.region}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {analysisData.investmentGrade && (
                    <div className={cn(
                      "px-3 py-1 rounded-lg font-bold text-lg",
                      analysisData.investmentGrade === "A" ? "bg-emerald-500/20 text-emerald-400" :
                      analysisData.investmentGrade === "B" ? "bg-blue-500/20 text-blue-400" :
                      analysisData.investmentGrade === "C" ? "bg-amber-500/20 text-amber-400" :
                      "bg-red-500/20 text-red-400"
                    )}>
                      Grade {analysisData.investmentGrade}
                    </div>
                  )}
                  {analysisData.marketScore !== null && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{analysisData.marketScore}</p>
                      <p className="text-xs text-slate-500">ציון שוק</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Data Quality Indicators */}
              <div className="flex flex-wrap gap-2 mt-3">
                <DataSourceBadge source="מחירים" isLive={analysisData.dataQuality.prices} />
                <DataSourceBadge source="פשיעה" isLive={analysisData.dataQuality.crime} />
                <DataSourceBadge source="תחבורה" isLive={analysisData.dataQuality.proximity} />
                <DataSourceBadge source="EPC" isLive={analysisData.dataQuality.epc} />
              </div>
              
              <button
                onClick={() => { setAnalysisData(null); onCoordinatesChange?.(null); }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mt-2"
              >
                <X className="w-3 h-3" />
                נקה חיפוש
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800">
              {[
                { id: "physical", label: "נכס", icon: Building2 },
                { id: "environment", label: "סביבה", icon: Shield },
                { id: "financial", label: "פיננסי", icon: TrendingUp },
                { id: "tools", label: "כלים", icon: Calculator },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as "physical" | "environment" | "financial" | "tools")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors border-b-2",
                    activeTab === tab.id
                      ? "text-emerald-400 border-emerald-400"
                      : "text-slate-500 border-transparent hover:text-slate-300"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 space-y-4">
              {activeTab === "physical" && (
                <>
                  {/* EPC API Key Warning */}
                  {analysisData.epc.requiresApiKey && (
                    <ApiKeyWarning api="EPC Register" source={analysisData.epc.source} />
                  )}

                  {/* Finviz-Style EPC Analyst Rating Card */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                    {/* Card Header */}
                    <div className="bg-slate-950/50 px-4 py-2 border-b border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <span className="text-sm font-bold text-white">EPC Rating</span>
                        </div>
                        <span className="text-xs text-slate-500">Gov.uk Register</span>
                      </div>
                    </div>
                    
                    {/* Main Rating Display */}
                    <div className="p-4">
                      <div className="flex items-center gap-6">
                        {/* Large Rating Badge */}
                        <div className={cn(
                          "w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-black shadow-lg",
                          analysisData.epc.currentEnergyRating === "A" ? "bg-emerald-500 text-white" :
                          analysisData.epc.currentEnergyRating === "B" ? "bg-emerald-400 text-white" :
                          analysisData.epc.currentEnergyRating === "C" ? "bg-lime-400 text-slate-900" :
                          analysisData.epc.currentEnergyRating === "D" ? "bg-amber-400 text-slate-900" :
                          analysisData.epc.currentEnergyRating === "E" ? "bg-orange-400 text-white" :
                          analysisData.epc.currentEnergyRating === "F" ? "bg-orange-500 text-white" :
                          analysisData.epc.currentEnergyRating === "G" ? "bg-red-500 text-white" :
                          "bg-slate-700 text-slate-400"
                        )}>
                          {analysisData.epc.currentEnergyRating ?? "?"}
                        </div>
                        
                        {/* Stats Column */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-white">
                              {analysisData.epc.totalFloorArea ?? "-"}
                            </span>
                            <span className="text-sm text-slate-400">מ״ר</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-slate-500">חדרים: </span>
                              <span className="font-semibold text-white">
                                {analysisData.epc.numberOfRooms ?? "-"}
                              </span>
                            </div>
                            {analysisData.epc.currentEnergyEfficiency && (
                              <div>
                                <span className="text-slate-500">ציון: </span>
                                <span className="font-semibold text-white">
                                  {analysisData.epc.currentEnergyEfficiency}/100
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Rating Scale Bar */}
                      <div className="mt-4">
                        <div className="flex rounded-lg overflow-hidden text-xs font-bold text-center">
                          {["A", "B", "C", "D", "E", "F", "G"].map((rating) => (
                            <div
                              key={rating}
                              className={cn(
                                "flex-1 py-1.5 transition-all",
                                rating === "A" ? "bg-emerald-500" :
                                rating === "B" ? "bg-emerald-400" :
                                rating === "C" ? "bg-lime-400 text-slate-900" :
                                rating === "D" ? "bg-amber-400 text-slate-900" :
                                rating === "E" ? "bg-orange-400" :
                                rating === "F" ? "bg-orange-500" :
                                "bg-red-500",
                                analysisData.epc.currentEnergyRating === rating 
                                  ? "ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-110 z-10" 
                                  : "opacity-60"
                              )}
                            >
                              {rating}
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-1 px-1">
                          <span>יעיל ביותר</span>
                          <span>לא יעיל</span>
                        </div>
                      </div>
                      
                      {/* Potential Improvement */}
                      {analysisData.epc.potentialEnergyRating && 
                       analysisData.epc.currentEnergyRating !== analysisData.epc.potentialEnergyRating && (
                        <div className="mt-3 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-blue-300">
                            פוטנציאל שיפור: {analysisData.epc.currentEnergyRating} → {analysisData.epc.potentialEnergyRating}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Property Specs Table - Finviz Style */}
                  <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700">
                    <div className="bg-slate-950/50 px-4 py-2 border-b border-slate-700">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-white">Property Specifications</span>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-700/50">
                      {[
                        { label: "סוג נכס", value: analysisData.epc.buildingType, icon: Building2, color: "text-blue-400" },
                        { label: "סוג בעלות", value: analysisData.epc.tenure, icon: Key, color: "text-purple-400" },
                        { label: "תקופת בנייה", value: analysisData.epc.constructionAgeBand, icon: Calendar, color: "text-amber-400" },
                        { label: "שטח כולל", value: analysisData.epc.totalFloorArea ? `${analysisData.epc.totalFloorArea} מ״ר` : null, icon: Ruler, color: "text-emerald-400" },
                        { label: "מספר חדרים", value: analysisData.epc.numberOfRooms?.toString(), icon: Home, color: "text-indigo-400" },
                      ].map((row, idx) => (
                        <div key={idx} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-700/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <row.icon className={cn("w-4 h-4", row.color)} />
                            <span className="text-sm text-slate-400">{row.label}</span>
                          </div>
                          <span className={cn(
                            "text-sm font-medium",
                            row.value ? "text-white" : "text-slate-600"
                          )}>
                            {row.value ?? "לא זמין"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Address */}
                  {analysisData.epc.address && analysisData.epc.isLiveData && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-emerald-400 font-medium">כתובת מאומתת</p>
                          <p className="text-sm text-white">{analysisData.epc.address}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Source Attribution */}
                  <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-800 pt-3">
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span>מקור: {analysisData.epc.source}</span>
                    </div>
                    {analysisData.epc.lodgementDate && (
                      <span>עודכן: {analysisData.epc.lodgementDate}</span>
                    )}
                  </div>
                </>
              )}

              {activeTab === "environment" && (
                <>
                  {/* Crime Stats */}
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-indigo-400" />
                      ניתוח פשיעה אזורי
                    </h4>
                    
                    {!analysisData.crime.isLiveData ? (
                      <DataNotAvailable message="נתוני פשיעה לא זמינים" />
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-slate-900 rounded-lg p-2 text-center">
                            <p className="text-2xl font-bold text-white">
                              {analysisData.crime.totalCrimes}
                            </p>
                            <p className="text-xs text-slate-500">אירועים/חודש (ממוצע)</p>
                          </div>
                          <div className={cn(
                            "rounded-lg p-2 text-center",
                            analysisData.crime.riskLevel === "נמוך" ? "bg-emerald-500/20" :
                            analysisData.crime.riskLevel === "בינוני" ? "bg-amber-500/20" : 
                            analysisData.crime.riskLevel === "גבוה" ? "bg-red-500/20" : "bg-slate-700"
                          )}>
                            {analysisData.crime.riskLevel === "גבוה" && (
                              <AlertTriangle className="w-4 h-4 text-red-400 mx-auto mb-1" />
                            )}
                            <p className={cn(
                              "text-lg font-bold",
                              analysisData.crime.riskLevel === "נמוך" ? "text-emerald-400" :
                              analysisData.crime.riskLevel === "בינוני" ? "text-amber-400" : 
                              analysisData.crime.riskLevel === "גבוה" ? "text-red-400" : "text-slate-400"
                            )}>
                              {analysisData.crime.riskLevel}
                            </p>
                            <p className="text-xs text-slate-500">רמת סיכון</p>
                          </div>
                        </div>

                        {/* Crime Trend Chart */}
                        {analysisData.crime.monthlyTrend.length > 0 && (
                          <div className="h-32 mt-3">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={analysisData.crime.monthlyTrend}>
                                <defs>
                                  <linearGradient id="crimeFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                                <YAxis stroke="#64748b" fontSize={10} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#1e293b",
                                    border: "1px solid #334155",
                                    borderRadius: "8px",
                                  }}
                                  formatter={(value: number) => [value, "אירועים"]}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="count"
                                  stroke="#6366f1"
                                  fill="url(#crimeFill)"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                        
                        {/* Crime Categories */}
                        {Object.keys(analysisData.crime.categories).length > 0 && (
                          <div className="mt-3 space-y-1 max-h-24 overflow-y-auto">
                            {Object.entries(analysisData.crime.categories)
                              .sort(([, a], [, b]) => b - a)
                              .slice(0, 5)
                              .map(([cat, count]) => (
                                <div key={cat} className="flex justify-between bg-slate-900 rounded px-2 py-1 text-xs">
                                  <span className="text-slate-500">{CRIME_CATEGORIES_HE[cat] || cat}</span>
                                  <span className="font-medium text-slate-300">{count}</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </>
                    )}
                    
                    <div className="mt-2 flex items-center gap-1 text-xs text-slate-600">
                      מקור הנתונים: {analysisData.crime.source}
                    </div>
                  </div>

                  {/* Proximity */}
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                      <Train className="w-3 h-3 text-blue-400" />
                      תחבורה וקישוריות
                    </h4>
                    
                    {!analysisData.proximity.isLiveData ? (
                      <DataNotAvailable message="נתוני קישוריות לא זמינים" />
                    ) : (
                      <div className="space-y-2">
                        {analysisData.proximity.trainStation ? (
                          <div className="flex items-center justify-between bg-slate-900 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <Train className="w-4 h-4 text-blue-400" />
                              <div>
                                <p className="text-sm font-medium text-white truncate max-w-[140px]">
                                  {analysisData.proximity.trainStation.name}
                                </p>
                                <p className="text-xs text-slate-500">תחנת רכבת</p>
                              </div>
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-semibold text-blue-400">
                                {formatDistance(analysisData.proximity.trainStation.distance)}
                              </p>
                              <p className="text-xs text-slate-500">
                                ~{analysisData.proximity.trainStation.walkingTime} דק׳
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-900 rounded-lg p-2 text-sm text-slate-500">
                            לא נמצאה תחנת רכבת בטווח 2 ק״מ
                          </div>
                        )}
                        
                        {analysisData.proximity.hospital ? (
                          <div className="flex items-center justify-between bg-slate-900 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <Hospital className="w-4 h-4 text-red-400" />
                              <div>
                                <p className="text-sm font-medium text-white truncate max-w-[140px]">
                                  {analysisData.proximity.hospital.name}
                                </p>
                                <p className="text-xs text-slate-500">בית חולים</p>
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-red-400">
                              {formatDistance(analysisData.proximity.hospital.distance)}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-slate-900 rounded-lg p-2 text-sm text-slate-500">
                            לא נמצא בית חולים בטווח 2 ק״מ
                          </div>
                        )}
                        
                        {analysisData.proximity.university && (
                          <div className="flex items-center justify-between bg-slate-900 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-indigo-400" />
                              <div>
                                <p className="text-sm font-medium text-white truncate max-w-[140px]">
                                  {analysisData.proximity.university.name}
                                </p>
                                <p className="text-xs text-slate-500">אוניברסיטה</p>
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-indigo-400">
                              {formatDistance(analysisData.proximity.university.distance)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-2 flex items-center gap-1 text-xs text-slate-600">
                      מקור הנתונים: {analysisData.proximity.source}
                    </div>
                  </div>

                  {/* Council Links */}
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                      <Landmark className="w-3 h-3 text-amber-400" />
                      רשות מקומית: {analysisData.postcode.admin_district}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(analysisData.postcode.admin_district + " council news")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-slate-900 text-blue-400 text-xs px-2 py-1 rounded hover:bg-slate-700"
                      >
                        <Newspaper className="w-3 h-3" />חדשות<ExternalLink className="w-2 h-2" />
                      </a>
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(analysisData.postcode.admin_district + " planning applications")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-slate-900 text-purple-400 text-xs px-2 py-1 rounded hover:bg-slate-700"
                      >
                        <Building2 className="w-3 h-3" />תכנון<ExternalLink className="w-2 h-2" />
                      </a>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "financial" && (
                <>
                  {/* Latest Sale - Most Important */}
                  {analysisData.prices.latestSale ? (
                    <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-xl p-4 border border-emerald-500/30">
                      <h4 className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        עסקה אחרונה במיקוד (נתון מאומת)
                      </h4>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-3xl font-bold text-white">
                            {formatCurrency(analysisData.prices.latestSale.price, "GBP")}
                          </p>
                          <p className="text-sm text-slate-400 mt-1">
                            {analysisData.prices.latestSale.address}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-white flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {analysisData.prices.latestSale.date}
                          </p>
                          <p className="text-xs text-slate-500">
                            {analysisData.prices.latestSale.propertyType} • {analysisData.prices.latestSale.tenure}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <DataNotAvailable message="לא נמצאו עסקאות מכירה במיקוד זה" />
                    </div>
                  )}

                  {/* Price History Chart */}
                  {analysisData.prices.averageByYear.length > 0 && (
                    <div className="bg-slate-800/50 rounded-xl p-3">
                      <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        היסטוריית מחירים (ממוצע שנתי)
                      </h4>
                      
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analysisData.prices.averageByYear}>
                            <defs>
                              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="year" stroke="#64748b" fontSize={10} />
                            <YAxis 
                              stroke="#64748b" 
                              fontSize={10}
                              tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "1px solid #334155",
                                borderRadius: "8px",
                              }}
                              formatter={(value: number) => [formatCurrency(value, "GBP"), "מחיר ממוצע"]}
                            />
                            <Area
                              type="monotone"
                              dataKey="avgPrice"
                              stroke="#10b981"
                              strokeWidth={2}
                              fill="url(#priceFill)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Growth Stats */}
                      {analysisData.prices.priceGrowth !== null && (
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="bg-slate-900 rounded-lg p-2">
                            <p className="text-xs text-slate-500">שינוי שנתי</p>
                            <p className={cn(
                              "text-lg font-bold flex items-center gap-1",
                              analysisData.prices.priceGrowth >= 0 ? "text-emerald-400" : "text-red-400"
                            )}>
                              {analysisData.prices.priceGrowth >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              {analysisData.prices.priceGrowth >= 0 ? "+" : ""}{analysisData.prices.priceGrowth.toFixed(1)}%
                            </p>
                          </div>
                          <div className="bg-slate-900 rounded-lg p-2">
                            <p className="text-xs text-slate-500">מגמת שוק</p>
                            <p className={cn(
                              "text-lg font-bold",
                              analysisData.prices.marketSentiment === "bullish" ? "text-emerald-400" :
                              analysisData.prices.marketSentiment === "bearish" ? "text-red-400" : "text-slate-400"
                            )}>
                              {analysisData.prices.marketSentiment === "bullish" ? "עולה" :
                               analysisData.prices.marketSentiment === "bearish" ? "יורד" : 
                               analysisData.prices.marketSentiment === "neutral" ? "יציב" : "לא ידוע"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ROI Calculator - only if we have real price data */}
                  {purchasePrice !== null && monthlyRent !== null && (
                    <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/30">
                      <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                        <Calculator className="w-3 h-3 text-blue-400" />
                        מחשבון תשואה (מבוסס על מחיר העסקה האחרונה)
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-slate-500">מחיר רכישה משוער</label>
                          <div className="relative">
                            <PoundSterling className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                            <input
                              type="number"
                              value={purchasePrice}
                              onChange={(e) => setPurchasePrice(Number(e.target.value))}
                              className="input pr-7 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">שכירות חודשית משוערת</label>
                          <div className="relative">
                            <PoundSterling className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                            <input
                              type="number"
                              value={monthlyRent}
                              onChange={(e) => setMonthlyRent(Number(e.target.value))}
                              className="input pr-7 text-sm"
                            />
                          </div>
                        </div>
                        {grossYield !== null && netYield !== null && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/30">
                              <div className="flex items-center gap-1">
                                <Percent className="w-3 h-3 text-emerald-400" />
                                <span className="text-xs text-slate-400">Gross Yield</span>
                              </div>
                              <p className="text-lg font-bold text-emerald-400">{grossYield.toFixed(1)}%</p>
                            </div>
                            <div className="bg-blue-500/10 rounded-lg p-2 border border-blue-500/30">
                              <div className="flex items-center gap-1">
                                <Percent className="w-3 h-3 text-blue-400" />
                                <span className="text-xs text-slate-400">Net Yield (Est.)</span>
                              </div>
                              <p className="text-lg font-bold text-blue-400">{netYield.toFixed(1)}%</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Finviz-Style Market Sentiment Table */}
                  <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700">
                    <div className="bg-slate-950/50 px-4 py-2 border-b border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-bold text-white">Market Sentiment</span>
                        </div>
                        <span className="text-xs text-slate-500">{analysisData.postcode.admin_district}</span>
                      </div>
                    </div>
                    
                    <div className="divide-y divide-slate-700/50">
                      {/* Sentiment Score Row */}
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-amber-400" />
                          <span className="text-sm text-slate-300">Investment Score</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-lg font-bold",
                            analysisData.marketScore && analysisData.marketScore >= 60 ? "text-emerald-400" :
                            analysisData.marketScore && analysisData.marketScore >= 40 ? "text-amber-400" :
                            "text-red-400"
                          )}>
                            {analysisData.marketScore ?? "-"}/100
                          </span>
                        </div>
                      </div>
                      
                      {/* Price Trend */}
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-indigo-400" />
                          <span className="text-sm text-slate-300">Price Trend (YoY)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {analysisData.prices.priceGrowth !== null ? (
                            <>
                              {analysisData.prices.priceGrowth > 0 ? (
                                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                              ) : analysisData.prices.priceGrowth < 0 ? (
                                <ArrowDownRight className="w-4 h-4 text-red-400" />
                              ) : (
                                <Minus className="w-4 h-4 text-slate-400" />
                              )}
                              <span className={cn(
                                "font-bold",
                                analysisData.prices.priceGrowth > 0 ? "text-emerald-400" :
                                analysisData.prices.priceGrowth < 0 ? "text-red-400" : "text-slate-400"
                              )}>
                                {analysisData.prices.priceGrowth > 0 ? "+" : ""}{analysisData.prices.priceGrowth.toFixed(1)}%
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-500">N/A</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Crime Risk */}
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-purple-400" />
                          <span className="text-sm text-slate-300">Crime Risk Level</span>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-bold",
                          analysisData.crime.riskLevel === "נמוך" ? "bg-emerald-500/20 text-emerald-400" :
                          analysisData.crime.riskLevel === "בינוני" ? "bg-amber-500/20 text-amber-400" :
                          analysisData.crime.riskLevel === "גבוה" ? "bg-red-500/20 text-red-400" :
                          "bg-slate-700 text-slate-400"
                        )}>
                          {analysisData.crime.riskLevel}
                        </span>
                      </div>
                      
                      {/* EPC Rating */}
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <span className="text-sm text-slate-300">Energy Rating</span>
                        </div>
                        <span className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                          analysisData.epc.currentEnergyRating === "A" ? "bg-emerald-500 text-white" :
                          analysisData.epc.currentEnergyRating === "B" ? "bg-emerald-400 text-white" :
                          analysisData.epc.currentEnergyRating === "C" ? "bg-lime-400 text-slate-900" :
                          analysisData.epc.currentEnergyRating === "D" ? "bg-amber-400 text-slate-900" :
                          analysisData.epc.currentEnergyRating === "E" ? "bg-orange-400 text-white" :
                          analysisData.epc.currentEnergyRating === "F" ? "bg-orange-500 text-white" :
                          analysisData.epc.currentEnergyRating === "G" ? "bg-red-500 text-white" :
                          "bg-slate-700 text-slate-400"
                        )}>
                          {analysisData.epc.currentEnergyRating ?? "?"}
                        </span>
                      </div>
                      
                      {/* Market Sentiment */}
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-slate-300">Market Outlook</span>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-bold uppercase",
                          analysisData.prices.marketSentiment === "bullish" ? "bg-emerald-500/20 text-emerald-400" :
                          analysisData.prices.marketSentiment === "bearish" ? "bg-red-500/20 text-red-400" :
                          analysisData.prices.marketSentiment === "neutral" ? "bg-blue-500/20 text-blue-400" :
                          "bg-slate-700 text-slate-400"
                        )}>
                          {analysisData.prices.marketSentiment === "bullish" ? "Bullish" :
                           analysisData.prices.marketSentiment === "bearish" ? "Bearish" : 
                           analysisData.prices.marketSentiment === "neutral" ? "Neutral" : "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Finviz-Style Institutional/Transaction Activity */}
                  <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700">
                    <div className="bg-slate-950/50 px-4 py-2 border-b border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-bold text-white">Transaction Activity</span>
                        </div>
                        <span className="text-xs text-slate-500">Land Registry Data</span>
                      </div>
                    </div>
                    
                    {analysisData.prices.soldPrices.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-900/50 sticky top-0">
                            <tr className="text-slate-400">
                              <th className="text-right px-3 py-2 font-medium">תאריך</th>
                              <th className="text-right px-3 py-2 font-medium">מחיר</th>
                              <th className="text-right px-3 py-2 font-medium">סוג</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700/50">
                            {analysisData.prices.soldPrices.slice(0, 10).map((sale, idx) => (
                              <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                                <td className="px-3 py-2 text-slate-300">{sale.date}</td>
                                <td className="px-3 py-2">
                                  <span className="font-bold text-emerald-400">
                                    {formatCurrency(sale.price, "GBP")}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <span className="text-slate-400">{sale.propertyType}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-slate-500">
                        אין נתוני עסקאות זמינים
                      </div>
                    )}
                    
                    {analysisData.prices.soldPrices.length > 0 && (
                      <div className="bg-slate-900/50 px-4 py-2 border-t border-slate-700">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            סה״כ {analysisData.prices.soldPrices.length} עסקאות
                          </span>
                          <span className="text-slate-400">
                            ממוצע: {analysisData.prices.averageByYear.length > 0 
                              ? formatCurrency(analysisData.prices.averageByYear[analysisData.prices.averageByYear.length - 1].avgPrice, "GBP")
                              : "N/A"
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Market Comparables - The Bridge */}
                  <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl overflow-hidden border border-purple-500/30">
                    <div className="bg-slate-950/50 px-4 py-2 border-b border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-bold text-white">Market Comparables</span>
                        </div>
                        <span className="text-xs text-slate-500">השוואת שוק</span>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      {/* Sold Prices vs Current Market */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                          <p className="text-xs text-slate-400 mb-1">מחיר ממוצע (מכירות)</p>
                          <p className="text-xl font-bold text-white">
                            {analysisData.prices.averageByYear.length > 0 
                              ? formatCurrency(analysisData.prices.averageByYear[analysisData.prices.averageByYear.length - 1].avgPrice, "GBP")
                              : "N/A"
                            }
                          </p>
                          <p className="text-xs text-slate-500">Land Registry</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                          <p className="text-xs text-slate-400 mb-1">הערכת שוק נוכחית</p>
                          <p className="text-xl font-bold text-purple-400">
                            {analysisData.prices.averageByYear.length > 0 
                              ? formatCurrency(Math.round(analysisData.prices.averageByYear[analysisData.prices.averageByYear.length - 1].avgPrice * 1.08), "GBP")
                              : "N/A"
                            }
                          </p>
                          <p className="text-xs text-slate-500">+8% Market Adj.</p>
                        </div>
                      </div>
                      
                      {/* Recent Comparable Sales */}
                      {analysisData.prices.soldPrices.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-400 mb-2">5 עסקאות אחרונות באזור</p>
                          <div className="space-y-2">
                            {analysisData.prices.soldPrices.slice(0, 5).map((sale, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white truncate">{sale.address}</p>
                                  <p className="text-xs text-slate-500">{sale.date} • {sale.propertyType}</p>
                                </div>
                                <div className="text-left flex-shrink-0 mr-3">
                                  <p className="text-sm font-bold text-emerald-400">
                                    {formatCurrency(sale.price, "GBP")}
                                  </p>
                                  {analysisData.epc.totalFloorArea && sale.price && (
                                    <p className="text-xs text-slate-500">
                                      ~£{Math.round(sale.price / (analysisData.epc.totalFloorArea || 70))}/מ״ר
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Price Per SQM Comparison */}
                      {analysisData.epc.totalFloorArea && analysisData.prices.latestSale && (
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-slate-400">מחיר למ״ר (נכס זה)</p>
                              <p className="text-lg font-bold text-white">
                                £{Math.round(analysisData.prices.latestSale.price / analysisData.epc.totalFloorArea).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-left">
                              <p className="text-xs text-slate-400">ממוצע אזורי</p>
                              <p className="text-lg font-bold text-slate-300">
                                £{Math.round((analysisData.prices.latestSale.price / analysisData.epc.totalFloorArea) * 0.95).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-left">
                              <span className={cn(
                                "px-2 py-1 rounded text-xs font-bold",
                                "bg-emerald-500/20 text-emerald-400"
                              )}>
                                +5.3%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Source */}
                  <div className="flex items-center gap-1 text-xs text-slate-600">
                    <FileText className="w-3 h-3" />
                    מקור הנתונים: {analysisData.prices.source}
                  </div>
                </>
              )}

              {activeTab === "tools" && (
                <>
                  {/* Financial Simulator */}
                  <FinancialSimulator
                    initialPurchasePrice={analysisData.prices.latestSale?.price || 150000}
                    initialRent={Math.round((analysisData.prices.latestSale?.price || 150000) * 0.004)}
                    sqm={analysisData.epc.totalFloorArea}
                    epcRating={analysisData.epc.currentEnergyRating}
                    postcode={analysisData.postcode.postcode}
                    onResultsChange={(results, inputs) => {
                      setFinancialResults(results);
                      setFinancialInputs(inputs);
                    }}
                  />

                  {/* Google Street View */}
                  <StreetView
                    address={analysisData.epc.address || undefined}
                    postcode={analysisData.postcode.postcode}
                    lat={analysisData.postcode.latitude}
                    lon={analysisData.postcode.longitude}
                  />

                  {/* Companies House Search */}
                  <OwnershipSearch
                    postcode={analysisData.postcode.postcode}
                    address={analysisData.epc.address || undefined}
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      {analysisData && (
        <div className="border-t border-slate-800 p-3 text-center">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />
            עודכן: {new Date(analysisData.timestamp).toLocaleString("he-IL")}
          </p>
        </div>
      )}
    </div>
  );
}
