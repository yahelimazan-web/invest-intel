"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Percent,
  PoundSterling,
  Home,
  Wallet,
  PiggyBank,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
  Share2,
  Sliders,
} from "lucide-react";
import { cn, formatCurrency } from "../lib/utils";

// =============================================================================
// Types
// =============================================================================

export interface FinancialInputs {
  purchasePrice: number;
  depositPercent: number;
  mortgageRate: number;
  mortgageTerm: number;
  monthlyRent: number;
  vacancyRate: number;
  managementFee: number;
  maintenanceReserve: number;
  insurance: number;
  councilTax: number;
  groundRent: number;
  serviceCharge: number;
  stampDuty: number;
  legalFees: number;
  surveyFees: number;
  refurbCost: number;
}

export interface FinancialResults {
  // Mortgage
  loanAmount: number;
  depositAmount: number;
  monthlyMortgage: number;
  annualMortgage: number;
  
  // Income
  grossAnnualRent: number;
  effectiveAnnualRent: number;
  monthlyNetRent: number;
  
  // Expenses
  totalAnnualExpenses: number;
  totalMonthlyCosts: number;
  
  // Returns
  grossYield: number;
  netYield: number;
  capRate: number;
  cashOnCash: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  
  // Investment
  totalCashRequired: number;
  breakEvenRent: number;
  paybackYears: number;
  
  // Stress Test
  maxRateBeforeLoss: number;
  maxVacancyBeforeLoss: number;
}

interface FinancialSimulatorProps {
  initialPurchasePrice?: number;
  initialRent?: number;
  sqm?: number | null;
  epcRating?: string | null;
  postcode?: string;
  onResultsChange?: (results: FinancialResults, inputs: FinancialInputs) => void;
}

// =============================================================================
// UK Stamp Duty Calculator
// =============================================================================

function calculateStampDuty(price: number, isAdditional: boolean = true): number {
  // UK rates for additional properties (as of 2024)
  const rates = isAdditional
    ? [
        { threshold: 250000, rate: 0.03 },
        { threshold: 925000, rate: 0.08 },
        { threshold: 1500000, rate: 0.13 },
        { threshold: Infinity, rate: 0.15 },
      ]
    : [
        { threshold: 250000, rate: 0 },
        { threshold: 925000, rate: 0.05 },
        { threshold: 1500000, rate: 0.10 },
        { threshold: Infinity, rate: 0.12 },
      ];

  let duty = 0;
  let previousThreshold = 0;

  for (const band of rates) {
    if (price <= previousThreshold) break;
    const taxableAmount = Math.min(price, band.threshold) - previousThreshold;
    if (taxableAmount > 0) {
      duty += taxableAmount * band.rate;
    }
    previousThreshold = band.threshold;
  }

  return Math.round(duty);
}

// =============================================================================
// Financial Simulator Component
// =============================================================================

export default function FinancialSimulator({
  initialPurchasePrice = 150000,
  initialRent = 650,
  sqm = null,
  epcRating = null,
  postcode = "",
  onResultsChange,
}: FinancialSimulatorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Financial Inputs with sliders
  // BOE Base Rate is 3.75%, typical BTL mortgage = Base + 1.5% margin
  const BOE_BASE_RATE = 3.75;
  const BTL_MARGIN = 1.5;
  const DEFAULT_BTL_RATE = BOE_BASE_RATE + BTL_MARGIN; // 5.25%
  
  const [inputs, setInputs] = useState<FinancialInputs>({
    purchasePrice: initialPurchasePrice,
    depositPercent: 25,
    mortgageRate: DEFAULT_BTL_RATE,
    mortgageTerm: 25,
    monthlyRent: initialRent,
    vacancyRate: 5,
    managementFee: 10,
    maintenanceReserve: 5,
    insurance: 300,
    councilTax: 1500,
    groundRent: 0,
    serviceCharge: 0,
    stampDuty: calculateStampDuty(initialPurchasePrice),
    legalFees: 1500,
    surveyFees: 500,
    refurbCost: 0,
  });

  // Update stamp duty when price changes
  useEffect(() => {
    setInputs(prev => ({
      ...prev,
      stampDuty: calculateStampDuty(prev.purchasePrice),
    }));
  }, [inputs.purchasePrice]);

  // Update from props
  useEffect(() => {
    if (initialPurchasePrice > 0) {
      setInputs(prev => ({
        ...prev,
        purchasePrice: initialPurchasePrice,
        monthlyRent: initialRent || Math.round(initialPurchasePrice * 0.004),
        stampDuty: calculateStampDuty(initialPurchasePrice),
      }));
    }
  }, [initialPurchasePrice, initialRent]);

  // Calculate all financial metrics
  const results = useMemo((): FinancialResults => {
    const {
      purchasePrice,
      depositPercent,
      mortgageRate,
      mortgageTerm,
      monthlyRent,
      vacancyRate,
      managementFee,
      maintenanceReserve,
      insurance,
      councilTax,
      groundRent,
      serviceCharge,
      stampDuty,
      legalFees,
      surveyFees,
      refurbCost,
    } = inputs;

    // Mortgage calculations
    const depositAmount = (purchasePrice * depositPercent) / 100;
    const loanAmount = purchasePrice - depositAmount;
    const monthlyRate = mortgageRate / 100 / 12;
    const numPayments = mortgageTerm * 12;
    const monthlyMortgage = loanAmount > 0
      ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : 0;
    const annualMortgage = monthlyMortgage * 12;

    // Income calculations
    const grossAnnualRent = monthlyRent * 12;
    const vacancyLoss = (grossAnnualRent * vacancyRate) / 100;
    const effectiveAnnualRent = grossAnnualRent - vacancyLoss;

    // Expense calculations
    const managementCost = (effectiveAnnualRent * managementFee) / 100;
    const maintenanceCost = (effectiveAnnualRent * maintenanceReserve) / 100;
    const totalAnnualExpenses = managementCost + maintenanceCost + insurance + councilTax + groundRent + serviceCharge;
    const totalMonthlyCosts = annualMortgage / 12 + totalAnnualExpenses / 12;

    // Net operating income (before mortgage)
    const noi = effectiveAnnualRent - totalAnnualExpenses;

    // Cash flow (after mortgage)
    const annualCashFlow = noi - annualMortgage;
    const monthlyCashFlow = annualCashFlow / 12;
    const monthlyNetRent = effectiveAnnualRent / 12;

    // Yields and returns
    const grossYield = (grossAnnualRent / purchasePrice) * 100;
    const netYield = (noi / purchasePrice) * 100;
    const capRate = (noi / purchasePrice) * 100;

    // Cash on cash return
    const totalCashRequired = depositAmount + stampDuty + legalFees + surveyFees + refurbCost;
    const cashOnCash = totalCashRequired > 0 ? (annualCashFlow / totalCashRequired) * 100 : 0;

    // Break-even rent (to cover all costs)
    const breakEvenRent = (annualMortgage + totalAnnualExpenses) / 12;

    // Payback period
    const paybackYears = annualCashFlow > 0 ? totalCashRequired / annualCashFlow : Infinity;

    // Stress tests
    // Max interest rate before loss
    let maxRate = mortgageRate;
    for (let testRate = mortgageRate; testRate <= 15; testRate += 0.25) {
      const testMonthlyRate = testRate / 100 / 12;
      const testMonthlyMortgage = loanAmount > 0
        ? (loanAmount * testMonthlyRate * Math.pow(1 + testMonthlyRate, numPayments)) /
          (Math.pow(1 + testMonthlyRate, numPayments) - 1)
        : 0;
      const testCashFlow = noi - (testMonthlyMortgage * 12);
      if (testCashFlow < 0) {
        maxRate = testRate - 0.25;
        break;
      }
      maxRate = testRate;
    }

    // Max vacancy before loss
    let maxVacancy = vacancyRate;
    for (let testVacancy = vacancyRate; testVacancy <= 50; testVacancy += 1) {
      const testEffectiveRent = grossAnnualRent * (1 - testVacancy / 100);
      const testNoi = testEffectiveRent - totalAnnualExpenses;
      const testCashFlow = testNoi - annualMortgage;
      if (testCashFlow < 0) {
        maxVacancy = testVacancy - 1;
        break;
      }
      maxVacancy = testVacancy;
    }

    return {
      loanAmount,
      depositAmount,
      monthlyMortgage,
      annualMortgage,
      grossAnnualRent,
      effectiveAnnualRent,
      monthlyNetRent,
      totalAnnualExpenses,
      totalMonthlyCosts,
      grossYield,
      netYield,
      capRate,
      cashOnCash,
      monthlyCashFlow,
      annualCashFlow,
      totalCashRequired,
      breakEvenRent,
      paybackYears,
      maxRateBeforeLoss: maxRate,
      maxVacancyBeforeLoss: maxVacancy,
    };
  }, [inputs]);

  // Notify parent of changes
  useEffect(() => {
    onResultsChange?.(results, inputs);
  }, [results, inputs, onResultsChange]);

  // Update input handler
  const updateInput = useCallback((key: keyof FinancialInputs, value: number) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  // Reset to defaults
  const resetInputs = useCallback(() => {
    setInputs({
      purchasePrice: initialPurchasePrice,
      depositPercent: 25,
      mortgageRate: DEFAULT_BTL_RATE,
      mortgageTerm: 25,
      monthlyRent: initialRent || Math.round(initialPurchasePrice * 0.004),
      vacancyRate: 5,
      managementFee: 10,
      maintenanceReserve: 5,
      insurance: 300,
      councilTax: 1500,
      groundRent: 0,
      serviceCharge: 0,
      stampDuty: calculateStampDuty(initialPurchasePrice),
      legalFees: 1500,
      surveyFees: 500,
      refurbCost: 0,
    });
  }, [initialPurchasePrice, initialRent]);

  // Determine investment quality
  const investmentRating = useMemo(() => {
    if (results.cashOnCash >= 10 && results.netYield >= 6) return { label: "מצוין", color: "text-emerald-400", bg: "bg-emerald-500/20" };
    if (results.cashOnCash >= 5 && results.netYield >= 4) return { label: "טוב", color: "text-blue-400", bg: "bg-blue-500/20" };
    if (results.cashOnCash >= 0) return { label: "סביר", color: "text-amber-400", bg: "bg-amber-500/20" };
    return { label: "שלילי", color: "text-red-400", bg: "bg-red-500/20" };
  }, [results]);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Calculator className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-right">
            <h3 className="font-bold text-white">סימולטור פיננסי</h3>
            <p className="text-xs text-slate-400">ROI, Cap Rate, Cash Flow</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("px-3 py-1 rounded-full text-sm font-bold", investmentRating.bg, investmentRating.color)}>
            {investmentRating.label}
          </span>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Gross Yield</p>
              <p className={cn("text-xl font-bold", results.grossYield >= 6 ? "text-emerald-400" : "text-white")}>
                {results.grossYield.toFixed(1)}%
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Net Yield</p>
              <p className={cn("text-xl font-bold", results.netYield >= 5 ? "text-emerald-400" : "text-white")}>
                {results.netYield.toFixed(1)}%
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Cap Rate</p>
              <p className={cn("text-xl font-bold", results.capRate >= 5 ? "text-emerald-400" : "text-white")}>
                {results.capRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Cash-on-Cash</p>
              <p className={cn("text-xl font-bold", results.cashOnCash >= 8 ? "text-emerald-400" : results.cashOnCash < 0 ? "text-red-400" : "text-white")}>
                {results.cashOnCash.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Cash Flow Summary */}
          <div className={cn(
            "rounded-xl p-4 border",
            results.monthlyCashFlow >= 0 
              ? "bg-emerald-500/10 border-emerald-500/30" 
              : "bg-red-500/10 border-red-500/30"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {results.monthlyCashFlow >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
                <span className="text-sm text-slate-300">Cash Flow חודשי</span>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                results.monthlyCashFlow >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {results.monthlyCashFlow >= 0 ? "+" : ""}{formatCurrency(results.monthlyCashFlow, "GBP")}
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-left">
              שנתי: {formatCurrency(results.annualCashFlow, "GBP")}
            </p>
          </div>

          {/* What-If Sliders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                What-If Analysis
              </h4>
              <button
                type="button"
                onClick={resetInputs}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                איפוס
              </button>
            </div>

            {/* Purchase Price Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400">מחיר רכישה</label>
                <span className="text-sm font-bold text-white">{formatCurrency(inputs.purchasePrice, "GBP")}</span>
              </div>
              <input
                type="range"
                min={50000}
                max={1000000}
                step={5000}
                value={inputs.purchasePrice}
                onChange={(e) => updateInput("purchasePrice", Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Monthly Rent Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400">שכירות חודשית</label>
                <span className="text-sm font-bold text-white">{formatCurrency(inputs.monthlyRent, "GBP")}</span>
              </div>
              <input
                type="range"
                min={200}
                max={5000}
                step={25}
                value={inputs.monthlyRent}
                onChange={(e) => updateInput("monthlyRent", Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Interest Rate Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400">ריבית משכנתא</label>
                <span className="text-sm font-bold text-white">{inputs.mortgageRate.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                step={0.25}
                value={inputs.mortgageRate}
                onChange={(e) => updateInput("mortgageRate", Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Vacancy Rate Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400">שיעור אי-תפוסה</label>
                <span className="text-sm font-bold text-white">{inputs.vacancyRate}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={25}
                step={1}
                value={inputs.vacancyRate}
                onChange={(e) => updateInput("vacancyRate", Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* Deposit Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400">הון עצמי</label>
                <span className="text-sm font-bold text-white">{inputs.depositPercent}% ({formatCurrency(results.depositAmount, "GBP")})</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={inputs.depositPercent}
                onChange={(e) => updateInput("depositPercent", Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            {showAdvanced ? "הסתר הגדרות מתקדמות" : "הצג הגדרות מתקדמות"}
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700">
              <div>
                <label className="text-xs text-slate-500">דמי ניהול (%)</label>
                <input
                  type="number"
                  value={inputs.managementFee}
                  onChange={(e) => updateInput("managementFee", Number(e.target.value))}
                  className="input text-sm mt-1"
                  style={{ color: 'white' }}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">תחזוקה (%)</label>
                <input
                  type="number"
                  value={inputs.maintenanceReserve}
                  onChange={(e) => updateInput("maintenanceReserve", Number(e.target.value))}
                  className="input text-sm mt-1"
                  style={{ color: 'white' }}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">ביטוח שנתי (£)</label>
                <input
                  type="number"
                  value={inputs.insurance}
                  onChange={(e) => updateInput("insurance", Number(e.target.value))}
                  className="input text-sm mt-1"
                  style={{ color: 'white' }}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">ארנונה שנתית (£)</label>
                <input
                  type="number"
                  value={inputs.councilTax}
                  onChange={(e) => updateInput("councilTax", Number(e.target.value))}
                  className="input text-sm mt-1"
                  style={{ color: 'white' }}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Stamp Duty (£)</label>
                <input
                  type="number"
                  value={inputs.stampDuty}
                  onChange={(e) => updateInput("stampDuty", Number(e.target.value))}
                  className="input text-sm mt-1"
                  style={{ color: 'white' }}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">עלויות משפטיות (£)</label>
                <input
                  type="number"
                  value={inputs.legalFees}
                  onChange={(e) => updateInput("legalFees", Number(e.target.value))}
                  className="input text-sm mt-1"
                  style={{ color: 'white' }}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">שיפוץ (£)</label>
                <input
                  type="number"
                  value={inputs.refurbCost}
                  onChange={(e) => updateInput("refurbCost", Number(e.target.value))}
                  className="input text-sm mt-1"
                  style={{ color: 'white' }}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Service Charge (£)</label>
                <input
                  type="number"
                  value={inputs.serviceCharge}
                  onChange={(e) => updateInput("serviceCharge", Number(e.target.value))}
                  className="input text-sm mt-1"
                  style={{ color: 'white' }}
                />
              </div>
            </div>
          )}

          {/* Summary Table */}
          <div className="bg-slate-900/30 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="px-3 py-2 text-slate-400">הון עצמי נדרש</td>
                  <td className="px-3 py-2 text-white font-semibold text-left">{formatCurrency(results.totalCashRequired, "GBP")}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-slate-400">משכנתא חודשית</td>
                  <td className="px-3 py-2 text-white font-semibold text-left">{formatCurrency(results.monthlyMortgage, "GBP")}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-slate-400">שכירות נטו (אחרי vacancy)</td>
                  <td className="px-3 py-2 text-white font-semibold text-left">{formatCurrency(results.monthlyNetRent, "GBP")}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-slate-400">שכירות Break-Even</td>
                  <td className="px-3 py-2 text-amber-400 font-semibold text-left">{formatCurrency(results.breakEvenRent, "GBP")}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-slate-400">זמן החזר השקעה</td>
                  <td className="px-3 py-2 text-white font-semibold text-left">
                    {results.paybackYears < 100 ? `${results.paybackYears.toFixed(1)} שנים` : "∞"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Stress Test */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <h5 className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Stress Test
            </h5>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-400">ריבית מקסימלית לפני הפסד</p>
                <p className="text-white font-bold">{results.maxRateBeforeLoss.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-slate-400">Vacancy מקסימלי לפני הפסד</p>
                <p className="text-white font-bold">{results.maxVacancyBeforeLoss}%</p>
              </div>
            </div>
          </div>

          {/* Price per SQM */}
          {sqm && sqm > 0 && (
            <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg">
              <span className="text-sm text-slate-400">מחיר למ״ר</span>
              <span className="text-lg font-bold text-white">
                £{Math.round(inputs.purchasePrice / sqm).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
