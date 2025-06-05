import { useState, useRef } from "react"
import { StatusSelector } from "./status-selector"

interface StatusCircleProps {
  status?: string
  onStatusChange?: (newStatus: string | undefined) => void
}

export function StatusCircle({ status, onStatusChange }: StatusCircleProps) {
  const [showSelector, setShowSelector] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const circleRef = useRef<HTMLDivElement>(null)

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-gray-300"

    switch (status.toLowerCase()) {
      case "exceeded":
      case "blue":
        return "bg-blue-500"
      case "on-track":
      case "green":
        return "bg-green-500"
      case "delayed":
      case "amber":
        return "bg-yellow-500"
      case "missed":
      case "red":
        return "bg-red-500"
      default:
        return "bg-gray-300"
    }
  }

  const getStatusTooltip = (status?: string) => {
    if (!status) return "Not defined"
    return status
  }

  const handleClick = () => {
    if (onStatusChange && circleRef.current) {
      setAnchorRect(circleRef.current.getBoundingClientRect())
      setShowSelector(true)
    }
  }

  const handleStatusChange = (newStatus: string | undefined) => {
    if (onStatusChange) {
      onStatusChange(newStatus)
    }
  }

  return (
    <div className="relative">
      <div
        ref={circleRef}
        className={`w-6 h-6 rounded-full ${getStatusColor(status)} mx-auto cursor-pointer hover:ring-2 hover:ring-gray-400`}
        title={getStatusTooltip(status)}
        onClick={handleClick}
      />
      {showSelector && (
        <StatusSelector
          currentStatus={status}
          onStatusChange={handleStatusChange}
          onClose={() => setShowSelector(false)}
          anchorRect={anchorRect}
        />
      )}
    </div>
  )
}
