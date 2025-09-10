"use client"

import { useState, useRef, useEffect } from "react"
import { Menu, ChevronDown, Database, FileText, Bot, Camera, Info } from "lucide-react"
import Link from "next/link"

interface MenuDropdownProps {
  onCaptureScreen?: () => void
  onShowBragInfo?: () => void
  className?: string
}

export function MenuDropdown({ onCaptureScreen, onShowBragInfo, className = "" }: MenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      try {
        if (event.target && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      } catch (error) {
        // Safely ignore errors from invalid event targets
        console.warn('Click outside handler error:', error)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleMenuItemClick = (action?: () => void) => {
    try {
      setIsOpen(false)
      if (action) action()
    } catch (error) {
      console.error('Menu item click error:', error)
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
      >
        <Menu size={20} />
        <span className="whitespace-nowrap">Menu</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg min-w-[200px] whitespace-nowrap">
          {/* Admin */}
          <Link
            href="/admin"
            onClick={() => handleMenuItemClick()}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 text-gray-900 border-b border-gray-200"
            title="Admin Interface - Direct database access"
          >
            <Database size={20} className="text-red-600" />
            <span>Admin</span>
          </Link>

          {/* Instructions */}
          <Link
            href="/instructions"
            onClick={() => handleMenuItemClick()}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 text-gray-900 border-b border-gray-200"
          >
            <FileText size={20} className="text-gray-600" />
            <span>Instructions</span>
          </Link>

          {/* AI Flows (disabled) */}
          <div className="relative group">
            <div className="flex items-center gap-3 px-4 py-3 text-gray-400 cursor-not-allowed border-b border-gray-200">
              <Bot size={20} />
              <span>AI Flows</span>
            </div>
            <div className="absolute left-full top-0 ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded whitespace-normal max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              Functionality released in future update after determining how users interact with this application
            </div>
          </div>

          {/* Capture Screen */}
          {onCaptureScreen && (
            <div
              onClick={() => handleMenuItemClick(onCaptureScreen)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 text-gray-900 border-b border-gray-200"
            >
              <Camera size={20} className="text-gray-600" />
              <span>Capture Screen</span>
            </div>
          )}

          {/* BRAG Info */}
          <div
            onClick={() => handleMenuItemClick(onShowBragInfo)}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 text-gray-900"
          >
            <Info size={20} className="text-blue-600" />
            <span>BRAG Info</span>
          </div>
        </div>
      )}
    </div>
  )
}