"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Loader2,
  Sparkles,
  AlertCircle,
  Trash2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "../lib/utils";
import { type PropertyAnalysis } from "../services/api";
import { getPropertyDocuments, type DocumentMetadata } from "./DocumentManager";
import {
  loadPropertyDocuments,
  type PropertyDocument,
} from "../lib/documents-db";
import { useAuth } from "../lib/auth";
import { loadUserProperties } from "../lib/portfolio-db";

// =============================================================================
// Types
// =============================================================================

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface FinancialData {
  grossYield?: number;
  netYield?: number;
  capRate?: number;
  cashOnCash?: number;
  monthlyCashFlow?: number;
  annualCashFlow?: number;
  totalCashRequired?: number;
  breakEvenRent?: number;
  paybackYears?: number;
  maxRateBeforeLoss?: number;
  maxVacancyBeforeLoss?: number;
}

interface AIChatProps {
  propertyData: PropertyAnalysis | null;
  propertyId?: string;
  financialData?: FinancialData | null;
  isOpen: boolean;
  onClose: () => void;
}

// =============================================================================
// AI Chat Component
// =============================================================================

export default function AIChat({
  propertyData,
  propertyId,
  financialData,
  isOpen,
  onClose,
}: AIChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [propertyDocuments, setPropertyDocuments] = useState<
    PropertyDocument[]
  >([]);
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load property documents and all properties for context
  useEffect(() => {
    if (!user?.id || !isOpen) return;

    const loadContext = async () => {
      // Load documents for this property
      if (propertyId) {
        try {
          const docs = await loadPropertyDocuments(user.id, propertyId);
          setPropertyDocuments(docs);
        } catch (error) {
          console.error("Failed to load documents:", error);
        }
      }

      // Load all properties for portfolio context
      try {
        const props = await loadUserProperties(user.id);
        setAllProperties(props);
      } catch (error) {
        console.error("Failed to load properties:", error);
      }
    };

    loadContext();
  }, [user?.id, propertyId, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Build context from property data (including portfolio context)
  const buildPropertyContext = useCallback((): string => {
    const parts: string[] = [];

    // If we have propertyId but no propertyData, build context from portfolio
    if (propertyId && !propertyData && allProperties.length > 0) {
      const property = allProperties.find((p) => p.id === propertyId);
      if (property) {
        parts.push(`## נתוני הנכס
- כתובת: ${property.address || property.postcode}
- מיקוד: ${property.postcode}
- מדינה: ${property.country}
- מחיר רכישה: ${property.purchasePrice ? `£${property.purchasePrice.toLocaleString()}` : "לא צוין"}
- שכירות חודשית: ${property.monthlyRent ? `£${property.monthlyRent.toLocaleString()}` : "לא צוין"}
- תאריך רכישה: ${property.purchaseDate || "לא צוין"}
- סטטוס: ${property.status || "watching"}`);
      }
    } else if (propertyData) {
      // Location
      parts.push(`## מיקום
- מיקוד: ${propertyData.postcode.postcode}
- עיר/אזור: ${propertyData.postcode.admin_district || "לא ידוע"}
- מועצה: ${propertyData.postcode.admin_county || "לא ידוע"}
- קואורדינטות: ${propertyData.postcode.latitude}, ${propertyData.postcode.longitude}`);

      // EPC Data
      if (propertyData.epc) {
        parts.push(`## נתוני EPC
- דירוג אנרגטי: ${propertyData.epc.currentEnergyRating || "לא ידוע"}
- ציון יעילות: ${propertyData.epc.currentEnergyEfficiency || "לא ידוע"}/100
- שטח כולל: ${propertyData.epc.totalFloorArea || "לא ידוע"} מ"ר
- מספר חדרים: ${propertyData.epc.numberOfRooms || "לא ידוע"}
- סוג נכס: ${propertyData.epc.buildingType || "לא ידוע"}
- כתובת: ${propertyData.epc.address || "לא ידוע"}`);
      }

      // Prices
      if (propertyData.prices) {
        parts.push(`## נתוני מחירים (Land Registry)
- מגמת שוק: ${propertyData.prices.marketSentiment || "לא ידוע"}
- שינוי מחיר שנתי: ${propertyData.prices.priceGrowth?.toFixed(1) || "לא ידוע"}%
- סה"כ עסקאות: ${propertyData.prices.soldPrices?.length || 0}`);

        if (propertyData.prices.latestSale) {
          parts.push(
            `- עסקה אחרונה: £${propertyData.prices.latestSale.price?.toLocaleString()} (${propertyData.prices.latestSale.date})`,
          );
        }

        if (propertyData.prices.averageByYear?.length > 0) {
          const latest =
            propertyData.prices.averageByYear[
              propertyData.prices.averageByYear.length - 1
            ];
          parts.push(
            `- מחיר ממוצע (${latest.year}): £${latest.avgPrice?.toLocaleString()}`,
          );
        }
      }

      // Crime
      if (propertyData.crime) {
        parts.push(`## נתוני פשיעה
- רמת סיכון: ${propertyData.crime.riskLevel || "לא ידוע"}
- סה"כ אירועים (6 חודשים): ${propertyData.crime.totalCrimes || 0}
- קטגוריות נפוצות: ${
          propertyData.crime.categories
            ? Object.entries(propertyData.crime.categories)
                .slice(0, 3)
                .map(([cat, count]) => `${cat}: ${count}`)
                .join(", ")
            : "לא ידוע"
        }`);
      }

      // Proximity
      if (propertyData.proximity) {
        parts.push(`## קרבה למוסדות
- תחנת רכבת: ${propertyData.proximity.trainStation?.name || "לא נמצא"} (${propertyData.proximity.trainStation?.walkingTime || "-"} דקות הליכה)
- בית חולים: ${propertyData.proximity.hospital?.name || "לא נמצא"} (${propertyData.proximity.hospital?.walkingTime || "-"} דקות הליכה)
- אוניברסיטה: ${propertyData.proximity.university?.name || "לא נמצא"}`);
      }

      // Documents from old DocumentManager (legacy)
      if (propertyId) {
        const docs = getPropertyDocuments(propertyId);
        if (docs.length > 0) {
          parts.push(`## מסמכים מצורפים (legacy)
${docs.map((d) => `- ${d.name} (${d.type})`).join("\n")}`);
        }
      }

      // Financial Analysis (from simulator)
      if (financialData) {
        parts.push(`## ניתוח פיננסי (סימולטור)
- תשואה ברוטו: ${financialData.grossYield?.toFixed(1) || "לא חושב"}%
- תשואה נטו: ${financialData.netYield?.toFixed(1) || "לא חושב"}%
- Cap Rate: ${financialData.capRate?.toFixed(1) || "לא חושב"}%
- Cash-on-Cash Return: ${financialData.cashOnCash?.toFixed(1) || "לא חושב"}%
- Cash Flow חודשי: £${financialData.monthlyCashFlow?.toLocaleString() || "לא חושב"}
- Cash Flow שנתי: £${financialData.annualCashFlow?.toLocaleString() || "לא חושב"}
- הון עצמי נדרש: £${financialData.totalCashRequired?.toLocaleString() || "לא חושב"}
- שכירות Break-Even: £${financialData.breakEvenRent?.toLocaleString() || "לא חושב"}/חודש
- זמן החזר השקעה: ${financialData.paybackYears && financialData.paybackYears < 100 ? financialData.paybackYears.toFixed(1) + " שנים" : "לא רלוונטי"}
- ריבית מקסימלית לפני הפסד: ${financialData.maxRateBeforeLoss?.toFixed(1) || "לא חושב"}%
- Vacancy מקסימלי לפני הפסד: ${financialData.maxVacancyBeforeLoss || "לא חושב"}%`);
      }
    }

    // Documents from Supabase (new system)
    if (propertyDocuments.length > 0) {
      parts.push(`## מסמכים מצורפים (${propertyDocuments.length} קבצים)
${propertyDocuments
  .map((d) => {
    const uploadDate = new Date(d.uploaded_at).toLocaleDateString("he-IL");
    return `- ${d.file_name} (${d.folder_id}, ${uploadDate})${d.summary ? ` - ${d.summary}` : ""}`;
  })
  .join("\n")}`);
    }

    // Add portfolio context if available
    if (allProperties.length > 0) {
      parts.push(`## תיק השקעות כולל (${allProperties.length} נכסים)
${allProperties
  .map((p) => {
    const rent = p.monthlyRent ? `שכירות: £${p.monthlyRent}/חודש` : "";
    const price = p.purchasePrice
      ? `מחיר רכישה: £${p.purchasePrice.toLocaleString()}`
      : "";
    return `- ${p.address || p.postcode} - ${price} ${rent}`;
  })
  .join("\n")}`);
    }

    return parts.join("\n\n");
  }, [
    propertyData,
    propertyId,
    financialData,
    propertyDocuments,
    allProperties,
  ]);

  // Send message to Gemini API
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      const context = buildPropertyContext();

      // Call our API route
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          context,
          history: messages.slice(-6), // Last 6 messages for context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `שגיאת שרת: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: data.response || "לא התקבלה תשובה מה-AI",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("AI Chat Error:", err);
      setError(err instanceof Error ? err.message : "שגיאה בתקשורת עם ה-AI");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  // Suggested questions
  const suggestedQuestions = [
    "מה הערכתך לפוטנציאל ההשקעה בנכס זה?",
    "האם המחיר תואם את ממוצע השוק?",
    "מהם הסיכונים העיקריים?",
    "איך משפיע דירוג ה-EPC על ערך הנכס?",
  ];

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed z-50 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 flex flex-col transition-all duration-300",
        isExpanded ? "inset-4" : "bottom-4 left-4 w-96 h-[500px]",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">
              AI Property Analyst
            </h3>
            <p className="text-xs text-slate-500">
              {propertyId ? `נכס נבחר` : "בחר נכס לניתוח"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={clearChat}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            title="נקה שיחה"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-4">
              שאל אותי כל שאלה על הנכס
            </p>

            {/* Suggested Questions */}
            <div className="space-y-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setInputValue(q);
                    inputRef.current?.focus();
                  }}
                  className="block w-full text-right text-xs bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 px-3 py-2 rounded-lg transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              msg.role === "user" ? "flex-row-reverse" : "",
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                msg.role === "user" ? "bg-emerald-500/20" : "bg-purple-500/20",
              )}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4 text-emerald-400" />
              ) : (
                <Bot className="w-4 h-4 text-purple-400" />
              )}
            </div>
            <div
              className={cn(
                "flex-1 max-w-[80%] rounded-2xl px-4 py-2",
                msg.role === "user"
                  ? "bg-emerald-500/20 text-white"
                  : "bg-slate-800 text-slate-200",
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString("he-IL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <div className="bg-slate-800 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-sm text-slate-400">מנתח...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="שאל על הנכס..."
            disabled={isLoading || !propertyId}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
            style={{ color: "white" }}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim() || !propertyId}
            className={cn(
              "p-3 rounded-xl transition-all",
              isLoading || !inputValue.trim()
                ? "bg-slate-700 text-slate-500"
                : "bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/20",
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        {!propertyData && (
          <p className="text-xs text-slate-500 mt-2 text-center">
            חפש נכס כדי להתחיל לשוחח עם ה-AI
          </p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Chat Toggle Button
// =============================================================================

interface ChatToggleProps {
  onClick: () => void;
  hasNewMessage?: boolean;
}

export function ChatToggleButton({ onClick, hasNewMessage }: ChatToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-4 left-4 z-40 p-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105"
    >
      <MessageCircle className="w-6 h-6 text-white" />
      {hasNewMessage && (
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}
