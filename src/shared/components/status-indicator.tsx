import { cn } from "@/shared/lib/utils";

type Status = "on-track" | "delayed" | "missed" | "exceeded";

interface StatusIndicatorProps {
  status: Status;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusColors = {
  "on-track": "bg-green-500",
  delayed: "bg-amber-500",
  missed: "bg-red-500",
  exceeded: "bg-blue-500",
};

const sizeClasses = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4",
};

export function StatusIndicator({ status, size = "md", className }: StatusIndicatorProps) {
  return (
    <div
      className={cn(
        "rounded-full",
        statusColors[status],
        sizeClasses[size],
        className
      )}
      title={status}
    />
  );
} 