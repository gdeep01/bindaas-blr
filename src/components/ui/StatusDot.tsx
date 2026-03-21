import { cn } from "@/lib/utils";

type Status =
  | "live"
  | "cached"
  | "good"
  | "moderate"
  | "heavy"
  | "low"
  | "high"
  | "critical"
  | "severe";

const statusClassMap: Record<Status, string> = {
  live: "bg-success",
  cached: "bg-warning",
  good: "bg-success",
  moderate: "bg-warning",
  heavy: "bg-danger",
  low: "bg-success",
  high: "bg-danger",
  critical: "bg-danger",
  severe: "bg-danger",
};

interface StatusDotProps {
  status: Status;
  label?: string;
  className?: string;
}

export function StatusDot({ status, label, className }: StatusDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", statusClassMap[status])} aria-hidden="true" />
      {label ? <span className="font-body text-[0.65rem] font-bold uppercase tracking-[0.12em]">{label}</span> : null}
    </span>
  );
}
