"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  TrendingUp,
  CheckCircle2,
  Circle,
  AlertCircle,
  FileText,
  Building,
  Scale,
  Zap,
  PoundSterling,
  Euro,
  Save,
  Percent,
  Calculator,
  Home,
  Landmark,
  CreditCard,
} from "lucide-react";

export interface PropertyData {
  id: string;
  title: string;
  address: string;
  price: number;
  currency: "GBP" | "EUR";
  size: number;
  bedrooms: number;
  monthlyRent: number;
  // Investment metrics
  grossYield: number;
  netYield: number;
  stampDuty: number;
  managementFees: number;
  maintenanceReserve: number;
  // UK Specifics
  epcRating?: string;
  councilTaxBand?: string;
  // Checklist
  checklist: {
    epc: "pending" | "passed" | "failed" | "na";
    epcRating?: string;
    structural: "pending" | "passed" | "failed" | "na";
    legal: "pending" | "passed" | "failed" | "na";
    mortgage?: "pending" | "passed" | "failed" | "na";
  };
  // Notes
  notes?: string;
}

interface PropertyPanelProps {
  property: PropertyData;
  onClose: () => void;
  onPropertyUpdate: (propertyId: string, updates: Partial<PropertyData>) => void;
}

const EPC_RATINGS = ["A", "B", "C", "D", "E", "F", "G"];
const COUNCIL_TAX_BANDS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export default function PropertyPanel({
  property,
  onClose,
  onPropertyUpdate,
}: PropertyPanelProps) {
  // Yield Calculator State
  const [calcPrice, setCalcPrice] = useState(property.price);
  const [calcRent, setCalcRent] = useState(property.monthlyRent);
  const [notes, setNotes] = useState(property.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  // Reset calculator when property changes
  useEffect(() => {
    setCalcPrice(property.price);
    setCalcRent(property.monthlyRent);
    setNotes(property.notes || "");
  }, [property]);

  // Calculate yields
  const calculatedYields = useMemo(() => {
    const annualRent = calcRent * 12;
    const grossYield = calcPrice > 0 ? (annualRent / calcPrice) * 100 : 0;
    // Estimated expenses: ~25% of rent (management, maintenance, void periods, insurance)
    const estimatedExpenses = annualRent * 0.25;
    const netIncome = annualRent - estimatedExpenses;
    const netYield = calcPrice > 0 ? (netIncome / calcPrice) * 100 : 0;
    return { grossYield, netYield, annualRent, netIncome };
  }, [calcPrice, calcRent]);

  const handleSaveNotes = () => {
    setIsSaving(true);
    onPropertyUpdate(property.id, { notes });
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleChecklistUpdate = (field: keyof PropertyData["checklist"], value: string) => {
    onPropertyUpdate(property.id, {
      checklist: { ...property.checklist, [field]: value },
    });
  };

  const handleEpcRatingChange = (value: string) => {
    onPropertyUpdate(property.id, { epcRating: value });
  };

  const handleCouncilTaxBandChange = (value: string) => {
    onPropertyUpdate(property.id, { councilTaxBand: value });
  };

  const formatCurrency = (amount: number) => {
    const symbol = property.currency === "GBP" ? "£" : "€";
    return `${symbol}${amount.toLocaleString()}`;
  };

  const getChecklistIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "pending":
        return <Circle className="w-5 h-5 text-amber-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const isUK = property.currency === "GBP";

  const checklistItems = [
    {
      key: "structural" as const,
      label: "סקר מבני (Structural Survey)",
      icon: Building,
      description: "בדיקת מצב המבנה והתשתיות",
    },
    {
      key: "legal" as const,
      label: "בדיקה משפטית (Legal)",
      icon: Scale,
      description: "בעלות, שעבודים, חוזים",
    },
    ...(isUK
      ? [
          {
            key: "mortgage" as const,
            label: "סטטוס משכנתא (Mortgage)",
            icon: CreditCard,
            description: "אישור עקרוני / בתהליך",
          },
        ]
      : []),
    {
      key: "epc" as const,
      label: "תעודת אנרגיה (EPC)",
      icon: Zap,
      description: property.epcRating ? `דירוג נוכחי: ${property.epcRating}` : "נדרש לפני השכרה",
    },
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[440px] bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 z-10">
        <div className="flex items-start justify-between">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 min-w-0 mr-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {property.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {property.address}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Price & Basic Info */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            {property.currency === "GBP" ? (
              <PoundSterling className="w-6 h-6" />
            ) : (
              <Euro className="w-6 h-6" />
            )}
            <span className="text-3xl font-bold">{formatCurrency(property.price)}</span>
          </div>
          <div className="flex items-center gap-4 text-blue-100 text-sm flex-wrap">
            <span>{property.bedrooms} חדרים</span>
            <span>•</span>
            <span>{property.size} מ״ר</span>
            <span>•</span>
            <span>שכירות: {formatCurrency(property.monthlyRent)}/חודש</span>
          </div>
        </div>

        {/* Yield Calculator */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            מחשבון תשואה
          </h3>

          <div className="space-y-4">
            {/* Purchase Price Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                מחיר רכישה
              </label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {property.currency === "GBP" ? "£" : "€"}
                </span>
                <input
                  type="number"
                  value={calcPrice}
                  onChange={(e) => setCalcPrice(Number(e.target.value))}
                  className="w-full pr-8 pl-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Monthly Rent Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                שכירות חודשית
              </label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {property.currency === "GBP" ? "£" : "€"}
                </span>
                <input
                  type="number"
                  value={calcRent}
                  onChange={(e) => setCalcRent(Number(e.target.value))}
                  className="w-full pr-8 pl-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Calculated Results */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-emerald-200 dark:border-emerald-700">
                <div className="flex items-center gap-1 mb-1">
                  <Percent className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Gross Yield</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">
                  {calculatedYields.grossYield.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(calculatedYields.annualRent)}/שנה
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-teal-200 dark:border-teal-700">
                <div className="flex items-center gap-1 mb-1">
                  <Percent className="w-4 h-4 text-teal-600" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Net Yield</span>
                </div>
                <p className="text-2xl font-bold text-teal-600">
                  {calculatedYields.netYield.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  אחרי ~25% הוצאות
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* UK Specifics - Only show for UK properties */}
        {isUK && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-indigo-500" />
              פרטים ספציפיים ל-UK
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* EPC Rating */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">דירוג EPC</span>
                </div>
                <select
                  value={property.epcRating || ""}
                  onChange={(e) => handleEpcRatingChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">בחר דירוג</option>
                  {EPC_RATINGS.map((rating) => (
                    <option key={rating} value={rating}>
                      {rating}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  {property.epcRating && property.epcRating <= "C" ? "✓ מותר להשכרה" : "⚠️ נדרש E או יותר"}
                </p>
              </div>

              {/* Council Tax Band */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Council Tax Band</span>
                </div>
                <select
                  value={property.councilTaxBand || ""}
                  onChange={(e) => handleCouncilTaxBandChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">בחר Band</option>
                  {COUNCIL_TAX_BANDS.map((band) => (
                    <option key={band} value={band}>
                      Band {band}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  משפיע על הוצאות השוכר
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Due Diligence Checklist */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" />
            רשימת Due Diligence
          </h3>

          <div className="space-y-3">
            {checklistItems.map((item) => (
              <div
                key={item.key}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getChecklistIcon(property.checklist[item.key] || "na")}
                    <select
                      value={property.checklist[item.key] || "na"}
                      onChange={(e) => handleChecklistUpdate(item.key, e.target.value)}
                      className="text-xs bg-transparent border-none text-gray-600 dark:text-gray-400 cursor-pointer focus:ring-0 p-0"
                    >
                      <option value="pending">בבדיקה</option>
                      <option value="passed">הושלם</option>
                      <option value="failed">בעיה</option>
                      <option value="na">לא רלוונטי</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            פירוט עלויות
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">
                {isUK ? "Stamp Duty (SDLT)" : "מס רכישה"}
              </span>
              <span className="text-gray-900 dark:text-white font-medium">
                {formatCurrency(property.stampDuty)}
              </span>
            </div>
            <div className="flex justify-between text-sm py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">דמי ניהול (שנתי)</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {formatCurrency(property.managementFees)}
              </span>
            </div>
            <div className="flex justify-between text-sm py-2">
              <span className="text-gray-600 dark:text-gray-400">קרן תחזוקה (שנתי)</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {formatCurrency(property.maintenanceReserve)}
              </span>
            </div>
          </div>
        </div>

        {/* Investor Notes */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            הערות משקיע
          </h3>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="רשום את המחשבות שלך על הנכס הזה..."
            className="w-full h-32 p-4 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
            dir="rtl"
          />

          <button
            onClick={handleSaveNotes}
            disabled={isSaving}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-xl transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "שומר..." : "שמור הערות"}
          </button>
        </div>
      </div>
    </div>
  );
}
