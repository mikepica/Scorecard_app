import { useState, useRef } from "react"
import { StatusSelector } from "./status-selector"

interface StatusCircleProps {
  status?: string
  onStatusChange?: (newStatus: string | undefined) => void
  isCurrentQuarter?: boolean
}

export function StatusCircle({ status, onStatusChange, isCurrentQuarter = true }: StatusCircleProps) {
  const [showSelector, setShowSelector] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
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
      if (isCurrentQuarter) {
        setAnchorRect(circleRef.current.getBoundingClientRect())
        setShowSelector(true)
      } else {
        setAnchorRect(circleRef.current.getBoundingClientRect())
        setShowTooltip(true)
        setTimeout(() => setShowTooltip(false), 2000)
      }
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
      {showTooltip && anchorRect && (
        <div
          className="fixed z-50 bg-gray-800 text-white text-sm px-3 py-2 rounded shadow-lg pointer-events-none"
          style={{
            left: anchorRect.left + anchorRect.width / 2 - 100,
            top: anchorRect.bottom + 8,
            transform: 'translateX(-50%)',
          }}
        >
          Only the Current Quarter RAG is editable.
          <div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full"
            style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '6px solid #1f2937',
            }}
          />
        </div>
      )}
    </div>
  )
}
