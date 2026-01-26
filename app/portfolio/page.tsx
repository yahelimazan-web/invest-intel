"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FolderOpen,
  FolderPlus,
  Heart,
  Home,
  Trash2,
  Edit3,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  ArrowLeft,
  Building2,
  MapPin,
  Zap,
  Calendar,
  PoundSterling,
  Star,
  MoreVertical,
  Search,
  TrendingUp,
  Save,
  Calculator,
  Percent,
  Check,
  RefreshCw,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { cn } from "../lib/utils";
import { useAuth } from "../lib/auth";
import { 
  loadUserFolders, 
  saveUserFolders, 
  deleteProperty,
  updateProperty,
  type PropertyFolder, 
  type SavedProperty,
  type Country
} from "../lib/portfolio-db";
import PropertyDocuments from "../components/PropertyDocuments";

// =============================================================================
// Financial Calculation Constants
// =============================================================================

// Import country-specific interest rates and currency
import { getDefaultMortgageRate, getBaseRate, getInterestRateConfig } from "../lib/interest-rates";
import { formatCurrency, formatCurrencyCompact, getCurrencySymbol, getPortfolioCountries } from "../lib/currency";

const DEFAULT_DEPOSIT_PERCENT = 25;
const DEFAULT_MORTGAGE_TERM = 25;

// =============================================================================
// Types
// =============================================================================

// Types are imported from portfolio-db.ts

// =============================================================================
// Color Options
// =============================================================================

const FOLDER_COLORS = [
  { id: "emerald", bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
  { id: "blue", bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  { id: "purple", bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  { id: "amber", bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  { id: "pink", bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/30" },
  { id: "cyan", bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
];

// =============================================================================
// Portfolio Page Component
// =============================================================================

export default function PortfolioPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [folders, setFolders] = useState<PropertyFolder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("emerald");
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<SavedProperty | null>(null);
  
  // Edit property state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<SavedProperty | null>(null);
  const [editFolderId, setEditFolderId] = useState<string | null>(null);
  
  // Inline editing state
  const [inlineEditing, setInlineEditing] = useState<{
    field: "purchasePrice" | "monthlyRent" | "floorArea" | null;
    value: string;
  }>({ field: null, value: "" });
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Default folders for new users
  const defaultFolders: PropertyFolder[] = [
    {
      id: "favorites",
      name: "מועדפים",
      color: "pink",
      icon: "heart",
      properties: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "watching",
      name: "במעקב",
      color: "amber",
      icon: "star",
      properties: [],
      createdAt: new Date().toISOString(),
    },
  ];

  // Load folders from Supabase ONLY (no localStorage)
  useEffect(() => {
    if (authLoading || !user?.id) return;
    
    const loadFolders = async () => {
      try {
        const savedFolders = await loadUserFolders(user.id);
        setFolders(savedFolders);
      } catch (e) {
        console.error("Failed to load folders from Supabase:", e);
        // Set empty default folders
        setFolders(defaultFolders);
      }
    };

    loadFolders();
  }, [authLoading, user?.id]);

  // Save folders to Supabase ONLY (debounced)
  useEffect(() => {
    if (authLoading || !user?.id || folders.length === 0) return;
    
    const timeoutId = setTimeout(async () => {
      setIsSaving(true);
      try {
        const success = await saveUserFolders(user.id, folders);
        if (success) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        }
      } catch (e) {
        console.error("Failed to save folders to Supabase:", e);
      } finally {
        setIsSaving(false);
      }
    }, 1000); // Debounce saves by 1 second

    return () => clearTimeout(timeoutId);
  }, [folders, authLoading, user?.id]);

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Create new folder
  const createFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: PropertyFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      color: newFolderColor,
      icon: "folder",
      properties: [],
      createdAt: new Date().toISOString(),
    };

    setFolders((prev) => [...prev, newFolder]);
    setNewFolderName("");
    setNewFolderColor("emerald");
    setShowNewFolderModal(false);
  };

  // Delete folder
  const deleteFolder = (folderId: string) => {
    if (folderId === "favorites" || folderId === "watching") {
      alert("לא ניתן למחוק תיקיות מערכת");
      return;
    }
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
  };

  // Delete property from folder (Supabase)
  const handleDeleteProperty = async (folderId: string, propertyId: string) => {
    if (!user?.id) return;
    
    try {
      const success = await deleteProperty(user.id, folderId, propertyId);
      if (success) {
        // Reload folders from Supabase
        const updatedFolders = await loadUserFolders(user.id);
        setFolders(updatedFolders);
        setSelectedProperty(null);
      } else {
        alert("שגיאה במחיקת הנכס. נסה שוב.");
      }
    } catch (error) {
      console.error("Failed to delete property:", error);
      alert("שגיאה במחיקת הנכס. נסה שוב.");
    }
  };

  // Open edit modal for property
  const openEditModal = (folderId: string, property: SavedProperty) => {
    setEditFolderId(folderId);
    setEditingProperty({ ...property });
    setShowEditModal(true);
  };

  // Save edited property (Supabase)
  const saveEditedProperty = async () => {
    if (!editingProperty || !editFolderId || !user?.id) return;

    setIsSaving(true);
    try {
      const success = await updateProperty(
        user.id,
        editFolderId,
        editingProperty.id,
        editingProperty
      );

      if (success) {
        // Reload folders from Supabase
        const updatedFolders = await loadUserFolders(user.id);
        setFolders(updatedFolders);
        
        // Update selected property if it was being edited
        const updatedProperty = updatedFolders
          .flatMap(f => f.properties)
          .find(p => p.id === editingProperty.id);
        if (updatedProperty) {
          setSelectedProperty(updatedProperty);
        }

        setShowEditModal(false);
        setEditingProperty(null);
        setEditFolderId(null);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        alert("שגיאה בשמירת השינויים. נסה שוב.");
      }
    } catch (error) {
      console.error("Failed to update property:", error);
      alert("שגיאה בשמירת השינויים. נסה שוב.");
    } finally {
      setIsSaving(false);
    }
  };

  // Get color classes
  const getColorClasses = (colorId: string) => {
    return FOLDER_COLORS.find((c) => c.id === colorId) || FOLDER_COLORS[0];
  };

  // Filter properties by search
  const getFilteredProperties = (properties: SavedProperty[]) => {
    if (!searchQuery.trim()) return properties;
    const query = searchQuery.toLowerCase();
    return properties.filter(
      (p) =>
        p.address.toLowerCase().includes(query) ||
        p.postcode.toLowerCase().includes(query) ||
        p.notes?.toLowerCase().includes(query)
    );
  };

  // Start inline editing
  const startInlineEdit = useCallback((field: "purchasePrice" | "monthlyRent" | "floorArea", value: number | null | undefined) => {
    setInlineEditing({ field, value: value?.toString() || "" });
  }, []);

  // Cancel inline editing
  const cancelInlineEdit = useCallback(() => {
    setInlineEditing({ field: null, value: "" });
  }, []);

  // Save inline edit (Supabase)
  const saveInlineEdit = useCallback(async () => {
    if (!selectedProperty || !inlineEditing.field || !selectedFolderId || !user?.id) return;
    
    setIsSaving(true);
    
    const newValue = inlineEditing.value ? Number(inlineEditing.value) : null;
    
    try {
      const success = await updateProperty(
        user.id,
        selectedFolderId,
        selectedProperty.id,
        { [inlineEditing.field!]: newValue }
      );

      if (success) {
        // Reload folders from Supabase
        const updatedFolders = await loadUserFolders(user.id);
        setFolders(updatedFolders);
        
        // Update selected property
        const updatedProperty = updatedFolders
          .flatMap(f => f.properties)
          .find(p => p.id === selectedProperty.id);
        if (updatedProperty) {
          setSelectedProperty(updatedProperty);
        }

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 1500);
        cancelInlineEdit();
      } else {
        alert("שגיאה בשמירת השינויים. נסה שוב.");
      }
    } catch (error) {
      console.error("Failed to update property:", error);
      alert("שגיאה בשמירת השינויים. נסה שוב.");
    } finally {
      setIsSaving(false);
    }
  }, [selectedProperty, inlineEditing, selectedFolderId, user?.id, cancelInlineEdit]);

  // Calculate financial metrics - LIVE UPDATE while typing
  const financialMetrics = useMemo(() => {
    if (!selectedProperty) return null;
    
    // Use inline editing values if currently editing for LIVE updates
    let purchasePrice = selectedProperty.purchasePrice || selectedProperty.lastPrice || 0;
    let monthlyRent = selectedProperty.monthlyRent || 0;
    
    // Override with current editing value for real-time calculation
    if (inlineEditing.field === "purchasePrice" && inlineEditing.value) {
      purchasePrice = Number(inlineEditing.value) || purchasePrice;
    }
    if (inlineEditing.field === "monthlyRent" && inlineEditing.value) {
      monthlyRent = Number(inlineEditing.value) || monthlyRent;
    }
    
    if (purchasePrice === 0) return null;

    // Calculate values
    const annualRent = monthlyRent * 12;
    const grossYield = (annualRent / purchasePrice) * 100;
    
    // Mortgage calculations - Use country-specific rates
    const propertyCountry: Country = selectedProperty.country || "UK";
    const mortgageRate = getDefaultMortgageRate(propertyCountry);
    const baseRate = getBaseRate(propertyCountry);
    
    const deposit = purchasePrice * (DEFAULT_DEPOSIT_PERCENT / 100);
    const loanAmount = purchasePrice - deposit;
    const monthlyRate = mortgageRate / 100 / 12;
    const numPayments = DEFAULT_MORTGAGE_TERM * 12;
    const monthlyMortgage = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    // Expenses (estimated)
    const annualManagement = annualRent * 0.10; // 10% management
    const annualMaintenance = annualRent * 0.05; // 5% maintenance
    const annualInsurance = 500;
    const vacancyAllowance = annualRent * 0.05; // 5% vacancy
    
    const totalExpenses = annualManagement + annualMaintenance + annualInsurance + vacancyAllowance;
    const annualMortgage = monthlyMortgage * 12;
    
    const netIncome = annualRent - totalExpenses - annualMortgage;
    const monthlyCashflow = netIncome / 12;
    const netYield = (netIncome / purchasePrice) * 100;
    const cashOnCash = (netIncome / deposit) * 100;
    
    return {
      purchasePrice,
      monthlyRent,
      annualRent,
      grossYield,
      netYield,
      deposit,
      loanAmount,
      monthlyMortgage,
      annualMortgage,
      monthlyCashflow,
      cashOnCash,
      totalExpenses,
      mortgageRate,
      baseRate,
    };
  }, [selectedProperty, inlineEditing]); // Added inlineEditing for LIVE updates

  // Calculate totals
  const totalProperties = folders.reduce((sum, f) => sum + f.properties.length, 0);
  const totalValue = folders.reduce(
    (sum, f) => sum + f.properties.reduce((pSum, p) => pSum + (p.lastPrice || 0), 0),
    0
  );

  // Show login prompt for unauthenticated users
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#00C805]/20 to-[#00A004]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FolderOpen className="w-10 h-10 text-[#00C805]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">תיק השקעות פרטי</h1>
          <p className="text-slate-400 mb-8">
            כדי לשמור נכסים ולנהל את תיק ההשקעות שלך, עליך להתחבר לחשבונך.
            <br />
            הנתונים שלך יישמרו בצורה מאובטחת ונפרדת ממשתמשים אחרים.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00C805] to-[#00A004] text-white font-semibold rounded-xl hover:from-[#00D806] hover:to-[#00B505] transition-all shadow-lg shadow-[#00C805]/20"
          >
            <LogIn className="w-5 h-5" />
            התחבר / הירשם
          </Link>
          <div className="mt-6">
            <Link
              href="/"
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← חזור לדשבורד
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FolderOpen className="w-6 h-6 text-emerald-400" />
                  תיק ההשקעות שלי
                </h1>
                <p className="text-sm text-slate-400">ניהול נכסים ותיקיות</p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowNewFolderModal(true);
              }}
              className="btn-primary flex items-center gap-2 relative z-10"
              style={{ pointerEvents: 'auto' }}
            >
              <FolderPlus className="w-4 h-4" />
              תיקייה חדשה
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{folders.length}</p>
                  <p className="text-xs text-slate-400">תיקיות</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{totalProperties}</p>
                  <p className="text-xs text-slate-400">נכסים שמורים</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <PoundSterling className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {totalValue > 0 ? `£${(totalValue / 1000).toFixed(0)}K` : "—"}
                  </p>
                  <p className="text-xs text-slate-400">שווי משוער</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש נכסים לפי כתובת, מיקוד או הערות..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pr-12 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            style={{ color: 'white' }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Folders List */}
          <div className="lg:col-span-2 space-y-4">
            {folders.length === 0 ? (
              <div className="bg-slate-800/50 rounded-xl p-12 text-center border border-slate-700">
                <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">אין תיקיות עדיין</h3>
                <p className="text-slate-400 mb-4">צור תיקייה חדשה כדי להתחיל לארגן את הנכסים שלך</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNewFolderModal(true);
                  }}
                  className="btn-primary relative z-10"
                  style={{ pointerEvents: 'auto' }}
                >
                  <FolderPlus className="w-4 h-4 ml-2" />
                  צור תיקייה ראשונה
                </button>
              </div>
            ) : folders.every(f => f.properties.length === 0) ? (
              <div className="bg-slate-800/50 rounded-xl p-12 text-center border border-slate-700">
                <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">אין נכסים בתיק שלך</h3>
                <p className="text-slate-400 mb-4">התחל להוסיף נכסים כדי לבנות את תיק ההשקעות שלך</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00C805] to-[#00A004] hover:from-[#00D806] hover:to-[#00B505] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#00C805]/20 relative z-10"
                  style={{ pointerEvents: 'auto' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus className="w-5 h-5" />
                  הוסף נכס ראשון
                </Link>
              </div>
            ) : (
              folders.map((folder) => {
                const colorClasses = getColorClasses(folder.color);
                const isExpanded = expandedFolders.has(folder.id);
                const filteredProps = getFilteredProperties(folder.properties);

                return (
                  <div
                    key={folder.id}
                    className={cn(
                      "bg-slate-800/50 rounded-xl border transition-all",
                      colorClasses.border
                    )}
                  >
                    {/* Folder Header */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        toggleFolder(folder.id);
                      }}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors rounded-t-xl relative z-10"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", colorClasses.bg)}>
                          {folder.icon === "heart" ? (
                            <Heart className={cn("w-5 h-5", colorClasses.text)} />
                          ) : folder.icon === "star" ? (
                            <Star className={cn("w-5 h-5", colorClasses.text)} />
                          ) : (
                            <FolderOpen className={cn("w-5 h-5", colorClasses.text)} />
                          )}
                        </div>
                        <div className="text-right">
                          <h3 className="font-semibold text-white">{folder.name}</h3>
                          <p className="text-xs text-slate-400">{folder.properties.length} נכסים</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {folder.id !== "favorites" && folder.id !== "watching" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFolder(folder.id);
                            }}
                            className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Folder Content */}
                    {isExpanded && (
                      <div className="border-t border-slate-700">
                        {filteredProps.length === 0 ? (
                          <div className="p-6 text-center text-slate-500">
                            <Home className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="mb-3">אין נכסים בתיקייה זו</p>
                            <Link
                              href="/"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C805]/20 hover:bg-[#00C805]/30 text-[#00C805] rounded-lg transition-colors text-sm font-medium relative z-10"
                              style={{ pointerEvents: 'auto' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Plus className="w-4 h-4" />
                              הוסף נכס
                            </Link>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-700/50">
                            {filteredProps.map((property) => (
                              <div
                                key={property.id}
                                className="p-4 hover:bg-slate-700/30 transition-colors relative group"
                              >
                                <div 
                                  className="flex items-start justify-between cursor-pointer"
                                  onClick={() => {
                                    setSelectedProperty(property);
                                    setSelectedFolderId(folder.id);
                                    cancelInlineEdit();
                                  }}
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-white">{property.address}</p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {property.postcode}
                                      </span>
                                      {property.energyRating && (
                                        <span className="flex items-center gap-1">
                                          <Zap className="w-3 h-3" />
                                          EPC {property.energyRating}
                                        </span>
                                      )}
                                      {property.floorArea && (
                                        <span>{property.floorArea} מ״ר</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {property.lastPrice && (
                                      <span className="text-[#00C805] font-semibold">
                                        {formatCurrencyCompact(property.lastPrice, property.country || "UK")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {/* Action buttons - separate from clickable area */}
                                <div 
                                  className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      // Select property and open full edit modal
                                      setSelectedProperty(property);
                                      setSelectedFolderId(folder.id);
                                      openEditModal(folder.id, property);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-[#00C805] hover:text-[#00E806] bg-[#00C805]/10 hover:bg-[#00C805]/20 rounded transition-colors relative z-20"
                                    style={{ pointerEvents: 'auto', position: 'relative' }}
                                    title="ערוך נכס"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                    ערוך
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      if (confirm("האם אתה בטוח שברצונך למחוק את הנכס הזה?")) {
                                        await handleDeleteProperty(folder.id, property.id);
                                      }
                                    }}
                                    className="px-3 py-1.5 text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors relative z-20"
                                    style={{ pointerEvents: 'auto', position: 'relative' }}
                                    title="מחק נכס"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Property Detail Sidebar */}
          <div className="lg:col-span-1">
            {selectedProperty ? (
              <div 
                className="bg-slate-800/50 rounded-xl border border-slate-700 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
                style={{ position: 'relative', zIndex: 10 }}
              >
                <div className="p-4 border-b border-[#2D333F] sticky top-0 bg-[#151921]/95 backdrop-blur z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      פרטי נכס
                      {inlineEditing.field && (
                        <span className="flex items-center gap-1 text-xs text-[#00C805] bg-[#00C805]/20 px-2 py-0.5 rounded-full">
                          <Edit3 className="w-3 h-3" />
                          מצב עריכה
                        </span>
                      )}
                      {saveSuccess && (
                        <span className="flex items-center gap-1 text-xs text-[#00C805] bg-[#00C805]/20 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                          נשמר בהצלחה!
                        </span>
                      )}
                      {isSaving && (
                        <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />
                      )}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProperty(null);
                        cancelInlineEdit();
                      }}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div 
                  className="p-4 space-y-4"
                  style={{ position: 'relative', zIndex: 1 }}
                >
                  <div>
                    <p className="text-lg font-medium text-white">{selectedProperty.address}</p>
                    <p className="text-sm text-slate-400">{selectedProperty.postcode}</p>
                  </div>

                  {/* Editable Financial Fields */}
                  <div className="space-y-3">
                    {/* Purchase Price - Editable */}
                    <div className={cn(
                      "rounded-lg p-3 transition-all",
                      inlineEditing.field === "purchasePrice" 
                        ? "bg-[#1D2430] border-2 border-[#00C805]" 
                        : "bg-slate-700/50 border border-transparent"
                    )}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-slate-400">מחיר רכישה</p>
                        {inlineEditing.field !== "purchasePrice" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startInlineEdit("purchasePrice", selectedProperty.purchasePrice || selectedProperty.lastPrice);
                            }}
                            className="text-xs text-[#00C805] hover:text-[#00E806] flex items-center gap-1 font-medium"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <Edit3 className="w-3 h-3" />
                            ערוך
                          </button>
                        )}
                      </div>
                      {inlineEditing.field === "purchasePrice" ? (
                        <div className="flex items-center gap-2 relative z-50">
                          <span className="text-lg text-white font-bold">£</span>
                          <input
                            type="number"
                            value={inlineEditing.value}
                            onChange={(e) => setInlineEditing({ ...inlineEditing, value: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveInlineEdit();
                              if (e.key === "Escape") cancelInlineEdit();
                            }}
                            className="flex-1 bg-[#0B0E14] border-2 border-[#00C805] rounded-lg px-3 py-2 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#00C805]/50"
                            style={{ color: 'white', pointerEvents: 'auto' }}
                            autoFocus
                            placeholder="הזן מחיר"
                          />
                          <button
                            type="button"
                            onClick={saveInlineEdit}
                            className="p-2 bg-[#00C805] hover:bg-[#00E806] text-white rounded-lg font-medium"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelInlineEdit}
                            className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xl font-bold text-[#00C805]">
                          {formatCurrency(selectedProperty.purchasePrice || selectedProperty.lastPrice || 0, selectedProperty.country || "UK")}
                        </p>
                      )}
                    </div>

                    {/* Monthly Rent - Editable */}
                    <div className={cn(
                      "rounded-lg p-3 transition-all",
                      inlineEditing.field === "monthlyRent" 
                        ? "bg-[#1D2430] border-2 border-[#00C805]" 
                        : "bg-slate-700/50 border border-transparent"
                    )}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-slate-400">שכירות חודשית</p>
                        {inlineEditing.field !== "monthlyRent" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startInlineEdit("monthlyRent", selectedProperty.monthlyRent);
                            }}
                            className="text-xs text-[#00C805] hover:text-[#00E806] flex items-center gap-1 font-medium"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <Edit3 className="w-3 h-3" />
                            ערוך
                          </button>
                        )}
                      </div>
                      {inlineEditing.field === "monthlyRent" ? (
                        <div className="flex items-center gap-2 relative z-50">
                          <span className="text-lg text-white font-bold">£</span>
                          <input
                            type="number"
                            value={inlineEditing.value}
                            onChange={(e) => setInlineEditing({ ...inlineEditing, value: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveInlineEdit();
                              if (e.key === "Escape") cancelInlineEdit();
                            }}
                            className="flex-1 bg-[#0B0E14] border-2 border-[#00C805] rounded-lg px-3 py-2 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#00C805]/50"
                            style={{ color: 'white', pointerEvents: 'auto' }}
                            autoFocus
                            placeholder="הזן שכירות"
                          />
                          <button
                            type="button"
                            onClick={saveInlineEdit}
                            className="p-2 bg-[#00C805] hover:bg-[#00E806] text-white rounded-lg font-medium"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelInlineEdit}
                            className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xl font-bold text-white">
                          {formatCurrency(selectedProperty.monthlyRent || 0, selectedProperty.country || "UK")}/month
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Property Info */}
                  <div className="grid grid-cols-2 gap-3">
                    {selectedProperty.energyRating && (
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <p className="text-xs text-slate-400">דירוג אנרגטי</p>
                        <p className="text-lg font-bold text-emerald-400">
                          {selectedProperty.energyRating}
                        </p>
                      </div>
                    )}
                    {selectedProperty.floorArea && (
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <p className="text-xs text-slate-400">שטח</p>
                        <p className="text-lg font-bold text-white">
                          {selectedProperty.floorArea} מ״ר
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Financial Metrics - Auto-calculated */}
                  {financialMetrics && financialMetrics.monthlyRent > 0 && (
                    <div className="pt-4 border-t border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-white flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-cyan-400" />
                          חישוב תשואה
                        </h4>
                        <span className="text-xs text-slate-500">
                          ריבית: {financialMetrics.mortgageRate}% (BoE: {financialMetrics.baseRate}%)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gradient-to-br from-[#00C805]/20 to-[#00A004]/10 rounded-lg p-3 border border-[#00C805]/30">
                          <p className="text-xs text-slate-400">תשואה ברוטו</p>
                          <p className="text-xl font-bold text-[#00C805]">
                            {financialMetrics.grossYield.toFixed(1)}%
                          </p>
                        </div>
                        <div className={cn(
                          "rounded-lg p-3 border",
                          financialMetrics.netYield >= 0 
                            ? "bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border-cyan-500/30"
                            : "bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30"
                        )}>
                          <p className="text-xs text-slate-400">תשואה נטו</p>
                          <p className={cn(
                            "text-xl font-bold",
                            financialMetrics.netYield >= 0 ? "text-cyan-400" : "text-red-400"
                          )}>
                            {financialMetrics.netYield.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      <div className={cn(
                        "rounded-lg p-3 border",
                        financialMetrics.monthlyCashflow >= 0 
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-red-500/10 border-red-500/30"
                      )}>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-400">תזרים חודשי</p>
                          <p className={cn(
                            "text-lg font-bold",
                            financialMetrics.monthlyCashflow >= 0 ? "text-emerald-400" : "text-red-400"
                          )}>
                            {financialMetrics.monthlyCashflow >= 0 ? "+" : ""}£{Math.round(financialMetrics.monthlyCashflow).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-700/30 rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex justify-between text-slate-400">
                          <span>משכנתא חודשית</span>
                          <span>{formatCurrency(Math.round(financialMetrics.monthlyMortgage), selectedProperty.country || "UK")}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>הון עצמי ({DEFAULT_DEPOSIT_PERCENT}%)</span>
                          <span>{formatCurrency(Math.round(financialMetrics.deposit), selectedProperty.country || "UK")}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Cash-on-Cash Return</span>
                          <span className={financialMetrics.cashOnCash >= 0 ? "text-emerald-400" : "text-red-400"}>
                            {financialMetrics.cashOnCash.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 text-center">
                        * חישוב מבוסס על ריבית {selectedProperty.country ? getInterestRateConfig(selectedProperty.country).centralBank : "Bank of England"} {financialMetrics.baseRate}% + מרווח {financialMetrics.mortgageRate - financialMetrics.baseRate}%
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div 
                    className="pt-4 border-t border-slate-700 space-y-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href={`/?postcode=${selectedProperty.postcode}&address=${encodeURIComponent(selectedProperty.address)}`}
                      className="btn-primary w-full flex items-center justify-center gap-2 relative z-20"
                      style={{ pointerEvents: 'auto', position: 'relative' }}
                    >
                      <TrendingUp className="w-4 h-4" />
                      צפה בניתוח מלא
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        console.log("[Edit Button] Clicked", { selectedFolderId, selectedProperty: selectedProperty?.id });
                        
                        // Find folderId if not set
                        let folderId = selectedFolderId;
                        if (!folderId && selectedProperty) {
                          const folder = folders.find(f => 
                            f.properties?.some(p => p.id === selectedProperty.id)
                          );
                          if (folder) {
                            folderId = folder.id;
                            setSelectedFolderId(folder.id);
                            console.log("[Edit Button] Found folder:", folderId);
                          }
                        }
                        
                        if (folderId && selectedProperty) {
                          console.log("[Edit Button] Opening edit modal");
                          openEditModal(folderId, selectedProperty);
                        } else {
                          console.error("[Edit Button] Missing folderId or property", { folderId, selectedProperty });
                          alert("לא ניתן למצוא את התיקייה של הנכס. נסה לבחור את הנכס מהרשימה.");
                        }
                      }}
                      className="w-full py-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-2 relative z-20"
                      style={{ 
                        pointerEvents: 'auto', 
                        position: 'relative',
                        cursor: 'pointer',
                        zIndex: 20
                      }}
                      disabled={!selectedProperty}
                    >
                      <Edit3 className="w-4 h-4" />
                      עריכה מלאה
                    </button>
                  </div>

                  {/* Documents Section */}
                  <div className="pt-4 border-t border-slate-700 mt-4">
                    <PropertyDocuments
                      propertyId={selectedProperty.id}
                      folderId={selectedFolderId || ""}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/30 rounded-xl border border-dashed border-slate-700 p-8 text-center sticky top-24">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">בחר נכס לצפייה בפרטים</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">תיקייה חדשה</h3>
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">שם התיקייה</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="לדוגמה: עסקאות ליברפול"
                  className="input"
                  style={{ color: 'white' }}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">צבע</label>
                <div className="flex gap-2">
                  {FOLDER_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setNewFolderColor(color.id)}
                      className={cn(
                        "w-10 h-10 rounded-lg transition-all",
                        color.bg,
                        newFolderColor === color.id
                          ? "ring-2 ring-white ring-offset-2 ring-offset-slate-800"
                          : ""
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-700 flex gap-3">
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={createFolder}
                disabled={!newFolderName.trim()}
                className="flex-1 btn-primary"
              >
                צור תיקייה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {showEditModal && editingProperty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" />
                עריכת נכס
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProperty(null);
                }}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Address (read-only) */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">כתובת</label>
                <p className="text-white font-medium">{editingProperty.address}</p>
                <p className="text-sm text-slate-500">{editingProperty.postcode}</p>
              </div>

              {/* Purchase Price */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">מחיר רכישה (£)</label>
                <input
                  type="number"
                  value={editingProperty.purchasePrice || ""}
                  onChange={(e) => setEditingProperty({
                    ...editingProperty,
                    purchasePrice: e.target.value ? Number(e.target.value) : null,
                  })}
                  placeholder="150000"
                  className="input"
                  style={{ color: 'white' }}
                />
              </div>

              {/* Last/Current Price */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">שווי נוכחי (£)</label>
                <input
                  type="number"
                  value={editingProperty.lastPrice || ""}
                  onChange={(e) => setEditingProperty({
                    ...editingProperty,
                    lastPrice: e.target.value ? Number(e.target.value) : null,
                  })}
                  placeholder="160000"
                  className="input"
                  style={{ color: 'white' }}
                />
              </div>

              {/* Monthly Rent */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">שכירות חודשית (£)</label>
                <input
                  type="number"
                  value={editingProperty.monthlyRent || ""}
                  onChange={(e) => setEditingProperty({
                    ...editingProperty,
                    monthlyRent: e.target.value ? Number(e.target.value) : null,
                  })}
                  placeholder="650"
                  className="input"
                  style={{ color: 'white' }}
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">סטטוס</label>
                <select
                  value={editingProperty.status || "watching"}
                  onChange={(e) => setEditingProperty({
                    ...editingProperty,
                    status: e.target.value as "owned" | "watching" | "sold",
                  })}
                  className="input"
                  style={{ color: 'white' }}
                >
                  <option value="watching">במעקב</option>
                  <option value="owned">בבעלותי</option>
                  <option value="sold">נמכר</option>
                </select>
              </div>

              {/* Purchase Date */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">תאריך רכישה</label>
                <input
                  type="date"
                  value={editingProperty.purchaseDate || ""}
                  onChange={(e) => setEditingProperty({
                    ...editingProperty,
                    purchaseDate: e.target.value || null,
                  })}
                  className="input"
                  style={{ color: 'white' }}
                />
              </div>

              {/* Floor Area */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">שטח (מ״ר)</label>
                <input
                  type="number"
                  value={editingProperty.floorArea || ""}
                  onChange={(e) => setEditingProperty({
                    ...editingProperty,
                    floorArea: e.target.value ? Number(e.target.value) : null,
                  })}
                  placeholder="75"
                  className="input"
                  style={{ color: 'white' }}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">הערות</label>
                <textarea
                  value={editingProperty.notes || ""}
                  onChange={(e) => setEditingProperty({
                    ...editingProperty,
                    notes: e.target.value,
                  })}
                  placeholder="הערות על הנכס..."
                  rows={3}
                  className="input resize-none"
                  style={{ color: 'white' }}
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-700 flex gap-3 sticky bottom-0 bg-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProperty(null);
                }}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={saveEditedProperty}
                className="flex-1 btn-primary"
              >
                שמור שינויים
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
