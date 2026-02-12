"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PortfolioProperty, PropertyEnrichment } from "./PropertyEditModal";
import { cn } from "../lib/utils";

/** High-quality real estate placeholder (UK house exterior) */
const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop";

/**
 * Ordered image sources (Zoopla-style):
 * 1) Uploaded photos from property folder
 * 2) Featured Image URL (manual)
 * 3) Street View
 * 4) Static Map / OSM Map
 * 5) Placeholder
 */
function getImageSources(
  prop: PortfolioProperty,
  enrichment?: PropertyEnrichment | null,
  propertyImageUrls?: string[]
): string[] {
  const sources: string[] = [];
  if (propertyImageUrls?.length) sources.push(...propertyImageUrls);
  if (prop.image) sources.push(prop.image);
  if (enrichment?.streetViewUrl) sources.push(enrichment.streetViewUrl);
  if (enrichment?.staticMapUrl) sources.push(enrichment.staticMapUrl);
  if (enrichment?.osmMapUrl) sources.push(enrichment.osmMapUrl);
  sources.push(PLACEHOLDER_IMAGE);
  return sources;
}

interface PropertyCardImageProps {
  prop: PortfolioProperty;
  enrichment?: PropertyEnrichment | null;
  propertyImageUrls?: string[];
  alt?: string;
  className?: string;
}

export default function PropertyCardImage({
  prop,
  enrichment,
  propertyImageUrls,
  alt = "",
  className = "w-full h-full object-cover",
}: PropertyCardImageProps) {
  const sources = getImageSources(prop, enrichment, propertyImageUrls);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set());

  const currentSrc = sources[sourceIndex];
  const isPlaceholder = currentSrc === PLACEHOLDER_IMAGE;
  const hasMultiple = sources.length > 1 && !isPlaceholder;
  const showPrev = hasMultiple && sourceIndex > 0;
  const showNext = hasMultiple && sourceIndex < sources.length - 2; // -2 because last is always placeholder

  const handleError = useCallback(() => {
    setFailedIndices((prev) => new Set([...prev, sourceIndex]));
    if (sourceIndex < sources.length - 1) {
      setSourceIndex((i) => i + 1);
    }
  }, [sourceIndex, sources.length]);

  const goPrev = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (sourceIndex > 0) setSourceIndex((i) => i - 1);
    },
    [sourceIndex]
  );

  const goNext = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (sourceIndex < sources.length - 1) setSourceIndex((i) => i + 1);
    },
    [sourceIndex, sources.length]
  );

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100">
      <img
        key={currentSrc}
        src={currentSrc}
        alt={alt || `${prop.title} — property image`}
        className={className}
        onError={handleError}
        loading="lazy"
        decoding="async"
      />
      {/* Carousel controls for multiple images */}
      {hasMultiple && (
        <>
          {showPrev && (
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {showNext && (
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
          {/* Dots indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {sources.slice(0, -1).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSourceIndex(i);
                }}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  i === sourceIndex ? "bg-white" : "bg-white/50 hover:bg-white/70"
                )}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
