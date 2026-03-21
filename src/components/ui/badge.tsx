import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[2px] border px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] transition-colors focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-0",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "border-[hsl(var(--border-strong))] bg-transparent text-secondary-foreground hover:border-foreground",
        destructive: "border-destructive bg-transparent text-destructive hover:bg-transparent",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
