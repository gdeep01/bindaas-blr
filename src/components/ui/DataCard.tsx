import * as React from "react";

import { cn } from "@/lib/utils";

const DataCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-xl border border-white/5 bg-card p-4 text-card-foreground shadow-none", className)}
      {...props}
    />
  ),
);

DataCard.displayName = "DataCard";

export { DataCard };
