"use client";

import { cn } from "../../lib/utils";

/**
 * Skeleton Loading Components
 * Professional FinTech dark theme skeleton loaders
 */

// Base skeleton component
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-700/50",
        className
      )}
      {...props}
    />
  );
}

// Skeleton for text
export function SkeletonText({
  className,
  lines = 1,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

// Skeleton for property panel (used in LiveDataPanel)
export function SkeletonPropertyPanel() {
  return (
    <div className="bg-[#151921] border border-[#2D333F] rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-4">
        <SkeletonText lines={3} />
        <SkeletonText lines={2} />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

// Skeleton for card
export function SkeletonCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-[#151921] border border-[#2D333F] rounded-xl p-4 space-y-4",
        className
      )}
      {...props}
    >
      <Skeleton className="h-5 w-32" />
      <SkeletonText lines={2} />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}
