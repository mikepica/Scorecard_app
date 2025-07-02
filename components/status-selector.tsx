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
      // Since we're using createPortal to document.body,
      // getBoundingClientRect already gives us viewport coordinates
      const modalHeight = 200; // approximate height of modal
      const modalWidth = 192; // w-48 = 12rem = 192px
      
      // Start with the basic position below the anchor
      let finalTop = anchorRect.bottom;
      let finalLeft = anchorRect.left;
      
      // Add boundary checking to ensure modal stays within viewport
      if (finalTop + modalHeight > window.innerHeight) {
        // If modal would go below viewport, position it above the anchor
        finalTop = anchorRect.top - modalHeight;
      }
      
      if (finalLeft + modalWidth > window.innerWidth) {
        // If modal would go beyond right edge, align it to the right edge
        finalLeft = window.innerWidth - modalWidth;
      }
      
      // Ensure modal doesn't go off the left or top edges
      finalTop = Math.max(0, finalTop);
      finalLeft = Math.max(0, finalLeft);
      
      setDropdownPos({ top: finalTop, left: finalLeft });
    } else {
      const parent = dropdownRef.current?.parentElement
      if (parent) {
        const rect = parent.getBoundingClientRect()
        const modalHeight = 200;
        const modalWidth = 192;
        
        let finalTop = rect.bottom;
        let finalLeft = rect.left;
        
        if (finalTop + modalHeight > window.innerHeight) {
          finalTop = rect.top - modalHeight;
        }
        
        if (finalLeft + modalWidth > window.innerWidth) {
          finalLeft = window.innerWidth - modalWidth;
        }
        
        finalTop = Math.max(0, finalTop);
        finalLeft = Math.max(0, finalLeft);
        
        setDropdownPos({ top: finalTop, left: finalLeft });
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