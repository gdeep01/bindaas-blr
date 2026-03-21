import * as React from "react";

import { cn } from "@/lib/utils";

function SkeletonBase({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-xl bg-muted", className)} {...props} />;
}

function Text({
  lines = 2,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBase key={index} className={cn("h-3", index === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

function Card({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card rounded-xl p-4", className)}>
      <SkeletonBase className="mb-4 h-4 w-1/3" />
      <SkeletonBase className="mb-6 h-10 w-1/2" />
      <Text lines={3} />
    </div>
  );
}

function HotspotCard({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card rounded-xl p-4", className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <SkeletonBase className="h-8 w-8" />
          <div className="space-y-2">
            <SkeletonBase className="h-4 w-24" />
            <SkeletonBase className="h-3 w-16" />
          </div>
        </div>
        <SkeletonBase className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <SkeletonBase className="h-1 w-full" />
        </div>
        <SkeletonBase className="h-4 w-8" />
      </div>
    </div>
  );
}

function Number({ className }: { className?: string }) {
  return <SkeletonBase className={cn("h-10 w-24", className)} />;
}

function Bar({ className }: { className?: string }) {
  return <SkeletonBase className={cn("h-0.5 w-full rounded-none", className)} />;
}

const Skeleton = Object.assign(SkeletonBase, {
  Text,
  Card,
  HotspotCard,
  Number,
  Bar,
});

export { Skeleton };
