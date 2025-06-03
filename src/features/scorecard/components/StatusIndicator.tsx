import { StatusCircle } from "./status-circle"

interface StatusIndicatorProps {
  status: string
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-1">
      <StatusCircle status={status} />
      <span className="text-sm capitalize">{status}</span>
    </div>
  )
} 