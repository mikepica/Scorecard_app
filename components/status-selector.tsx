import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

interface StatusSelectorProps {
  currentStatus?: string
  onStatusChange: (newStatus: string | undefined) => void
  onClose: () => void
  anchorRect?: DOMRect | null
}

export function StatusSelector({ currentStatus, onStatusChange, onClose, anchorRect }: StatusSelectorProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(currentStatus)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null)

  const statusOptions = [
    { value: "exceeded", label: "Exceeded", color: "bg-blue-500" },
    { value: "on-track", label: "On Track", color: "bg-green-500" },
    { value: "delayed", label: "Delayed", color: "bg-yellow-500" },
    { value: "missed", label: "Missed", color: "bg-red-500" },
    { value: undefined, label: "Not Defined", color: "bg-gray-300" },
  ]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  // Position the dropdown near the triggering element
  useEffect(() => {
    if (anchorRect) {
      setDropdownPos({ top: anchorRect.bottom + window.scrollY, left: anchorRect.left + window.scrollX })
    } else {
      const parent = dropdownRef.current?.parentElement
      if (parent) {
        const rect = parent.getBoundingClientRect()
        setDropdownPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX })
      }
    }
  }, [anchorRect])

  const handleStatusSelect = (status: string | undefined) => {
    setSelectedStatus(status)
    onStatusChange(status)
    onClose()
  }

  const dropdown = (
    <div
      ref={dropdownRef}
      className="fixed z-[1000] mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
      style={dropdownPos ? { top: dropdownPos.top, left: dropdownPos.left } : {}}
    >
      <div className="py-1" role="menu" aria-orientation="vertical">
        {statusOptions.map((option) => (
          <button
            key={option.value || "undefined"}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${
              selectedStatus === option.value ? "bg-gray-50" : ""
            }`}
            onClick={() => handleStatusSelect(option.value)}
            role="menuitem"
          >
            <div className={`w-4 h-4 rounded-full ${option.color}`} />
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )

  if (typeof window === "undefined") return null
  return createPortal(dropdown, document.body)
} 