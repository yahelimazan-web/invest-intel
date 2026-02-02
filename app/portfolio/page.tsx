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
  Sparkles,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "../lib/utils";
import { useAuth } from "../lib/auth";
import { 
  loadUserFolders, 
  saveUserFolders, 
  deleteProperty,
  updateProperty,
  loadUserProperties,
  type PropertyFolder, 
  type SavedProperty,
  type Country
} from "../lib/portfolio-db";
import PropertyDocuments from "../components/PropertyDocuments";
import PropertyDocumentFolders from "../components/PropertyDocumentFolders";
import AIChat from "../components/AIChat";
import ChatInterface, { ChatToggleButton } from "../components/ChatInterface";

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
  { id: "emerald", bg: "bg-[rgba(0,209,178,0.2)]", text: "text-[#00D1B2]", border: "border-[rgba(0,209,178,0.3)]" },
  { id: "blue", bg: "bg-[rgba(0,163,255,0.2)]", text: "text-[#00A3FF]", border: "border-[rgba(0,163,255,0.3)]" },
  { id: "purple", bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  { id: "amber", bg: "bg-[rgba(255,176,32,0.2)]", text: "text-[#FFB020]", border: "border-[rgba(255,176,32,0.3)]" },
  { id: "pink", bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/30" },
  { id: "cyan", bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
];

// =============================================================================
// Portfolio Page Component
// =============================================================================

export default function PortfolioPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [folders, setFolders] = useState<PropertyFolder[]>([]);
  const [properties, setProperties] = useState<SavedProperty[]>([]); // Direct from properties table
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("emerald");
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<SavedProperty | null>(null);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  
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
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);

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

  // Load properties directly from properties table (sync with MyProperties)
  useEffect(() => {
    if (authLoading || !user?.id) return;
    
    const loadProperties = async () => {
      setIsLoadingProperties(true);
      try {
        const props = await loadUserProperties(user.id);
        setProperties(props);
        console.log("[Portfolio] Loaded", props.length, "properties from properties table");
      } catch (e) {
        console.error("Failed to load properties from Supabase:", e);
        setProperties([]);
      } finally {
        setIsLoadingProperties(false);
      }
    };

    loadProperties();
    
    // Refresh every 5 seconds to sync with MyProperties changes
    const interval = setInterval(loadProperties, 5000);
    return () => clearInterval(interval);
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
      <div className="min-h-screen bg-[#0E1116] flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 bg-[rgba(0,163,255,0.15)] border border-[rgba(0,163,255,0.3)] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FolderOpen className="w-10 h-10 text-[#00A3FF]" />
          </div>
          <h1 className="text-2xl font-bold text-[#E6EEF3] mb-4">תיק השקעות פרטי</h1>
          <p className="text-[#9AA6B2] mb-8">
            כדי לשמור נכסים ולנהל את תיק ההשקעות שלך, עליך להתחבר לחשבונך.
            <br />
            הנתונים שלך יישמרו בצורה מאובטחת ונפרדת ממשתמשים אחרים.
          </p>
          <Link href="/login" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
            <LogIn className="w-5 h-5" />
            התחבר / הירשם
          </Link>
          <div className="mt-6">
            <Link href="/" className="text-sm text-[#9AA6B2] hover:text-[#E6EEF3] transition-colors">
              ← חזור לדשבורד
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1116]" dir="rtl">
      {/* Header */}
      <header className="bg-[#12141A] border-b border-[rgba(255,255,255,0.06)] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 bg-[#17191F] hover:bg-[#12141A] rounded-lg transition-colors border border-[rgba(255,255,255,0.06)]"
              >
                <ArrowLeft className="w-5 h-5 text-[#9AA6B2]" />
              </Link>
              <div>
                <h1 className="text-3xl font-semibold text-[#E6EEF3] flex items-center gap-3 mb-1">
                  <FolderOpen className="w-7 h-7 text-[#00A3FF]" />
                  תיק ההשקעות שלי
                </h1>
                <p className="text-sm text-[#9AA6B2]">ניהול נכסים ותיקיות</p>
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
      <div className="bg-[#12141A] border-b border-[rgba(255,255,255,0.06)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card flex flex-row items-center gap-3">
              <div className="p-2 bg-[rgba(0,163,255,0.15)] border border-[rgba(0,163,255,0.3)] rounded-lg">
                <FolderOpen className="w-5 h-5 text-[#00A3FF]" />
              </div>
              <div>
                <p className="stat-value">{folders.length}</p>
                <p className="stat-label">תיקיות</p>
              </div>
            </div>
            <div className="stat-card flex flex-row items-center gap-3">
              <div className="p-2 bg-[rgba(0,163,255,0.15)] rounded-lg">
                <Building2 className="w-5 h-5 text-[#00A3FF]" />
              </div>
              <div>
                <p className="stat-value">{totalProperties}</p>
                <p className="stat-label">נכסים שמורים</p>
              </div>
            </div>
            <div className="stat-card flex flex-row items-center gap-3">
              <div className="p-2 bg-[rgba(255,176,32,0.15)] rounded-lg">
                <PoundSterling className="w-5 h-5 text-[#FFB020]" />
              </div>
              <div>
                <p className="stat-value">
                  {totalValue > 0 ? `£${(totalValue / 1000).toFixed(0)}K` : "—"}
                </p>
                <p className="stat-label">שווי משוער</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9AA6B2] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש נכסים לפי כתובת, מיקוד או הערות..."
            className="input w-full pr-12 pl-4"
            style={{ color: '#E6EEF3' }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Folders List */}
          <div className="lg:col-span-2 space-y-4">
            {folders.length === 0 ? (
              <div className="card p-12 text-center">
                <FolderOpen className="w-16 h-16 text-[#9AA6B2] mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-[#E6EEF3] mb-2">אין תיקיות עדיין</h3>
                <p className="text-[#9AA6B2] mb-6">צור תיקייה חדשה כדי להתחיל לארגן את הנכסים שלך</p>
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
            ) : (folders.every(f => f.properties.length === 0) && properties.length === 0) ? (
              <div className="card p-12 text-center">
                <Building2 className="w-16 h-16 text-[#9AA6B2] mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-[#E6EEF3] mb-2">אין נכסים בתיק שלך</h3>
                <p className="text-[#9AA6B2] mb-6">התחל להוסיף נכסים כדי לבנות את תיק ההשקעות שלך</p>
                <Link
                  href="/"
                  className="btn-primary inline-flex items-center gap-2 px-6 py-3 relative z-10"
                  style={{ pointerEvents: 'auto' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus className="w-5 h-5" />
                  הוסף נכס ראשון
                </Link>
              </div>
            ) : (
              <>
                {/* Properties from properties table (synced with MyProperties) */}
                {properties.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[#E6EEF3]">נכסים שלי (מ-My Properties)</h3>
                      <span className="text-sm text-[#9AA6B2]">{properties.length} נכסים</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {properties.map((property) => (
                        <div
                          key={property.id}
                          onClick={() => {
                            setSelectedProperty(property);
                            setSelectedFolderId(null); // Properties from table don't have folder
                            cancelInlineEdit();
                          }}
                          className="property-card"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <p className="font-semibold text-[#E6EEF3] text-lg mb-1">{property.address}</p>
                              <p className="text-sm text-[#9AA6B2]">{property.postcode}</p>
                            </div>
                            <span className="text-xl ml-2">
                              {property.country === "UK" ? "🇬🇧" : 
                               property.country === "Israel" ? "🇮🇱" :
                               property.country === "USA" ? "🇺🇸" :
                               property.country === "Cyprus" ? "🇨🇾" :
                               property.country === "Greece" ? "🇬🇷" :
                               property.country === "Portugal" ? "🇵🇹" : "🇬🇪"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-[rgba(255,255,255,0.06)]">
                            {property.purchasePrice && (
                              <span className="text-[#00A3FF] font-semibold text-lg">
                                {formatCurrencyCompact(property.purchasePrice, property.country || "UK")}
                              </span>
                            )}
                            {property.monthlyRent && (
                              <span className="text-[#9AA6B2] text-sm">
                                שכירות: {formatCurrencyCompact(property.monthlyRent, property.country || "UK")}/חודש
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Folders with properties */}
                {folders.map((folder) => {
                const colorClasses = getColorClasses(folder.color);
                const isExpanded = expandedFolders.has(folder.id);
                const filteredProps = getFilteredProperties(folder.properties);

                return (
                  <div
                    key={folder.id}
                    className="card"
                  >
                    {/* Folder Header */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        toggleFolder(folder.id);
                      }}
                      className="w-full p-4 flex items-center justify-between hover:bg-[#17191F] transition-colors rounded-t-xl relative z-10"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg bg-[rgba(0,163,255,0.15)] border border-[rgba(0,163,255,0.3)]")}>
                          {folder.icon === "heart" ? (
                            <Heart className="w-5 h-5 text-[#00A3FF]" />
                          ) : folder.icon === "star" ? (
                            <Star className="w-5 h-5 text-[#FFB020]" />
                          ) : (
                            <FolderOpen className="w-5 h-5 text-[#00A3FF]" />
                          )}
                        </div>
                        <div className="text-right">
                          <h3 className="font-semibold text-[#E6EEF3]">{folder.name}</h3>
                          <p className="text-xs text-[#9AA6B2]">{folder.properties.length} נכסים</p>
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
                            className="p-2 text-[#9AA6B2] hover:text-[#FF4D4F] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-[#9AA6B2]" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-[#9AA6B2]" />
                        )}
                      </div>
                    </button>

                    {/* Folder Content */}
                    {isExpanded && (
                      <div className="border-t border-[rgba(255,255,255,0.06)]">
                        {filteredProps.length === 0 ? (
                          <div className="p-6 text-center text-[#9AA6B2]">
                            <Home className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="mb-3">אין נכסים בתיקייה זו</p>
                            <Link
                              href="/"
                              className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm font-medium relative z-10"
                              style={{ pointerEvents: 'auto' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Plus className="w-4 h-4" />
                              הוסף נכס
                            </Link>
                          </div>
                        ) : (
                          <div className="divide-y divide-[rgba(255,255,255,0.06)]">
                            {filteredProps.map((property) => (
                              <div
                                key={property.id}
                                className="p-4 hover:bg-[#17191F] transition-colors relative group"
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
                                    <p className="font-medium text-[#E6EEF3]">{property.address}</p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-[#9AA6B2]">
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
                                      <span className="text-[#00A3FF] font-semibold">
                                        {formatCurrencyCompact(property.lastPrice, property.country || "UK")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {/* Action buttons - separate from clickable area */}
                                <div 
                                  className="flex items-center gap-2 mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]"
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
                                    className="btn-secondary flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm relative z-20"
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
                                    className="px-3 py-2 text-sm text-[#9AA6B2] hover:text-[#FF4D4F] hover:bg-[rgba(255,77,79,0.1)] rounded-lg transition-colors relative z-20 border border-[rgba(255,255,255,0.06)]"
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
              })}
              </>
            )}
          </div>

          {/* Property Detail Sidebar */}
          <div className="lg:col-span-1">
            {selectedProperty ? (
              <div 
                className="card sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
                style={{ position: 'relative', zIndex: 10 }}
              >
                <div className="p-5 border-b border-[rgba(255,255,255,0.06)] sticky top-0 bg-[#12141A] backdrop-blur z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-[#E6EEF3] text-lg flex items-center gap-2">
                      פרטי נכס
                      {inlineEditing.field && (
                        <span className="badge badge-info flex items-center gap-1 text-xs">
                          <Edit3 className="w-3 h-3" />
                          מצב עריכה
                        </span>
                      )}
                      {saveSuccess && (
                        <span className="badge badge-success flex items-center gap-1 text-xs">
                          <Check className="w-3 h-3" />
                          נשמר בהצלחה!
                        </span>
                      )}
                      {isSaving && (
                        <RefreshCw className="w-3 h-3 text-[#9AA6B2] animate-spin" />
                      )}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProperty(null);
                        cancelInlineEdit();
                      }}
                      className="p-1 text-[#9AA6B2] hover:text-[#E6EEF3]"
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
                    <p className="text-lg font-semibold text-[#E6EEF3] mb-1">{selectedProperty.address}</p>
                    <p className="text-sm text-[#9AA6B2]">{selectedProperty.postcode}</p>
                  </div>

                  {/* Editable Financial Fields */}
                  <div className="space-y-3">
                    {/* Purchase Price - Editable */}
                    <div className={cn(
                      "rounded-lg p-4 transition-all",
                      inlineEditing.field === "purchasePrice" 
                        ? "bg-[#17191F] border-2 border-[#00A3FF]" 
                        : "bg-[#17191F] border border-[rgba(255,255,255,0.06)]"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-[#9AA6B2] font-medium">מחיר רכישה</p>
                        {inlineEditing.field !== "purchasePrice" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startInlineEdit("purchasePrice", selectedProperty.purchasePrice || selectedProperty.lastPrice);
                            }}
                            className="text-xs text-[#00A3FF] hover:text-[#0090E6] flex items-center gap-1 font-medium transition-colors"
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
                            className="flex-1 bg-[#0E1116] border-2 border-[#00A3FF] rounded-lg px-3 py-2 text-[#E6EEF3] text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#00A3FF]/30"
                            style={{ pointerEvents: 'auto' }}
                            autoFocus
                            placeholder="הזן מחיר"
                          />
                          <button
                            type="button"
                            onClick={saveInlineEdit}
                            className="p-2 bg-[#00A3FF] hover:bg-[#0090E6] text-white rounded-lg font-medium transition-colors"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelInlineEdit}
                            className="btn-secondary p-2"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-2xl font-semibold text-[#00A3FF]">
                          {formatCurrency(selectedProperty.purchasePrice || selectedProperty.lastPrice || 0, selectedProperty.country || "UK")}
                        </p>
                      )}
                    </div>

                    {/* Monthly Rent - Editable */}
                    <div className={cn(
                      "rounded-lg p-3 transition-all",
                      inlineEditing.field === "monthlyRent" 
                        ? "bg-[#17191F] border-2 border-[#00A3FF]" 
                        : "bg-[#17191F] border border-[rgba(255,255,255,0.06)]"
                    )}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-[#9AA6B2]">שכירות חודשית</p>
                        {inlineEditing.field !== "monthlyRent" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startInlineEdit("monthlyRent", selectedProperty.monthlyRent);
                            }}
                            className="text-xs text-[#00A3FF] hover:text-[#0090E6] flex items-center gap-1 font-medium"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <Edit3 className="w-3 h-3" />
                            ערוך
                          </button>
                        )}
                      </div>
                      {inlineEditing.field === "monthlyRent" ? (
                        <div className="flex items-center gap-2 relative z-50">
                          <span className="text-lg text-[#E6EEF3] font-bold">£</span>
                          <input
                            type="number"
                            value={inlineEditing.value}
                            onChange={(e) => setInlineEditing({ ...inlineEditing, value: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveInlineEdit();
                              if (e.key === "Escape") cancelInlineEdit();
                            }}
                            className="flex-1 bg-[#0E1116] border-2 border-[#00A3FF] rounded-lg px-3 py-2 text-[#E6EEF3] text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#00A3FF]/30"
                            style={{ pointerEvents: 'auto' }}
                            autoFocus
                            placeholder="הזן שכירות"
                          />
                          <button
                            type="button"
                            onClick={saveInlineEdit}
                            className="p-2 bg-[#00A3FF] hover:bg-[#0090E6] text-white rounded-lg font-medium"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelInlineEdit}
                            className="btn-secondary p-2"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xl font-bold text-[#E6EEF3]">
                          {formatCurrency(selectedProperty.monthlyRent || 0, selectedProperty.country || "UK")}/month
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Property Info */}
                  <div className="grid grid-cols-2 gap-3">
                    {selectedProperty.energyRating && (
                      <div className="bg-[#17191F] rounded-lg p-3 border border-[rgba(255,255,255,0.06)]">
                        <p className="text-xs text-[#9AA6B2]">דירוג אנרגטי</p>
                        <p className="text-lg font-bold text-[#00D1B2]">
                          {selectedProperty.energyRating}
                        </p>
                      </div>
                    )}
                    {selectedProperty.floorArea && (
                      <div className="bg-[#17191F] rounded-lg p-3 border border-[rgba(255,255,255,0.06)]">
                        <p className="text-xs text-[#9AA6B2]">שטח</p>
                        <p className="text-lg font-bold text-[#E6EEF3]">
                          {selectedProperty.floorArea} מ״ר
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Financial Metrics - Auto-calculated */}
                  {financialMetrics && financialMetrics.monthlyRent > 0 && (
                    <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-white flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-cyan-400" />
                          חישוב תשואה
                        </h4>
                        <span className="text-xs text-[#9AA6B2]">
                          ריבית: {financialMetrics.mortgageRate}% (BoE: {financialMetrics.baseRate}%)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[rgba(0,163,255,0.1)] rounded-lg p-3 border border-[rgba(0,163,255,0.3)]">
                          <p className="text-xs text-[#9AA6B2]">תשואה ברוטו</p>
                          <p className="text-xl font-bold text-[#00A3FF]">
                            {financialMetrics.grossYield.toFixed(1)}%
                          </p>
                        </div>
                        <div className={cn(
                          "rounded-lg p-3 border",
                          financialMetrics.netYield >= 0 
                            ? "bg-[rgba(0,163,255,0.1)] border-[rgba(0,163,255,0.3)]"
                            : "bg-red-500/10 border-red-500/30"
                        )}>
                          <p className="text-xs text-[#9AA6B2]">תשואה נטו</p>
                          <p className={cn(
                            "text-xl font-bold",
                            financialMetrics.netYield >= 0 ? "text-[#00A3FF]" : "text-red-400"
                          )}>
                            {financialMetrics.netYield.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      <div className={cn(
                        "rounded-lg p-3 border",
                        financialMetrics.monthlyCashflow >= 0 
                          ? "bg-[rgba(0,209,178,0.1)] border-[rgba(0,209,178,0.3)]"
                          : "bg-red-500/10 border-red-500/30"
                      )}>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-[#9AA6B2]">תזרים חודשי</p>
                          <p className={cn(
                            "text-lg font-bold",
                            financialMetrics.monthlyCashflow >= 0 ? "text-[#00D1B2]" : "text-red-400"
                          )}>
                            {financialMetrics.monthlyCashflow >= 0 ? "+" : ""}£{Math.round(financialMetrics.monthlyCashflow).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#17191F] rounded-lg p-3 space-y-2 text-sm border border-[rgba(255,255,255,0.06)]">
                        <div className="flex justify-between text-[#9AA6B2]">
                          <span>משכנתא חודשית</span>
                          <span>{formatCurrency(Math.round(financialMetrics.monthlyMortgage), selectedProperty.country || "UK")}</span>
                        </div>
                        <div className="flex justify-between text-[#9AA6B2]">
                          <span>הון עצמי ({DEFAULT_DEPOSIT_PERCENT}%)</span>
                          <span>{formatCurrency(Math.round(financialMetrics.deposit), selectedProperty.country || "UK")}</span>
                        </div>
                        <div className="flex justify-between text-[#9AA6B2]">
                          <span>Cash-on-Cash Return</span>
                          <span className={financialMetrics.cashOnCash >= 0 ? "text-[#00D1B2]" : "text-red-400"}>
                            {financialMetrics.cashOnCash.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#9AA6B2] text-center">
                        * חישוב מבוסס על ריבית {selectedProperty.country ? getInterestRateConfig(selectedProperty.country).centralBank : "Bank of England"} {financialMetrics.baseRate}% + מרווח {financialMetrics.mortgageRate - financialMetrics.baseRate}%
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div 
                    className="pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-2"
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
                      className="btn-secondary w-full py-2 flex items-center justify-center gap-2 relative z-20"
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

                  {/* Documents Section with 4 Fixed Folders */}
                  <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] mt-4">
                    <PropertyDocumentFolders
                      propertyId={selectedProperty.id}
                      propertyName={selectedProperty.address}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="panel rounded-xl border border-dashed border-[rgba(255,255,255,0.12)] p-8 text-center sticky top-24">
                <Building2 className="w-12 h-12 text-[#9AA6B2] mx-auto mb-3" />
                <p className="text-[#9AA6B2]">בחר נכס לצפייה בפרטים</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#E6EEF3]">תיקייה חדשה</h3>
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="p-2 text-[#9AA6B2] hover:text-[#E6EEF3]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm text-[#9AA6B2] block mb-2">שם התיקייה</label>
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
                <label className="text-sm text-[#9AA6B2] block mb-2">צבע</label>
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
                          ? "ring-2 ring-white ring-offset-2 ring-offset-[#12141A]"
                          : ""
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[rgba(255,255,255,0.06)] flex gap-3">
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="flex-1 btn-secondary py-2"
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
          <div className="card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between sticky top-0 bg-[#12141A]">
              <h3 className="text-lg font-semibold text-[#E6EEF3] flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#00A3FF]" />
                עריכת נכס
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProperty(null);
                }}
                className="p-2 text-[#9AA6B2] hover:text-[#E6EEF3]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Address (read-only) */}
              <div>
                <label className="text-sm text-[#9AA6B2] block mb-2">כתובת</label>
                <p className="text-[#E6EEF3] font-medium">{editingProperty.address}</p>
                <p className="text-sm text-[#9AA6B2]">{editingProperty.postcode}</p>
              </div>

              {/* Purchase Price */}
              <div>
                <label className="text-sm text-[#9AA6B2] block mb-2">מחיר רכישה (£)</label>
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
                <label className="text-sm text-[#9AA6B2] block mb-2">שכירות חודשית (£)</label>
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
                <label className="text-sm text-[#9AA6B2] block mb-2">סטטוס</label>
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
                <label className="text-sm text-[#9AA6B2] block mb-2">תאריך רכישה</label>
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
                <label className="text-sm text-[#9AA6B2] block mb-2">שטח (מ״ר)</label>
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
                <label className="text-sm text-[#9AA6B2] block mb-2">הערות</label>
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

      {/* AI Chat - Floating */}
      {selectedProperty && (
        <AIChat
          propertyData={null}
          propertyId={selectedProperty.id}
          financialData={null}
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
        />
      )}

      {/* AI Chat - Floating */}
      {selectedProperty && (
        <AIChat
          propertyData={null}
          propertyId={selectedProperty.id}
          financialData={null}
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
        />
      )}

      {/* AI Chat Toggle Button - Property Specific */}
      {selectedProperty && !isAIChatOpen && !isChatInterfaceOpen && (
        <button
          type="button"
          onClick={() => setIsAIChatOpen(true)}
          className="fixed bottom-6 left-6 w-14 h-14 bg-[#00A3FF] hover:bg-[#0090E6] text-white rounded-full shadow-lg shadow-[#00A3FF]/30 flex items-center justify-center transition-all z-50"
          style={{ pointerEvents: 'auto' }}
          title="שאל את ה-AI על הנכס"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* Chat Interface - Portfolio-wide AI Assistant */}
      <ChatInterface
        isOpen={isChatInterfaceOpen}
        onClose={() => setIsChatInterfaceOpen(false)}
      />

      {/* Chat Interface Toggle Button - Portfolio Wide */}
      {!isChatInterfaceOpen && !isAIChatOpen && (
        <button
          type="button"
          onClick={() => setIsChatInterfaceOpen(true)}
          className="fixed bottom-6 left-24 w-14 h-14 bg-[#00A3FF] hover:bg-[#0090E6] rounded-full shadow-lg shadow-[#00A3FF]/30 transition-all hover:scale-105 z-50 flex items-center justify-center"
          style={{ pointerEvents: 'auto' }}
          title="פתח צ'אט AI לתיק ההשקעות"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
}
