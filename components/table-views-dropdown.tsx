"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, BarChart2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface TableViewsDropdownProps {
  className?: string
}

export function TableViewsDropdown({ className = "" }: TableViewsDropdownProps) {
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
          setFunctions(Array.isArray(functionList) ? functionList : [])
        } else {
          console.error('Failed to load functions: Response not ok', response.status)
          setFunctions([])
        }
      } catch (error) {
        console.error('Failed to load functions:', error)
        setFunctions([])
      } finally {
        setLoading(false)
      }
    }

    loadFunctions().catch((error) => {
      console.error('Unhandled error in loadFunctions:', error)
      setLoading(false)
      setFunctions([])
    })
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

  const handleViewSelect = (viewType: 'ord-table' | 'all-functions-table' | 'function-table', selectedFunction?: string) => {
    try {
      setIsOpen(false)
      
      switch (viewType) {
        case 'ord-table':
          // Navigate to ORD table view (details page)
          router.push('/details')
          break
        case 'all-functions-table':
          // Navigate to all functions table view
          router.push('/details?function=all-functions')
          break
        case 'function-table':
          // Navigate to specific function table view
          if (selectedFunction) {
            router.push(`/details?function=${encodeURIComponent(selectedFunction)}`)
          }
          break
      }
    } catch (error) {
      console.error('Error during navigation:', error)
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
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
      >
        <BarChart2 size={20} />
        <span className="whitespace-nowrap">Table View</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg min-w-full whitespace-nowrap"
        >
          {/* ORD Table option */}
          <div
            className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-900 font-medium"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleViewSelect('ord-table')
            }}
          >
            ORD Table
          </div>
          
          {/* Separator */}
          <div className="border-t border-gray-200"></div>
          
          {/* All Functions Table option */}
          <div
            className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-900"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleViewSelect('all-functions-table')
            }}
          >
            All Functions Table
          </div>
          
          {/* Separator */}
          <div className="border-t border-gray-200"></div>
          
          {/* Individual function table options */}
          {functions.map((func) => (
            <div
              key={`table-${func}`}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-900"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleViewSelect('function-table', func)
              }}
            >
              {func} Table
            </div>
          ))}
        </div>
      )}
    </div>
  )
}