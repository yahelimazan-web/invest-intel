"use client";

import { useState } from "react";
import {
  X,
  Building2,
  Shield,
  TrendingUp,
  Home,
  Ruler,
  Zap,
  Key,
  Car,
  Trees,
  Square,
  Train,
  Hospital,
  GraduationCap,
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Newspaper,
  Landmark,
  Calculator,
  PoundSterling,
  Percent,
  MapPin,
  Calendar,
  BarChart3,
  Info,
  School,
} from "lucide-react";
import type { PropertyIntelligence } from "../lib/ukPropertyEngine";

/** Extended market shape for UI (some fields may come from other sources) */
type MarketWithExtras = PropertyIntelligence["market"] & {
  avgRent?: number | null;
  avgPricePerSqm?: number | null;
  councilTaxAnnual?: number | null;
  councilTaxBand?: string | null;
  lastSalePrice?: number | null;
  lastSaleDate?: string | null;
  rentYield?: number | null;
};

interface PropertyIntelligencePanelProps {
  data: PropertyIntelligence;
  onClose: () => void;
}

type TabType = "physical" | "environment" | "financial";

const TABS: { id: TabType; label: string; icon: typeof Building2 }[] = [
  { id: "physical", label: "נתוני נכס", icon: Building2 },
  { id: "environment", label: "ניתוח סביבתי", icon: Shield },
  { id: "financial", label: "פיננסים", icon: TrendingUp },
];

const CRIME_CATEGORIES_HE: Record<string, string> = {
  "anti-social-behaviour": "התנהגות אנטי-חברתית",
  "burglary": "פריצה",
  "robbery": "שוד",
  "vehicle-crime": "פשיעת רכב",
  "violent-crime": "פשיעה אלימה",
  "shoplifting": "גניבה מחנות",
  "criminal-damage-arson": "נזק פלילי/הצתה",
  "drugs": "סמים",
  "other-theft": "גניבה אחרת",
  "public-order": "הפרת סדר ציבורי",
  "possession-of-weapons": "החזקת נשק",
  "theft-from-the-person": "גניבה מאדם",
  "bicycle-theft": "גניבת אופניים",
  "other-crime": "פשיעה אחרת",
};

export default function PropertyIntelligencePanel({
  data,
  onClose,
}: PropertyIntelligencePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("physical");
  const market = data.market as MarketWithExtras;

  // ROI Calculator state
  const [purchasePrice, setPurchasePrice] = useState(market.avgSoldPrice ?? 0);
  const [monthlyRent, setMonthlyRent] = useState(market.avgRent ?? 1000);

  const formatCurrency = (amount: number) => `£${amount.toLocaleString()}`;
  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} ק״מ`;
    return `${Math.round(meters)} מ׳`;
  };

  // Calculate ROI
  const annualRent = monthlyRent * 12;
  const grossYield = purchasePrice > 0 ? (annualRent / purchasePrice) * 100 : 0;
  const annualCosts = (market.councilTaxAnnual ?? 0) * 0.1 + annualRent * 0.15; // Est. costs
  const netYield = purchasePrice > 0 ? ((annualRent - annualCosts) / purchasePrice) * 100 : 0;

  const renderPhysicalTab = () => (
    <div className="space-y-5">
      {/* Property Header */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold">{data.physical.address}</h3>
            <p className="text-blue-100 text-sm">{data.postcode}</p>
          </div>
          {typeof data.dataQuality === "object" && data.dataQuality && Object.values(data.dataQuality).every(Boolean) && (
            <span className="flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Gold Data
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-blue-100">
          <span>{data.physical.propertyType}</span>
          {data.physical.builtYear && (
            <>
              <span>•</span>
              <span>נבנה: {data.physical.builtYear}</span>
            </>
          )}
        </div>
      </div>

      {/* Key Specs Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
          <Ruler className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.physical.sqm}</p>
          <p className="text-xs text-gray-500">מ״ר</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
          <Home className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.physical.rooms}</p>
          <p className="text-xs text-gray-500">חדרים</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
          <Zap className="w-5 h-5 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.physical.epcRating}</p>
          <p className="text-xs text-gray-500">EPC ({data.physical.epcScore})</p>
        </div>
      </div>

      {/* Tenure & Features */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Key className="w-4 h-4 text-gray-500" />
          בעלות ומאפיינים
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">סוג בעלות</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {data.physical.tenure}
            </span>
          </div>
          {(data.physical as Record<string, unknown>).parking !== undefined && (
            <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-3">
              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Car className="w-4 h-4" />
                חניה
              </span>
              <span className={`text-sm font-semibold ${(data.physical as Record<string, unknown>).parking ? "text-emerald-600" : "text-gray-400"}`}>
                {(data.physical as Record<string, unknown>).parking ? "כן" : "לא"}
              </span>
            </div>
          )}
          {(data.physical as Record<string, unknown>).balcony !== undefined && (
            <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-3">
              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Square className="w-4 h-4" />
                מרפסת
              </span>
              <span className={`text-sm font-semibold ${(data.physical as Record<string, unknown>).balcony ? "text-emerald-600" : "text-gray-400"}`}>
                {(data.physical as Record<string, unknown>).balcony ? "כן" : "לא"}
              </span>
            </div>
          )}
          {(data.physical as Record<string, unknown>).garden !== undefined && (
            <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-3">
              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Trees className="w-4 h-4" />
                גינה
              </span>
              <span className={`text-sm font-semibold ${(data.physical as Record<string, unknown>).garden ? "text-emerald-600" : "text-gray-400"}`}>
                {(data.physical as Record<string, unknown>).garden ? "כן" : "לא"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* EPC Details */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          יעילות אנרגטית
        </h4>
        <div className="relative h-6 bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 h-full w-1 bg-white border-2 border-gray-800"
            style={{ left: `${data.physical.epcScore ?? 0}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>A (יעיל)</span>
          <span>G (לא יעיל)</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {data.physical.epcRating != null && data.physical.epcRating <= "E" ? "✓ עומד בדרישות השכרה" : "⚠️ נדרש שדרוג ל-EPC E או טוב יותר להשכרה"}
        </p>
      </div>
    </div>
  );

  const renderEnvironmentTab = () => (
    <div className="space-y-5">
      {/* Crime Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-500" />
          נתוני פשיעה
          <span className="text-xs font-normal text-gray-500 mr-auto">
            {data.crime.lastUpdated}
          </span>
        </h4>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {data.crime.totalCrimes}
            </p>
            <p className="text-xs text-gray-500">אירועים בחודש</p>
          </div>
          <div className={`rounded-lg p-3 ${
            data.crime.riskLevel === "נמוך" ? "bg-emerald-100 dark:bg-emerald-900/30" :
            data.crime.riskLevel === "בינוני" ? "bg-amber-100 dark:bg-amber-900/30" :
            "bg-red-100 dark:bg-red-900/30"
          }`}>
            <div className="flex items-center gap-2">
              {data.crime.riskLevel === "גבוה" && <AlertTriangle className="w-5 h-5 text-red-600" />}
              <p className={`text-lg font-bold ${
                data.crime.riskLevel === "נמוך" ? "text-emerald-700" :
                data.crime.riskLevel === "בינוני" ? "text-amber-700" :
                "text-red-700"
              }`}>
                {data.crime.riskLevel}
              </p>
            </div>
            <p className="text-xs text-gray-600">רמת סיכון</p>
          </div>
        </div>

        {/* Crime Categories */}
        {Object.keys(data.crime.categories).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium">סוגי פשיעה עיקריים:</p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {Object.entries(data.crime.categories)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {CRIME_CATEGORIES_HE[cat] || cat}
                    </span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Proximity / Transport */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Train className="w-4 h-4 text-blue-500" />
          תחבורה וקישוריות
        </h4>
        
        <div className="space-y-2">
          {data.proximity.trainStation && (
            <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Train className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {data.proximity.trainStation.name}
                  </p>
                  <p className="text-xs text-gray-500">תחנת רכבת</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-blue-600">
                  {formatDistance(data.proximity.trainStation.distance)}
                </p>
                <p className="text-xs text-gray-500">
                  ~{data.proximity.trainStation.walkingTime} דק׳ הליכה
                </p>
              </div>
            </div>
          )}
          
          {data.proximity.metro && (
            <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {data.proximity.metro.name}
                  </p>
                  <p className="text-xs text-gray-500">מטרו/תחתית</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-purple-600">
                {formatDistance(data.proximity.metro.distance)}
              </p>
            </div>
          )}
          
          {data.proximity.hospital && (
            <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Hospital className="w-4 h-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {data.proximity.hospital.name}
                  </p>
                  <p className="text-xs text-gray-500">בית חולים</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-red-600">
                {formatDistance(data.proximity.hospital.distance)}
              </p>
            </div>
          )}
          
          {data.proximity.university && (
            <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {data.proximity.university.name}
                  </p>
                  <p className="text-xs text-gray-500">אוניברסיטה</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-indigo-600">
                {formatDistance(data.proximity.university.distance)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Schools */}
      {data.proximity.schools.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <School className="w-4 h-4 text-green-500" />
            בתי ספר באזור
          </h4>
          <div className="space-y-2">
            {data.proximity.schools.map((school, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-2">
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                  {school.name}
                </span>
                <span className="text-xs text-gray-500">{formatDistance(school.distance)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Council Info */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Landmark className="w-4 h-4 text-amber-500" />
          רשות מקומית
        </h4>
        <p className="text-base font-medium text-gray-900 dark:text-white mb-3">
          {data.council.name}
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={data.council.newsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Newspaper className="w-3 h-3" />
            חדשות
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={data.council.planningUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium px-3 py-2 rounded-lg hover:bg-purple-200 transition-colors"
          >
            <Building2 className="w-3 h-3" />
            תכנון
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={(data.council as { economicUrl?: string }).economicUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium px-3 py-2 rounded-lg hover:bg-emerald-200 transition-colors"
          >
            <TrendingUp className="w-3 h-3" />
            כלכלה
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );

  const renderFinancialTab = () => (
    <div className="space-y-5">
      {/* Market Summary */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-emerald-100 text-sm">מחיר ממוצע באזור</p>
            <p className="text-3xl font-bold">{formatCurrency(market.avgSoldPrice ?? 0)}</p>
          </div>
          <div className={`flex items-center gap-1 ${(market.priceChange12m ?? 0) >= 0 ? "text-emerald-200" : "text-red-200"}`}>
            <TrendingUp className={`w-4 h-4 ${(market.priceChange12m ?? 0) < 0 ? "rotate-180" : ""}`} />
            <span className="text-sm font-medium">{market.priceChange12m ?? 0}%</span>
            <span className="text-xs opacity-75">12 חודשים</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-emerald-100 text-xs">מחיר למ״ר</p>
            <p className="text-lg font-semibold">{formatCurrency(market.avgPricePerSqm ?? 0)}</p>
          </div>
          <div>
            <p className="text-emerald-100 text-xs">תשואה משוערת</p>
            <p className="text-lg font-semibold">{market.rentYield ?? 0}%</p>
          </div>
        </div>
      </div>

      {/* Last Sale (if available) */}
      {market.lastSalePrice && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            מכירה אחרונה
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-500">מחיר</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(market.lastSalePrice)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-500">תאריך</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {new Date(market.lastSaleDate!).toLocaleDateString("he-IL")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ROI Calculator */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-600" />
          מחשבון תשואה
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">מחיר רכישה</label>
            <div className="relative">
              <PoundSterling className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                className="w-full pr-9 pl-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">שכירות חודשית</label>
            <div className="relative">
              <PoundSterling className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                className="w-full pr-9 pl-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-emerald-200 dark:border-emerald-700">
              <div className="flex items-center gap-1 mb-1">
                <Percent className="w-3 h-3 text-emerald-600" />
                <span className="text-xs text-gray-500">Gross Yield</span>
              </div>
              <p className="text-xl font-bold text-emerald-600">{grossYield.toFixed(1)}%</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-1 mb-1">
                <Percent className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-gray-500">Net Yield</span>
              </div>
              <p className="text-xl font-bold text-blue-600">{netYield.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Council Tax */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Landmark className="w-4 h-4 text-amber-500" />
          Council Tax
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-500">Band</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {market.councilTaxBand ?? "—"}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-500">עלות שנתית</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(market.councilTaxAnnual ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Average Rent */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-500" />
          שכירות באזור
        </h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(market.avgRent ?? 0)}
            </p>
            <p className="text-xs text-gray-500">ממוצע חודשי</p>
          </div>
          <div className="text-left">
            <p className="text-lg font-semibold text-purple-600">
              {formatCurrency((market.avgRent ?? 0) * 12)}
            </p>
            <p className="text-xs text-gray-500">שנתי</p>
          </div>
        </div>
      </div>

      {/* Data Source */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Info className="w-3 h-3" />
        <span>מקור: {market.source}</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-br from-slate-800 to-slate-900 text-white p-4 z-10">
        <div className="flex items-start justify-between">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1 mr-3">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">
                {(data.mode as string) === "existing" ? "נכס קיים" : "ניתוח פוטנציאלי"}
              </span>
            </div>
            <h2 className="text-lg font-bold">{data.postcode}</h2>
            <p className="text-sm text-slate-400">{data.council.name}, {data.council.region}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 bg-slate-700/50 rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-600/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "physical" && renderPhysicalTab()}
        {activeTab === "environment" && renderEnvironmentTab()}
        {activeTab === "financial" && renderFinancialTab()}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-3 text-center">
        <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" />
          עודכן: {new Date(data.timestamp).toLocaleString("he-IL")}
          {typeof data.dataQuality === "object" && data.dataQuality && Object.values(data.dataQuality).every(Boolean) && (
            <span className="mr-2 bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-medium">
              Gold Data
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
