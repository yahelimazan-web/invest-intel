"use client";

import dynamic from "next/dynamic";
import type { PropertyIntelligence } from "../lib/ukPropertyEngine";

// Re-export types
export type LocationType = "cyprus" | "england";

export interface MapProperty {
  id: string;
  position: [number, number];
  title: string;
  address: string;
  price: number;
  currency: "GBP" | "EUR";
  size: number;
  bedrooms: number;
  monthlyRent: number;
  grossYield: number;
  netYield: number;
}

// Dynamic import of MapContent with SSR disabled to prevent "window is not defined" error
const MapContent = dynamic(() => import("./MapContent"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 text-sm">טוען מפה...</p>
      </div>
    </div>
  ),
});

// Properties data exported for use in page.tsx
export const PROPERTIES_DATA: Record<LocationType, MapProperty[]> = {
  cyprus: [
    {
      id: "cy-1",
      position: [34.917, 33.629],
      title: "נכס לדוגמה - לרנקה",
      address: "שדרות פיניקודס 45, לרנקה, קפריסין",
      price: 185000,
      currency: "EUR",
      size: 95,
      bedrooms: 3,
      monthlyRent: 1200,
      grossYield: 7.8,
      netYield: 5.9,
    },
    {
      id: "cy-2",
      position: [34.679, 33.044],
      title: "וילה יוקרה - לימסול",
      address: "רחוב אמתוס 12, לימסול, קפריסין",
      price: 450000,
      currency: "EUR",
      size: 200,
      bedrooms: 4,
      monthlyRent: 2800,
      grossYield: 7.5,
      netYield: 5.6,
    },
  ],
  england: [
    {
      id: "uk-1",
      position: [51.5054, -0.0235],
      title: "פרויקט השקעה - קנרי וורף",
      address: "One Canada Square, Canary Wharf, London E14",
      price: 450000,
      currency: "GBP",
      size: 75,
      bedrooms: 2,
      monthlyRent: 2200,
      grossYield: 5.9,
      netYield: 4.2,
    },
    {
      id: "uk-2",
      position: [51.5426, -0.0077],
      title: "דירת השקעה - סטרטפורד",
      address: "Westfield Avenue, Stratford, London E20",
      price: 380000,
      currency: "GBP",
      size: 65,
      bedrooms: 2,
      monthlyRent: 1900,
      grossYield: 6.0,
      netYield: 4.4,
    },
    {
      id: "uk-3",
      position: [51.4834, 0.0098],
      title: "פנטהאוז יוקרה - גריניץ׳",
      address: "Greenwich Peninsula, London SE10",
      price: 650000,
      currency: "GBP",
      size: 110,
      bedrooms: 3,
      monthlyRent: 3200,
      grossYield: 5.9,
      netYield: 4.1,
    },
  ],
};

interface PropertyMapProps {
  location?: LocationType;
  onPropertySelect?: (property: MapProperty) => void;
  selectedPropertyId?: string | null;
  properties: MapProperty[];
  // Intelligence mode props
  intelligenceData?: PropertyIntelligence | null;
  onIntelligenceSearch?: (postcode: string) => void;
  isSearchingIntelligence?: boolean;
}

export default function PropertyMap({
  location = "cyprus",
  onPropertySelect,
  selectedPropertyId,
  properties,
  intelligenceData,
  onIntelligenceSearch,
  isSearchingIntelligence,
}: PropertyMapProps) {
  return (
    <MapContent
      location={location}
      onPropertySelect={onPropertySelect}
      selectedPropertyId={selectedPropertyId}
      properties={properties}
      intelligenceData={intelligenceData}
      onIntelligenceSearch={onIntelligenceSearch}
      isSearchingIntelligence={isSearchingIntelligence}
    />
  );
}
