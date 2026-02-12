"use client";

import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { cn } from "../../lib/utils";

/** UK centre coordinates for fallback */
const UK_CENTRE = { lat: 54.5, lon: -2.5 };

function getOsmTileUrl(lat: number, lon: number, zoom: number): string {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

interface MarketRadarMapProps {
  areaCode: string;
  className?: string;
}

/**
 * Simple UK map — fetches geocode for postcode, shows OSM tile
 * Fallback: static UK placeholder when geocode unavailable
 */
export default function MarketRadarMap({ areaCode, className }: MarketRadarMapProps) {
  const [latLon, setLatLon] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!areaCode) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(
      `/api/geocode?postcode=${encodeURIComponent(areaCode)}&address=${encodeURIComponent(areaCode + " UK")}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.lat && data?.lon) {
          setLatLon({ lat: parseFloat(data.lat), lon: parseFloat(data.lon) });
        } else {
          setLatLon(UK_CENTRE);
        }
      })
      .catch(() => {
        setLatLon(UK_CENTRE);
      })
      .finally(() => setLoading(false));
  }, [areaCode]);

  if (loading) {
    return (
      <div
        className={cn(
          "bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center",
          className
        )}
      >
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-teal-500 rounded-full animate-spin" />
          <span className="text-sm">Loading map</span>
        </div>
      </div>
    );
  }

  const { lat, lon } = latLon || UK_CENTRE;
  const tileUrl = getOsmTileUrl(lat, lon, 10);

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 overflow-hidden bg-slate-100 relative",
        className
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={tileUrl}
          alt={`Map of ${areaCode}`}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none" />
      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-white drop-shadow-md">
        <MapPin className="w-4 h-4 shrink-0" aria-hidden />
        <span className="text-sm font-medium">{areaCode}</span>
      </div>
    </div>
  );
}
