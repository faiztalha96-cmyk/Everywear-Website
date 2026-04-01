import React from "react";
import { cn } from "@/utils/utils";

interface AdminLoadingProps {
  variant?: "table" | "card" | "stats" | "form";
  count?: number;
  className?: string;
}

export function AdminLoading({ variant = "table", count = 5, className }: AdminLoadingProps) {
  const Shimmer = ({ className }: { className?: string }) => (
    <div className={cn("animate-pulse bg-secondary/50 rounded-xl", className)} />
  );

  if (variant === "stats") {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-8 bg-background rounded-[2.5rem] border border-border space-y-6">
            <div className="flex justify-between items-start">
              <Shimmer className="w-14 h-14 rounded-2xl" />
              <Shimmer className="w-16 h-6 rounded-full" />
            </div>
            <div className="space-y-2">
              <Shimmer className="w-24 h-3" />
              <Shimmer className="w-32 h-8" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-6 bg-background rounded-[2rem] border border-border space-y-4">
            <Shimmer className="aspect-square w-full rounded-2xl" />
            <div className="space-y-2">
              <Shimmer className="w-3/4 h-4" />
              <Shimmer className="w-1/2 h-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className={cn("space-y-8 max-w-2xl mx-auto", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Shimmer className="w-24 h-3" />
            <Shimmer className="w-full h-14" />
          </div>
        ))}
        <Shimmer className="w-full h-16 rounded-2xl mt-8" />
      </div>
    );
  }

  // Default: Table
  return (
    <div className={cn("bg-background rounded-[2.5rem] border border-border overflow-hidden", className)}>
      <div className="p-8 border-b border-border">
        <Shimmer className="w-48 h-6" />
      </div>
      <div className="p-8 space-y-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <Shimmer className="w-12 h-12 shrink-0" />
              <div className="space-y-2 flex-1">
                <Shimmer className="w-1/3 h-4" />
                <Shimmer className="w-1/4 h-3" />
              </div>
            </div>
            <Shimmer className="w-24 h-6 rounded-full" />
            <Shimmer className="w-16 h-4" />
            <Shimmer className="w-8 h-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
