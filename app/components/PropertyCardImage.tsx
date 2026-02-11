"use client";

import { useState, useCallback } from "react";
import type { PortfolioProperty, PropertyEnrichment } from "./PropertyEditModal";

/**
 * Ordered image sources: Street View (house facade) → Static Map → OSM Map.
 * Never uses Picsum; fallback is a map view of the exact Liverpool/UK location.
 */
function getImageSources(
  prop: PortfolioProperty,
  enrichment?: PropertyEnrichment | null
): string[] {
  const sources: string[] = [];
  if (prop.image) sources.push(prop.image);
  if (enrichment?.streetViewUrl) sources.push(enrichment.streetViewUrl);
  if (enrichment?.staticMapUrl) sources.push(enrichment.staticMapUrl);
  if (enrichment?.osmMapUrl) sources.push(enrichment.osmMapUrl);
  return sources;
}

interface PropertyCardImageProps {
  prop: PortfolioProperty;
  enrichment?: PropertyEnrichment | null;
  alt?: string;
  className?: string;
}

export default function PropertyCardImage({
  prop,
  enrichment,
  alt = "",
  className = "w-full h-full object-cover",
}: PropertyCardImageProps) {
  const sources = getImageSources(prop, enrichment);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [showFallback, setShowFallback] = useState(false);

  const currentSrc = sources[sourceIndex];
  const hasMoreSources = sourceIndex < sources.length - 1;

  const handleError = useCallback(() => {
    if (hasMoreSources) {
      setSourceIndex((i) => i + 1);
    } else {
      setShowFallback(true);
    }
  }, [hasMoreSources]);

  if (showFallback || !currentSrc) {
    return (
      <div
        className={`bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center ${className}`}
        aria-hidden
      >
        <span className="text-slate-500 text-xs font-medium">Map View</span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
      decoding="async"
    />
  );
}
