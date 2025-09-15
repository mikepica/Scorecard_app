"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, BarChart2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface GoalViewsDropdownProps {
  className?: string
}

export function GoalViewsDropdown({ className = "" }: GoalViewsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [functions, setFunctions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    // Load available functions from API
    async function loadFunctions() {
      try {
        const response = await fetch('/api/functional-scorecard/functions')
        if (response.ok) {
          const functionList = await response.json()
          setFunctions(functionList)
        }
      } catch (error) {
        console.error('Failed to load functions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFunctions()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleViewSelect = (viewType: 'ord' | 'functional' | 'function', selectedFunction?: string) => {
    setIsOpen(false)
    
    switch (viewType) {
      case 'ord':
        // Navigate to ORD view (homepage)
        router.push('/')
        break
      case 'functional':
        // Navigate to functional view with all functions
        router.push('/functional')
        break
      case 'function':
        // Navigate to functional view with specific function
        if (selectedFunction) {
          router.push(`/functional?function=${encodeURIComponent(selectedFunction)}`)
        }
        break
    }
  }

  if (loading) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 bg-gray-400 text-white px-5 py-3 rounded-lg text-base min-h-[48px] cursor-not-allowed ${className}`}
      >
        <BarChart2 size={20} />
        <span className="whitespace-nowrap">Loading...</span>
      </button>
    )
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
      >
        <BarChart2 size={20} />
        <span className="whitespace-nowrap">Goal-Views</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg min-w-full whitespace-nowrap"
        >
          {/* Oncology R&D (ORD view) option */}
          <div
            className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-900 font-medium"
            onClick={() => handleViewSelect('ord')}
          >
            Oncology R&D
          </div>
          
          {/* Separator */}
          <div className="border-t border-gray-200"></div>
          
          {/* All Functions option */}
          <div
            className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-900"
            onClick={() => handleViewSelect('functional')}
          >
            All Functions
          </div>
          
          {/* Separator */}
          <div className="border-t border-gray-200"></div>
          
          {/* Individual function options */}
          {functions.map((func) => (
            <div
              key={func}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-900"
              onClick={() => handleViewSelect('function', func)}
            >
              {func}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}