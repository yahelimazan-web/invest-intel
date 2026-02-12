"use client";

import { useState } from "react";
import {
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
  ExternalLink,
  Newspaper,
  Landmark,
  Calculator,
  PoundSterling,
  Percent,
  MapPin,
  Search,
  Brain,
  Loader2,
  Info,
} from "lucide-react";
import type { PropertyIntelligence } from "../lib/ukPropertyEngine";

interface DataPanelProps {
  intelligenceData: PropertyIntelligence | null;
  isSearching: boolean;
  searchPostcode: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
}

const CRIME_CATEGORIES_HE: Record<string, string> = {
  "anti-social-behaviour": "התנהגות אנטי-חברתית",
  burglary: "פריצה",
  robbery: "שוד",
  "vehicle-crime": "פשיעת רכב",
  "violent-crime": "פשיעה אלימה",
  shoplifting: "גניבה מחנות",
  "criminal-damage-arson": "נזק פלילי",
  drugs: "סמים",
  "other-theft": "גניבה אחרת",
  "public-order": "סדר ציבורי",
};

export default function DataPanel({
  intelligenceData,
  isSearching,
  searchPostcode,
  onSearchChange,
  onSearch,
}: DataPanelProps) {
  const [activeSection, setActiveSection] = useState<
    "physical" | "environment" | "financial"
  >("physical");

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSearch();
  };

  const formatCurrency = (amount: number) => `£${amount.toLocaleString()}`;
  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} ק״מ`;
    return `${Math.round(meters)} מ׳`;
  };

  // ROI Calculator
  const [purchasePrice, setPurchasePrice] = useState(
    intelligenceData?.market.avgSoldPrice || 200000,
  );
  const [monthlyRent, setMonthlyRent] = useState(1000);

  const grossYield =
    purchasePrice > 0 ? ((monthlyRent * 12) / purchasePrice) * 100 : 0;
  const netYield = grossYield * 0.75; // ~25% costs

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900" dir="rtl">
      {/* Search Header */}
      <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-400" />
          מנוע מודיעין נדל״ן UK
        </h2>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchPostcode}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="הזן מיקוד (L32 5TE)"
              className="w-full pr-10 pl-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={onSearch}
            disabled={isSearching || !searchPostcode.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg text-white font-medium transition-colors"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "נתח"}
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          {["L32 5TE", "SW1A 1AA", "M1 1AE"].map((code) => (
            <button
              key={code}
              onClick={() => {
                onSearchChange(code);
                setTimeout(onSearch, 50);
              }}
              className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded transition-colors"
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!intelligenceData ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Brain className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
              הזן מיקוד לניתוח
            </h3>
            <p className="text-sm text-slate-500 max-w-xs">
              חפש כל מיקוד UK לקבלת דו״ח מודיעין מקיף כולל נתוני פשיעה, תחבורה
              ומחירי שוק
            </p>
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                💡 נסה L32 5TE לנתוני Gold Data מאומתים
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Property Header */}
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-blue-100 text-xs mb-1">
                    {(intelligenceData.mode as string) === "existing"
                      ? "נכס קיים"
                      : "ניתוח פוטנציאלי"}
                  </p>
                  <h3 className="text-lg font-bold">
                    {intelligenceData.physical.address}
                  </h3>
                  <p className="text-sm text-blue-100">
                    {intelligenceData.council.name},{" "}
                    {intelligenceData.council.region}
                  </p>
                </div>
                {typeof intelligenceData.dataQuality === "object" &&
                  Object.values(intelligenceData.dataQuality).every(
                    Boolean,
                  ) && (
                    <span className="flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Gold
                    </span>
                  )}
              </div>
            </div>

            {/* Section Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              {[
                { id: "physical", label: "נתוני נכס", icon: Building2 },
                { id: "environment", label: "סביבה", icon: Shield },
                { id: "financial", label: "פיננסים", icon: TrendingUp },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                    activeSection === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Section Content */}
            <div className="p-4 space-y-4">
              {activeSection === "physical" && (
                <>
                  {/* Key Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                      <Ruler className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {intelligenceData.physical.sqm}
                      </p>
                      <p className="text-xs text-gray-500">מ״ר</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                      <Home className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {intelligenceData.physical.rooms}
                      </p>
                      <p className="text-xs text-gray-500">חדרים</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                      <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {intelligenceData.physical.epcRating}
                      </p>
                      <p className="text-xs text-gray-500">EPC</p>
                    </div>
                  </div>

                  {/* Tenure & Features */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      בעלות ומאפיינים
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-2 text-sm">
                        <span className="text-gray-500">סוג בעלות</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {intelligenceData.physical.tenure}
                        </span>
                      </div>
                      {(intelligenceData.physical as Record<string, unknown>)
                        .parking !== undefined && (
                        <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-2 text-sm">
                          <span className="text-gray-500 flex items-center gap-1">
                            <Car className="w-3 h-3" />
                            חניה
                          </span>
                          <span
                            className={
                              (
                                intelligenceData.physical as Record<
                                  string,
                                  unknown
                                >
                              ).parking
                                ? "text-emerald-600 font-medium"
                                : "text-gray-400"
                            }
                          >
                            {(
                              intelligenceData.physical as Record<
                                string,
                                unknown
                              >
                            ).parking
                              ? "כן"
                              : "לא"}
                          </span>
                        </div>
                      )}
                      {(intelligenceData.physical as Record<string, unknown>)
                        .balcony !== undefined && (
                        <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-2 text-sm">
                          <span className="text-gray-500 flex items-center gap-1">
                            <Square className="w-3 h-3" />
                            מרפסת
                          </span>
                          <span
                            className={
                              (
                                intelligenceData.physical as Record<
                                  string,
                                  unknown
                                >
                              ).balcony
                                ? "text-emerald-600 font-medium"
                                : "text-gray-400"
                            }
                          >
                            {(
                              intelligenceData.physical as Record<
                                string,
                                unknown
                              >
                            ).balcony
                              ? "כן"
                              : "לא"}
                          </span>
                        </div>
                      )}
                      {(intelligenceData.physical as Record<string, unknown>)
                        .garden !== undefined && (
                        <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-2 text-sm">
                          <span className="text-gray-500 flex items-center gap-1">
                            <Trees className="w-3 h-3" />
                            גינה
                          </span>
                          <span
                            className={
                              (
                                intelligenceData.physical as Record<
                                  string,
                                  unknown
                                >
                              ).garden
                                ? "text-emerald-600 font-medium"
                                : "text-gray-400"
                            }
                          >
                            {(
                              intelligenceData.physical as Record<
                                string,
                                unknown
                              >
                            ).garden
                              ? "כן"
                              : "לא"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* EPC Visual */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      יעילות אנרגטית
                    </h4>
                    <div className="relative h-4 bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 h-full w-1 bg-white border border-gray-800"
                        style={{
                          left: `${intelligenceData.physical.epcScore}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>A</span>
                      <span>G</span>
                    </div>
                  </div>
                </>
              )}

              {activeSection === "environment" && (
                <>
                  {/* Crime */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-indigo-500" />
                      נתוני פשיעה
                      <span className="text-gray-400 font-normal mr-auto">
                        {intelligenceData.crime.lastUpdated}
                      </span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-2 text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {intelligenceData.crime.totalCrimes}
                        </p>
                        <p className="text-xs text-gray-500">אירועים/חודש</p>
                      </div>
                      <div
                        className={`rounded-lg p-2 text-center ${
                          intelligenceData.crime.riskLevel === "נמוך"
                            ? "bg-emerald-100 dark:bg-emerald-900/30"
                            : intelligenceData.crime.riskLevel === "בינוני"
                              ? "bg-amber-100 dark:bg-amber-900/30"
                              : "bg-red-100 dark:bg-red-900/30"
                        }`}
                      >
                        {intelligenceData.crime.riskLevel === "גבוה" && (
                          <AlertTriangle className="w-4 h-4 text-red-600 mx-auto mb-1" />
                        )}
                        <p
                          className={`text-lg font-bold ${
                            intelligenceData.crime.riskLevel === "נמוך"
                              ? "text-emerald-700"
                              : intelligenceData.crime.riskLevel === "בינוני"
                                ? "text-amber-700"
                                : "text-red-700"
                          }`}
                        >
                          {intelligenceData.crime.riskLevel}
                        </p>
                        <p className="text-xs text-gray-600">רמת סיכון</p>
                      </div>
                    </div>
                    {Object.keys(intelligenceData.crime.categories).length >
                      0 && (
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {Object.entries(intelligenceData.crime.categories)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 4)
                          .map(([cat, count]) => (
                            <div
                              key={cat}
                              className="flex justify-between bg-white dark:bg-gray-700 rounded px-2 py-1 text-xs"
                            >
                              <span className="text-gray-600 dark:text-gray-400">
                                {CRIME_CATEGORIES_HE[cat] || cat}
                              </span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Transport */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <Train className="w-3 h-3 text-blue-500" />
                      תחבורה וקישוריות
                    </h4>
                    <div className="space-y-2">
                      {intelligenceData.proximity.trainStation && (
                        <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-2">
                          <div className="flex items-center gap-2">
                            <Train className="w-4 h-4 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[140px]">
                                {intelligenceData.proximity.trainStation.name}
                              </p>
                              <p className="text-xs text-gray-500">תחנת רכבת</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-blue-600">
                              {formatDistance(
                                intelligenceData.proximity.trainStation
                                  .distance,
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              ~
                              {
                                intelligenceData.proximity.trainStation
                                  .walkingTime
                              }{" "}
                              דק׳
                            </p>
                          </div>
                        </div>
                      )}
                      {intelligenceData.proximity.hospital && (
                        <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-2">
                          <div className="flex items-center gap-2">
                            <Hospital className="w-4 h-4 text-red-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[140px]">
                                {intelligenceData.proximity.hospital.name}
                              </p>
                              <p className="text-xs text-gray-500">בית חולים</p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-red-600">
                            {formatDistance(
                              intelligenceData.proximity.hospital.distance,
                            )}
                          </p>
                        </div>
                      )}
                      {intelligenceData.proximity.university && (
                        <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-2">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-indigo-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[140px]">
                                {intelligenceData.proximity.university.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                אוניברסיטה
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-indigo-600">
                            {formatDistance(
                              intelligenceData.proximity.university.distance,
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Council */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <Landmark className="w-3 h-3 text-amber-500" />
                      רשות מקומית: {intelligenceData.council.name}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      <a
                        href={intelligenceData.council.newsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-200"
                      >
                        <Newspaper className="w-3 h-3" />
                        חדשות
                        <ExternalLink className="w-2 h-2" />
                      </a>
                      <a
                        href={intelligenceData.council.planningUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded hover:bg-purple-200"
                      >
                        <Building2 className="w-3 h-3" />
                        תכנון
                        <ExternalLink className="w-2 h-2" />
                      </a>
                    </div>
                  </div>
                </>
              )}

              {activeSection === "financial" && (
                <>
                  {/* Market Summary */}
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-3 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-emerald-100 text-xs">
                          מחיר ממוצע באזור
                        </p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(
                            intelligenceData.market.avgSoldPrice ?? 0,
                          )}
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${(intelligenceData.market.priceChange12m ?? 0) >= 0 ? "text-emerald-200" : "text-red-200"}`}
                      >
                        <TrendingUp
                          className={`w-4 h-4 ${(intelligenceData.market.priceChange12m ?? 0) < 0 ? "rotate-180" : ""}`}
                        />
                        <span className="text-sm font-medium">
                          {intelligenceData.market.priceChange12m ?? 0}%
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-emerald-100 text-xs">מחיר/מ״ר</p>
                        <p className="font-semibold">
                          {formatCurrency(
                            Number(
                              (
                                intelligenceData.market as Record<
                                  string,
                                  unknown
                                >
                              ).avgPricePerSqm,
                            ) || 0,
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-emerald-100 text-xs">שכירות</p>
                        <p className="font-semibold">
                          {formatCurrency(
                            Number(
                              (
                                intelligenceData.market as Record<
                                  string,
                                  unknown
                                >
                              ).avgRent,
                            ) || 0,
                          )}
                          /חודש
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ROI Calculator */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <Calculator className="w-3 h-3 text-blue-600" />
                      מחשבון תשואה
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-500">
                          מחיר רכישה
                        </label>
                        <div className="relative">
                          <PoundSterling className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                          <input
                            type="number"
                            value={purchasePrice}
                            onChange={(e) =>
                              setPurchasePrice(Number(e.target.value))
                            }
                            className="w-full pr-7 pl-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">
                          שכירות חודשית
                        </label>
                        <div className="relative">
                          <PoundSterling className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                          <input
                            type="number"
                            value={monthlyRent}
                            onChange={(e) =>
                              setMonthlyRent(Number(e.target.value))
                            }
                            className="w-full pr-7 pl-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-emerald-200">
                          <div className="flex items-center gap-1">
                            <Percent className="w-3 h-3 text-emerald-600" />
                            <span className="text-xs text-gray-500">Gross</span>
                          </div>
                          <p className="text-lg font-bold text-emerald-600">
                            {grossYield.toFixed(1)}%
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-blue-200">
                          <div className="flex items-center gap-1">
                            <Percent className="w-3 h-3 text-blue-600" />
                            <span className="text-xs text-gray-500">Net</span>
                          </div>
                          <p className="text-lg font-bold text-blue-600">
                            {netYield.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Council Tax */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Council Tax
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-2 text-center">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          Band{" "}
                          {String(
                            (intelligenceData.market as Record<string, unknown>)
                              .councilTaxBand ?? "—",
                          )}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(
                            Number(
                              (
                                intelligenceData.market as Record<
                                  string,
                                  unknown
                                >
                              ).councilTaxAnnual,
                            ) || 0,
                          )}
                        </p>
                        <p className="text-xs text-gray-500">שנתי</p>
                      </div>
                    </div>
                  </div>

                  {/* Source */}
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Info className="w-3 h-3" />
                    <span>{intelligenceData.market.source}</span>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
