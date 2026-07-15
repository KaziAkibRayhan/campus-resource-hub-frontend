// Shimmering skeleton loaders shown while list pages fetch data.
import React from "react";

export const SkeletonBlock = ({ className = "" }) => (
  <div className={`skeleton-block ${className}`} />
);

// Generic card skeleton matching the app's rounded-xl card look.
export const SkeletonCard = ({ lines = 3, media = false }) => (
  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 space-y-3">
    {media && <SkeletonBlock className="h-32 w-full" />}
    <SkeletonBlock className="h-5 w-3/4" />
    {Array.from({ length: lines }, (_, i) => (
      <SkeletonBlock key={i} className={`h-3.5 ${i === lines - 1 ? "w-1/2" : "w-full"}`} />
    ))}
    <div className="flex gap-2 pt-1">
      <SkeletonBlock className="h-8 w-20" />
      <SkeletonBlock className="h-8 w-8" />
    </div>
  </div>
);

// Grid of card skeletons — drop-in for a loading list page.
export const SkeletonGrid = ({ count = 6, media = false, lines = 3, className = "" }) => (
  <div className={className || "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
    {Array.from({ length: count }, (_, i) => (
      <SkeletonCard key={i} media={media} lines={lines} />
    ))}
  </div>
);

// Row skeleton for list/table layouts.
export const SkeletonRow = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4"
      >
        <SkeletonBlock className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-4 w-1/3" />
          <SkeletonBlock className="h-3 w-2/3" />
        </div>
        <SkeletonBlock className="h-8 w-24" />
      </div>
    ))}
  </div>
);
