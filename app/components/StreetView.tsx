"use client";

import { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  ExternalLink,
  RotateCcw,
  Navigation,
} from "lucide-react";
import { cn } from "../lib/utils";

// =============================================================================
// Types
// =============================================================================

interface StreetViewProps {
  address?: string;
  postcode?: string;
  lat?: number;
  lon?: number;
  compact?: boolean;
}

// =============================================================================
// Street View Component
// =============================================================================

export default function StreetView({
  address,
  postcode,
  lat,
  lon,
  compact = false,
}: StreetViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [heading, setHeading] = useState(0);

  // Build the Street View URL
  const buildStreetViewUrl = (width: number, height: number) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    // Use coordinates if available, otherwise use address
    let location = "";
    if (lat && lon) {
      location = `${lat},${lon}`;
    } else if (address && postcode) {
      location = encodeURIComponent(`${address}, ${postcode}, UK`);
    } else if (postcode) {
      location = encodeURIComponent(`${postcode}, UK`);
    }

    if (!location) return null;

    // If we have an API key, use the Static Street View API
    if (apiKey && apiKey !== "your_google_key") {
      return `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&location=${location}&heading=${heading}&pitch=0&key=${apiKey}`;
    }

    // Fallback: Use embedded Street View (no API key needed)
    return null;
  };

  // Build Google Maps link
  const buildGoogleMapsLink = () => {
    if (lat && lon) {
      return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}&heading=${heading}`;
    }
    if (address && postcode) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${postcode}, UK`)}`;
    }
    if (postcode) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${postcode}, UK`)}`;
    }
    return "https://www.google.com/maps";
  };

  // Build embedded iframe URL (no API key needed)
  const buildEmbedUrl = () => {
    let query = "";
    if (lat && lon) {
      query = `${lat},${lon}`;
    } else if (address && postcode) {
      query = encodeURIComponent(`${address}, ${postcode}, UK`);
    } else if (postcode) {
      query = encodeURIComponent(`${postcode}, UK`);
    }

    if (!query) return null;

    // Use Google Maps embed with Street View layer
    return `https://www.google.com/maps/embed/v1/streetview?key=AIzaSyBFw0Qbyq9zTFTd-tUY6ce6-VqsB3a2B9U&location=${lat || 0},${lon || 0}&heading=${heading}&pitch=0&fov=90`;
  };

  const streetViewUrl = buildStreetViewUrl(compact ? 300 : 600, compact ? 200 : 400);
  const embedUrl = buildEmbedUrl();
  const googleMapsLink = buildGoogleMapsLink();

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Handle image error
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Rotate view
  const rotateView = (degrees: number) => {
    setHeading((prev) => (prev + degrees + 360) % 360);
    setIsLoading(true);
  };

  if (!postcode && !address && !lat) {
    return null;
  }

  // Compact view
  if (compact) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900/50 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-white">Street View</span>
          </div>
          <a
            href={googleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            פתח
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="relative h-32">
          {streetViewUrl ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <img
                src={streetViewUrl}
                alt="Street View"
                className={cn("w-full h-full object-cover", isLoading && "opacity-0")}
                onLoad={handleLoad}
                onError={handleError}
              />
            </>
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-900">
              <a
                href={googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center"
              >
                <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">לחץ לצפייה ב-Street View</p>
              </a>
            </div>
          )}
          {hasError && (
            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
              <div className="text-center">
                <EyeOff className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                <p className="text-xs text-slate-500">Street View לא זמין</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full view
  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]" 
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      <div 
        className={cn(
          "bg-slate-900 rounded-xl border-2 overflow-hidden transition-all shadow-2xl",
          isExpanded 
            ? "fixed inset-4 z-[9999] border-blue-500/50 shadow-blue-500/20" 
            : "border-slate-700"
        )}
        style={isExpanded ? { 
          boxShadow: '0 0 60px rgba(59, 130, 246, 0.3), 0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        } : undefined}
      >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/20 rounded-lg">
            <Eye className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Google Street View</h3>
            {address && <p className="text-xs text-slate-500 truncate max-w-[200px]">{address}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Rotation Controls */}
          <button
            type="button"
            onClick={() => rotateView(-45)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
            title="סובב שמאלה"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => rotateView(45)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
            title="סובב ימינה"
          >
            <RotateCcw className="w-4 h-4 scale-x-[-1]" />
          </button>
          
          {/* Expand/Collapse */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          
          {/* Open in Google Maps */}
          <a
            href={googleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Street View Content */}
      <div className={cn("relative", isExpanded ? "h-[calc(100%-56px)]" : "h-64")}>
        {streetViewUrl ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-400">טוען Street View...</p>
                </div>
              </div>
            )}
            <img
              src={streetViewUrl}
              alt="Street View"
              className={cn("w-full h-full object-cover", isLoading && "opacity-0")}
              onLoad={handleLoad}
              onError={handleError}
            />
          </>
        ) : (
          // Fallback: Link to Google Maps
          <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Navigation className="w-8 h-8 text-blue-400" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">צפה ב-Street View</h4>
              <p className="text-sm text-slate-400 mb-4 max-w-xs">
                {address ? `${address}, ${postcode}` : postcode}
              </p>
              <a
                href={googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                פתח ב-Google Maps
              </a>
              <p className="text-xs text-slate-500 mt-4">
                הוסף NEXT_PUBLIC_GOOGLE_MAPS_API_KEY לקובץ .env.local לתמונה מוטמעת
              </p>
            </div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
            <div className="text-center p-6">
              <EyeOff className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">Street View לא זמין</h4>
              <p className="text-sm text-slate-400 mb-4">
                אין תמונות Street View עבור מיקום זה
              </p>
              <a
                href={googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
              >
                נסה ב-Google Maps
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* Heading Indicator */}
        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white">
          <span className="opacity-70">כיוון:</span> {heading}°
        </div>
      </div>
    </div>
    </>
  );
}
