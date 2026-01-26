"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import LiveDataPanel from "../LiveDataPanel";
import type { PropertyAnalysis } from "../../services/api";
import AIChat, { ChatToggleButton } from "../AIChat";
import AreaRadar, { RadarToggleButton } from "../AreaRadar";

// Dynamic import for map
const PropertyMap = dynamic(() => import("../PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 text-sm">טוען מפה...</p>
      </div>
    </div>
  ),
});

type LocationType = "england" | "cyprus";

export default function MarketExplorer() {
  const [location] = useState<LocationType>("england");
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [analysisData, setAnalysisData] = useState<PropertyAnalysis | null>(null);
  
  // New feature states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [radarAlertCount, setRadarAlertCount] = useState(0);
  const [financialData, setFinancialData] = useState<any>(null);

  // Load radar alert count
  useEffect(() => {
    try {
      const saved = localStorage.getItem("investintel_watched_postcodes");
      if (saved) {
        const postcodes = JSON.parse(saved);
        const count = postcodes.reduce((sum: number, wp: any) => 
          sum + (wp.deals?.filter((d: any) => d.isNew && d.discount >= 15)?.length || 0), 0
        );
        setRadarAlertCount(count);
      }
    } catch (e) {
      console.error("Error loading radar alerts:", e);
    }
  }, [isRadarOpen]);

  const handleCoordinatesChange = useCallback((coords: { lat: number; lon: number } | null) => {
    setMapCoords(coords);
  }, []);

  const handleAnalysisComplete = useCallback((data: PropertyAnalysis | null) => {
    setAnalysisData(data);
  }, []);
  
  // Handle deal click from radar
  const handleDealClick = useCallback((postcode: string, address: string) => {
    console.log("Deal clicked:", postcode, address);
    // Could trigger a search here
    setIsRadarOpen(false);
  }, []);

  // Convert PropertyAnalysis to the format expected by PropertyMap
  const intelligenceData = analysisData ? {
    coordinates: { lat: analysisData.postcode.latitude, lon: analysisData.postcode.longitude },
    physical: {
      address: analysisData.epc.address,
      sqm: analysisData.epc.totalFloorArea,
      rooms: analysisData.epc.numberOfRooms,
      epcRating: analysisData.epc.currentEnergyRating,
      epcScore: analysisData.epc.currentEnergyEfficiency,
      tenure: analysisData.epc.tenure,
      propertyType: analysisData.epc.buildingType,
    },
    council: {
      name: analysisData.postcode.admin_district,
      region: analysisData.postcode.region,
      newsUrl: `https://www.google.com/search?q=${encodeURIComponent(analysisData.postcode.admin_district + " council news")}`,
      planningUrl: `https://www.google.com/search?q=${encodeURIComponent(analysisData.postcode.admin_district + " planning")}`,
    },
    crime: analysisData.crime,
    market: {
      avgSoldPrice: analysisData.prices.averageByYear[analysisData.prices.averageByYear.length - 1]?.avgPrice || 0,
      avgRent: Math.round((analysisData.prices.averageByYear[analysisData.prices.averageByYear.length - 1]?.avgPrice || 0) * 0.005),
      avgPricePerSqm: Math.round((analysisData.prices.averageByYear[analysisData.prices.averageByYear.length - 1]?.avgPrice || 0) / (analysisData.epc.totalFloorArea || 1)),
      priceChange12m: analysisData.prices.priceGrowth,
      estimatedYield: 5.5,
      councilTaxBand: "C",
      councilTaxAnnual: 1500,
      source: analysisData.prices.source,
    },
    proximity: {
      trainStation: analysisData.proximity.trainStation,
      metro: analysisData.proximity.metro,
      hospital: analysisData.proximity.hospital,
      university: analysisData.proximity.university,
      schools: analysisData.proximity.schools,
      supermarkets: analysisData.proximity.supermarkets,
    },
    mode: "potential" as const,
    dataQuality: "live" as const,
    postcode: analysisData.postcode.postcode,
    timestamp: analysisData.timestamp,
  } : null;

  // Generate property ID for AI chat
  const propertyId = analysisData 
    ? `${analysisData.postcode.postcode}-${analysisData.epc.address || 'unknown'}`.replace(/\s+/g, '-').toLowerCase()
    : '';

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-4">
      {/* Right Panel - Data (RTL: appears on the right) */}
      <div className="w-full lg:w-[30%] flex-shrink-0 h-[50vh] lg:h-full overflow-hidden rounded-xl border border-slate-800">
        <LiveDataPanel
          onCoordinatesChange={handleCoordinatesChange}
          onAnalysisComplete={handleAnalysisComplete}
        />
      </div>

      {/* Left - Map (RTL: appears on the left) */}
      <div className="flex-1 h-[50vh] lg:h-full rounded-xl overflow-hidden border border-slate-800">
        <PropertyMap
          location={location}
          properties={[]}
          intelligenceData={intelligenceData}
        />
      </div>

      {/* AI Chat */}
      <AIChat
        propertyData={analysisData}
        propertyId={propertyId}
        financialData={financialData}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Area Radar */}
      <AreaRadar
        isOpen={isRadarOpen}
        onClose={() => setIsRadarOpen(false)}
        onDealClick={handleDealClick}
      />

      {/* Toggle Buttons */}
      {!isChatOpen && (
        <ChatToggleButton onClick={() => setIsChatOpen(true)} />
      )}
      
      {!isRadarOpen && (
        <RadarToggleButton 
          onClick={() => setIsRadarOpen(true)} 
          alertCount={radarAlertCount}
        />
      )}
    </div>
  );
}
