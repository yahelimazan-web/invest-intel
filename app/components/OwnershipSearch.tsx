"use client";

import { useState, useCallback } from "react";
import {
  Building,
  Search,
  Loader2,
  ExternalLink,
  User,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle2,
  FileText,
  Briefcase,
  Users,
} from "lucide-react";
import { cn } from "../lib/utils";

// =============================================================================
// Types
// =============================================================================

interface CompanyInfo {
  companyNumber: string;
  companyName: string;
  companyStatus: string;
  companyType: string;
  dateOfCreation: string;
  registeredAddress: string;
  sicCodes: string[];
  officers?: {
    name: string;
    role: string;
    appointedOn: string;
  }[];
}

interface OwnershipSearchProps {
  postcode?: string;
  address?: string;
  compact?: boolean;
}

// =============================================================================
// Mock Company Data (simulates Companies House search)
// =============================================================================

const MOCK_COMPANIES: Record<string, CompanyInfo[]> = {
  "L32": [
    {
      companyNumber: "12345678",
      companyName: "KIRKBY PROPERTY INVESTMENTS LTD",
      companyStatus: "Active",
      companyType: "Private Limited Company",
      dateOfCreation: "2018-05-15",
      registeredAddress: "12 James Holt Avenue, Kirkby, Liverpool L32 5TE",
      sicCodes: ["68100 - Buying and selling of own real estate"],
      officers: [
        { name: "John Smith", role: "Director", appointedOn: "2018-05-15" },
        { name: "Sarah Johnson", role: "Secretary", appointedOn: "2019-01-20" },
      ],
    },
  ],
  "SW1A": [
    {
      companyNumber: "98765432",
      companyName: "WESTMINSTER HOLDINGS PLC",
      companyStatus: "Active",
      companyType: "Public Limited Company",
      dateOfCreation: "1995-03-22",
      registeredAddress: "1 Parliament Square, London SW1A 0AA",
      sicCodes: ["68209 - Other letting and operating of own or leased real estate"],
      officers: [
        { name: "Lord Pemberton", role: "Chairman", appointedOn: "2010-06-01" },
        { name: "Elizabeth Clarke", role: "Director", appointedOn: "2015-09-15" },
      ],
    },
  ],
  "M1": [
    {
      companyNumber: "11223344",
      companyName: "NORTHERN QUARTER DEVELOPMENTS LTD",
      companyStatus: "Active",
      companyType: "Private Limited Company",
      dateOfCreation: "2020-02-10",
      registeredAddress: "Unit 5, Piccadilly Trading Estate, Manchester M1 2BN",
      sicCodes: ["41100 - Development of building projects"],
    },
  ],
};

// =============================================================================
// Ownership Search Component
// =============================================================================

export default function OwnershipSearch({
  postcode = "",
  address = "",
  compact = false,
}: OwnershipSearchProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CompanyInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Search for companies
  const searchCompanies = useCallback(async () => {
    if (!postcode) {
      setError("נדרש מיקוד לחיפוש");
      return;
    }

    setIsSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Get mock data based on postcode prefix
      const prefix = postcode.split(" ")[0].toUpperCase();
      const results = MOCK_COMPANIES[prefix] || [];

      setSearchResults(results);
    } catch (err) {
      setError("שגיאה בחיפוש");
      console.error("Companies House search error:", err);
    } finally {
      setIsSearching(false);
    }
  }, [postcode]);

  // Build Companies House link
  const getCompaniesHouseLink = (companyNumber: string) => {
    return `https://find-and-update.company-information.service.gov.uk/company/${companyNumber}`;
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-emerald-500/20 text-emerald-400";
      case "dissolved":
        return "bg-red-500/20 text-red-400";
      case "dormant":
        return "bg-amber-500/20 text-amber-400";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  if (compact) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900/50 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-white">בעלות חברה</span>
          </div>
          <button
            type="button"
            onClick={searchCompanies}
            disabled={isSearching || !postcode}
            className="text-xs text-purple-400 hover:text-purple-300 disabled:text-slate-600"
          >
            {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : "חפש"}
          </button>
        </div>
        
        <div className="p-3">
          {!hasSearched ? (
            <p className="text-xs text-slate-500 text-center">לחץ לבדיקת בעלות חברה</p>
          ) : isSearching ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.slice(0, 1).map((company) => (
                <a
                  key={company.companyNumber}
                  href={getCompaniesHouseLink(company.companyNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 bg-slate-900/50 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <p className="text-xs font-medium text-white truncate">{company.companyName}</p>
                  <p className="text-xs text-slate-500">#{company.companyNumber}</p>
                </a>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <User className="w-3 h-3" />
              <span>לא נמצאה בעלות חברה</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/20 rounded-lg">
            <Building className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">חיפוש בעלות - Companies House</h3>
            <p className="text-xs text-slate-500">בדוק אם הנכס בבעלות חברה Ltd</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Search Button */}
        <button
          type="button"
          onClick={searchCompanies}
          disabled={isSearching || !postcode}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all",
            isSearching
              ? "bg-slate-700 text-slate-400"
              : "bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/20"
          )}
        >
          {isSearching ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              מחפש ב-Companies House...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              חפש בעלות חברה עבור {postcode || "המיקוד"}
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        {hasSearched && !isSearching && searchResults && (
          <div className="mt-4 space-y-3">
            {searchResults.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6 text-slate-500" />
                </div>
                <h4 className="font-medium text-white mb-1">לא נמצאה בעלות חברה</h4>
                <p className="text-sm text-slate-400">
                  הנכס כנראה בבעלות פרטית או לא רשום באזור זה
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  נמצאו {searchResults.length} חברות באזור
                </div>

                {searchResults.map((company) => (
                  <div
                    key={company.companyNumber}
                    className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden"
                  >
                    {/* Company Header */}
                    <div className="p-4 border-b border-slate-700">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white">{company.companyName}</h4>
                          <p className="text-sm text-slate-400 mt-0.5">#{company.companyNumber}</p>
                        </div>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium flex-shrink-0",
                          getStatusColor(company.companyStatus)
                        )}>
                          {company.companyStatus}
                        </span>
                      </div>
                    </div>

                    {/* Company Details */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <Briefcase className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">סוג חברה</p>
                          <p className="text-sm text-white">{company.companyType}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">תאריך הקמה</p>
                          <p className="text-sm text-white">
                            {new Date(company.dateOfCreation).toLocaleDateString("he-IL")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">כתובת רשומה</p>
                          <p className="text-sm text-white">{company.registeredAddress}</p>
                        </div>
                      </div>

                      {company.sicCodes && company.sicCodes.length > 0 && (
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-slate-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500">תחום פעילות (SIC)</p>
                            {company.sicCodes.map((code, i) => (
                              <p key={i} className="text-sm text-white">{code}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {company.officers && company.officers.length > 0 && (
                        <div className="pt-3 border-t border-slate-700">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-slate-500" />
                            <p className="text-xs text-slate-500">נושאי משרה</p>
                          </div>
                          <div className="space-y-2">
                            {company.officers.map((officer, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-white">{officer.name}</span>
                                <span className="text-xs text-slate-500">{officer.role}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* View on Companies House */}
                    <div className="px-4 py-3 bg-slate-800/50 border-t border-slate-700">
                      <a
                        href={getCompaniesHouseLink(company.companyNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        צפה ב-Companies House
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
