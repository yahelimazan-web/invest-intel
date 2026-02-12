"use client";

import {
  X,
  MapPin,
  Building2,
  Home,
  TrendingUp,
  Shield,
  Train,
  Hospital,
  GraduationCap,
  ShoppingCart,
  ExternalLink,
  AlertTriangle,
  FileText,
  Landmark,
  Ruler,
  Key,
  Zap,
  PoundSterling,
  Target,
  Newspaper,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type {
  PropertyIntelligence,
  PointOfInterest,
} from "../lib/intelligenceEngine";

interface IntelligencePanelProps {
  data: PropertyIntelligence;
  onClose: () => void;
}

const POI_ICONS: Record<PointOfInterest["type"], typeof Train> = {
  train_station: Train,
  hospital: Hospital,
  school: GraduationCap,
  supermarket: ShoppingCart,
  park: MapPin,
};

const POI_LABELS: Record<PointOfInterest["type"], string> = {
  train_station: "תחנת רכבת",
  hospital: "בית חולים",
  school: "בית ספר",
  supermarket: "סופרמרקט",
  park: "פארק",
};

export default function IntelligencePanel({
  data,
  onClose,
}: IntelligencePanelProps) {
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} ק״מ`;
    }
    return `${meters} מטר`;
  };

  const formatCurrency = (amount: number) => `£${amount.toLocaleString()}`;

  const getCrimeLevel = (total: number) => {
    if (total < 20)
      return { level: "נמוך", color: "text-emerald-600", bg: "bg-emerald-100" };
    if (total < 50)
      return { level: "בינוני", color: "text-amber-600", bg: "bg-amber-100" };
    return { level: "גבוה", color: "text-red-600", bg: "bg-red-100" };
  };

  const crimeLevel = getCrimeLevel(data.crimeSummary.total);

  // Get closest POIs by type
  const getClosestByType = (type: PointOfInterest["type"]) => {
    return data.nearbyPOIs.find((poi) => poi.type === type);
  };

  const closestStation = getClosestByType("train_station");
  const closestHospital = getClosestByType("hospital");

  return (
    <div
      className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto"
      dir="rtl"
    >
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-5 z-10">
        <div className="flex items-start justify-between">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1 mr-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">
                {data.mode === "existing" ? "נכס קיים" : "נכס פוטנציאלי"}
              </span>
            </div>
            <h2 className="text-xl font-bold">
              {data.address || data.postcode}
            </h2>
            <p className="text-sm opacity-80 mt-1">
              {data.councilName}, {data.region}
            </p>
          </div>
        </div>

        {/* Mode Badge */}
        <div className="mt-4 flex items-center gap-2">
          {data.mode === "existing" ? (
            <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-100 text-xs font-medium px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              נתונים מאומתים
            </span>
          ) : (
            <span className="flex items-center gap-1.5 bg-amber-500/20 text-amber-100 text-xs font-medium px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              דו״ח Due Diligence
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Physical Specs */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            מפרט פיזי
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {/* SQM */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700">
              <Ruler className="w-5 h-5 text-gray-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {data.sqm || "—"}
              </p>
              <p className="text-xs text-gray-500">מ״ר</p>
            </div>

            {/* Tenure */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700">
              <Key className="w-5 h-5 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {data.tenure || "—"}
              </p>
              <p className="text-xs text-gray-500">בעלות</p>
            </div>

            {/* EPC */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700">
              <Zap className="w-5 h-5 text-amber-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {data.epcRating || "—"}
              </p>
              <p className="text-xs text-gray-500">דירוג EPC</p>
            </div>
          </div>
        </div>

        {/* Market Data */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            נתוני שוק
            <span className="text-xs font-normal text-gray-500 mr-auto">
              {data.marketData.source}
            </span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Avg Area Price */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-emerald-200 dark:border-emerald-700">
              <div className="flex items-center gap-2 mb-1">
                <Home className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-gray-500">מחיר ממוצע באזור</span>
              </div>
              <p className="text-xl font-bold text-emerald-600">
                {formatCurrency(data.marketData.avgAreaPrice)}
              </p>
            </div>

            {/* Estimated Rent */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-teal-200 dark:border-teal-700">
              <div className="flex items-center gap-2 mb-1">
                <PoundSterling className="w-4 h-4 text-teal-600" />
                <span className="text-xs text-gray-500">שכירות משוערת</span>
              </div>
              <p className="text-xl font-bold text-teal-600">
                {formatCurrency(data.marketData.estimatedRent)}/חודש
              </p>
            </div>

            {/* Price per SQM */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <Ruler className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">מחיר למ״ר</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(data.marketData.pricePerSqm)}
              </p>
            </div>

            {/* Yield */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">תשואה משוערת</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {data.marketData.rentYield}%
              </p>
            </div>
          </div>
        </div>

        {/* Proximity / POIs */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-500" />
            קרבה לשירותים
          </h3>

          {/* Key Distances */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Train className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  תחנת רכבת
                </span>
              </div>
              {closestStation ? (
                <>
                  <p className="text-lg font-bold text-blue-600">
                    {formatDistance(closestStation.distance)}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {closestStation.name}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">לא נמצא ברדיוס</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Hospital className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  בית חולים
                </span>
              </div>
              {closestHospital ? (
                <>
                  <p className="text-lg font-bold text-red-600">
                    {formatDistance(closestHospital.distance)}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {closestHospital.name}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">לא נמצא ברדיוס</p>
              )}
            </div>
          </div>

          {/* All POIs */}
          {data.nearbyPOIs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">
                נקודות עניין נוספות:
              </p>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {data.nearbyPOIs.slice(0, 6).map((poi, idx) => {
                  const Icon = POI_ICONS[poi.type];
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[180px]">
                          {poi.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDistance(poi.distance)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Crime Summary */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" />
            נתוני פשיעה
            <span className="text-xs font-normal text-gray-500 mr-auto">
              {data.crimeSummary.recentMonth}
            </span>
          </h3>

          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 flex-1 border border-gray-100 dark:border-gray-700">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {data.crimeSummary.total}
              </p>
              <p className="text-xs text-gray-500">אירועים בחודש</p>
            </div>
            <div
              className={`${crimeLevel.bg} dark:bg-opacity-20 rounded-xl p-4 flex-1`}
            >
              <div className="flex items-center gap-2">
                {data.crimeSummary.total >= 50 && (
                  <AlertTriangle className={`w-5 h-5 ${crimeLevel.color}`} />
                )}
                <p className={`text-lg font-bold ${crimeLevel.color}`}>
                  {crimeLevel.level}
                </p>
              </div>
              <p className="text-xs text-gray-500">רמת סיכון</p>
            </div>
          </div>

          {/* Crime breakdown */}
          {Object.keys(data.crimeSummary.byCategory).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">
                פירוט לפי קטגוריה:
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {Object.entries(data.crimeSummary.byCategory)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-2 text-xs border border-gray-100 dark:border-gray-700"
                    >
                      <span className="text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                        {category.replace(/-/g, " ")}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Council / Macro */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-amber-500" />
            מידע מקרו
          </h3>

          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {data.councilName}
                  </p>
                  <p className="text-xs text-gray-500">רשות מקומית</p>
                </div>
                <a
                  href={data.councilNewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium px-3 py-2 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                >
                  <Newspaper className="w-4 h-4" />
                  חדשות הרשות
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">אזור:</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {data.region}
              </p>
            </div>
          </div>
        </div>

        {/* Report Footer */}
        <div className="text-center text-xs text-gray-400 pb-4">
          <FileText className="w-4 h-4 inline-block ml-1" />
          דו״ח נוצר ב-{new Date().toLocaleDateString("he-IL")}
        </div>
      </div>
    </div>
  );
}
