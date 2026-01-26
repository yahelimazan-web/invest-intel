"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  MapPin,
  Calendar,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { cn, formatCurrency } from "../lib/utils";
import type { Country } from "../lib/portfolio-db";
import { getCurrencySymbol } from "../lib/currency";

// =============================================================================
// Recent Sales Component
// =============================================================================

interface RecentSale {
  address: string;
  postcode: string;
  soldPrice: number;
  soldDate: string;
  distance: number; // in meters
  propertyType?: string;
  source?: string;
  sourceUrl?: string;
}

interface RecentSalesProps {
  propertyLat?: number | null;
  propertyLng?: number | null;
  propertyPostcode?: string;
  country?: Country;
  radius?: number; // in meters, default 1000m
}

export default function RecentSales({
  propertyLat,
  propertyLng,
  propertyPostcode,
  country = "UK",
  radius = 1000,
}: RecentSalesProps) {
  const [sales, setSales] = useState<RecentSale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyPostcode && (!propertyLat || !propertyLng)) {
      return;
    }

    const fetchRecentSales = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // For UK, use Land Registry API
        if (country === "UK" && propertyPostcode) {
          // First, get coordinates from postcode if not provided
          let lat = propertyLat;
          let lng = propertyLng;
          
          if (!lat || !lng) {
            try {
              const postcodeResponse = await fetch(
                `https://api.postcodes.io/postcodes/${encodeURIComponent(propertyPostcode)}`
              );
              if (postcodeResponse.ok) {
                const postcodeData = await postcodeResponse.json();
                if (postcodeData?.result) {
                  lat = postcodeData.result.latitude;
                  lng = postcodeData.result.longitude;
                }
              }
            } catch (e) {
              console.error("Failed to get coordinates from postcode:", e);
            }
          }
          const response = await fetch(
            `/api/land-registry?postcode=${encodeURIComponent(propertyPostcode)}&limit=5`
          );

          if (response.ok) {
            const data = await response.json();
            if (data?.sales && Array.isArray(data.sales)) {
              setSales(
                data.sales.map((sale: any) => ({
                  address: sale.address || "כתובת לא זמינה",
                  postcode: sale.postcode || propertyPostcode,
                  soldPrice: sale.price || 0,
                  soldDate: sale.date || "תאריך לא זמין",
                  distance: sale.distance || 0,
                  propertyType: sale.propertyType,
                  source: "HM Land Registry",
                  sourceUrl: sale.sourceUrl,
                }))
              );
            }
          }
        } else {
          // For other countries, show placeholder or fetch from other sources
          setSales([]);
        }
      } catch (err: any) {
        console.error("Failed to fetch recent sales:", err);
        setError("לא ניתן לטעון נתוני מכירות");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentSales();
  }, [propertyLat, propertyLng, propertyPostcode, country, radius]);

  if (!propertyPostcode && (!propertyLat || !propertyLng)) {
    return null;
  }

  const currencySymbol = getCurrencySymbol(country);

  return (
    <div className="bg-[#151921] border border-[#2D333F] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">מכירות אחרונות באזור</h3>
        </div>
        {propertyPostcode && (
          <span className="text-xs text-slate-400">{propertyPostcode}</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#00C805] animate-spin" />
          <span className="mr-2 text-sm text-slate-400">טוען מכירות...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-400">{error}</p>
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-400">אין נתוני מכירות זמינים</p>
          <p className="text-xs text-slate-500 mt-1">
            {country === "UK"
              ? "נתוני Land Registry זמינים רק עבור נכסים בבריטניה"
              : "נתוני מכירות זמינים רק עבור נכסים בבריטניה"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map((sale, index) => (
            <div
              key={index}
              className="bg-[#1D2430] border border-[#2D333F] rounded-lg p-3 hover:border-[#00C805]/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm mb-1 truncate">
                    {sale.address}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {sale.soldDate}
                    </span>
                    {sale.distance > 0 && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {sale.distance < 1000
                          ? `${sale.distance} מ'`
                          : `${(sale.distance / 1000).toFixed(1)} ק"מ`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-left mr-3">
                  <p className="text-lg font-bold text-[#00C805]">
                    {formatCurrency(sale.soldPrice, country)}
                  </p>
                </div>
              </div>
              {sale.sourceUrl && (
                <a
                  href={sale.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 mt-2"
                >
                  <ExternalLink className="w-3 h-3" />
                  {sale.source || "מקור"}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
