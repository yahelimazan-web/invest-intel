"use client";

import { useState, useEffect } from "react";
import {
  Train,
  GraduationCap,
  Hospital,
  MapPin,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "../lib/utils";

// =============================================================================
// Infrastructure Radar Component
// =============================================================================

interface InfrastructureItem {
  name: string;
  address: string;
  distance: number; // in meters
  type: "transport" | "education" | "healthcare";
  rating?: number;
}

interface InfrastructureRadarProps {
  propertyLat?: number | null;
  propertyLng?: number | null;
  propertyAddress?: string;
  radius?: number; // in meters, default 1500m
}

export default function InfrastructureRadar({
  propertyLat,
  propertyLng,
  propertyAddress,
  radius = 1500,
}: InfrastructureRadarProps) {
  const [infrastructure, setInfrastructure] = useState<{
    transport: InfrastructureItem[];
    education: InfrastructureItem[];
    healthcare: InfrastructureItem[];
  }>({
    transport: [],
    education: [],
    healthcare: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have address but no coordinates, try to get them
    // For now, require coordinates - can be enhanced later
    if (!propertyLat || !propertyLng) {
      return;
    }

    const fetchInfrastructure = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/places?lat=${propertyLat}&lng=${propertyLng}&radius=${radius}`
        );

        if (response.ok) {
          const data = await response.json();
          setInfrastructure({
            transport: data?.transport || [],
            education: data?.education || [],
            healthcare: data?.healthcare || [],
          });
        } else {
          setError("לא ניתן לטעון נתוני תשתית");
        }
      } catch (err: any) {
        console.error("Failed to fetch infrastructure:", err);
        setError("שגיאה בטעינת נתוני תשתית");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInfrastructure();
  }, [propertyLat, propertyLng, radius]);

  if (!propertyLat || !propertyLng) {
    return null;
  }

  const totalItems =
    infrastructure.transport.length +
    infrastructure.education.length +
    infrastructure.healthcare.length;

  return (
    <div className="bg-[#151921] border border-[#2D333F] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <MapPin className="w-4 h-4 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">תשתית בקרבת מקום</h3>
        </div>
        <span className="text-xs text-slate-400">
          רדיוס: {(radius / 1000).toFixed(1)} ק"מ
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#00C805] animate-spin" />
          <span className="mr-2 text-sm text-slate-400">טוען תשתית...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">{error}</p>
        </div>
      ) : totalItems === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-400">לא נמצאו מתקני תשתית בקרבת מקום</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Transport */}
          {infrastructure.transport.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Train className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-medium text-white">תחבורה</h4>
                <span className="text-xs text-slate-500">
                  ({infrastructure.transport.length})
                </span>
              </div>
              <div className="space-y-2">
                {infrastructure.transport.slice(0, 3).map((item, index) => (
                  <div
                    key={index}
                    className="bg-[#1D2430] border border-[#2D333F] rounded-lg p-2 text-sm"
                  >
                    <p className="text-white font-medium mb-1">{item.name}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="truncate mr-2">{item.address}</span>
                      <span>
                        {item.distance < 1000
                          ? `${item.distance} מ'`
                          : `${(item.distance / 1000).toFixed(1)} ק"מ`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {infrastructure.education.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-medium text-white">חינוך</h4>
                <span className="text-xs text-slate-500">
                  ({infrastructure.education.length})
                </span>
              </div>
              <div className="space-y-2">
                {infrastructure.education.slice(0, 3).map((item, index) => (
                  <div
                    key={index}
                    className="bg-[#1D2430] border border-[#2D333F] rounded-lg p-2 text-sm"
                  >
                    <p className="text-white font-medium mb-1">{item.name}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="truncate mr-2">{item.address}</span>
                      <span>
                        {item.distance < 1000
                          ? `${item.distance} מ'`
                          : `${(item.distance / 1000).toFixed(1)} ק"מ`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Healthcare */}
          {infrastructure.healthcare.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hospital className="w-4 h-4 text-red-400" />
                <h4 className="text-sm font-medium text-white">בריאות</h4>
                <span className="text-xs text-slate-500">
                  ({infrastructure.healthcare.length})
                </span>
              </div>
              <div className="space-y-2">
                {infrastructure.healthcare.slice(0, 3).map((item, index) => (
                  <div
                    key={index}
                    className="bg-[#1D2430] border border-[#2D333F] rounded-lg p-2 text-sm"
                  >
                    <p className="text-white font-medium mb-1">{item.name}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="truncate mr-2">{item.address}</span>
                      <span>
                        {item.distance < 1000
                          ? `${item.distance} מ'`
                          : `${(item.distance / 1000).toFixed(1)} ק"מ`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
