"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, Plus, Search, Trash2, Edit3 } from "lucide-react"

interface Alignment {
  id: string
  functional_type: string
  ord_type: string
  alignment_strength: 'strong' | 'moderate' | 'weak' | 'informational'
  alignment_rationale?: string
  functional_name: string
  functional_path: string
  ord_name: string
  ord_path: string
  created_at: string
}

interface SearchResult {
  type: string
  source: string
  id: string
  title: string
  path: string
}

interface AlignmentFloatingCardProps {
  itemType: 'pillar' | 'category' | 'goal' | 'program'
  itemId: string
  itemName: string
  isOpen: boolean
  onClose: () => void
  position: { x: number; y: number }
  onAlignmentChange?: () => void
}

const strengthColors = {
  strong: 'bg-green-500',
  moderate: 'bg-blue-500',
  weak: 'bg-yellow-500',
  informational: 'bg-gray-500'
}

const strengthLabels = {
  strong: 'Strong',
  moderate: 'Moderate', 
  weak: 'Weak',
  informational: 'Info'
}

export function AlignmentFloatingCard({
  itemType,
  itemId,
  isOpen,
  onClose,
  position,
  onAlignmentChange
}: AlignmentFloatingCardProps) {
  const [alignments, setAlignments] = useState<Alignment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingMode, setIsAddingMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedStrength, setSelectedStrength] = useState<'strong' | 'moderate' | 'weak' | 'informational'>('moderate')
  const [rationale, setRationale] = useState("")
  // const [editingAlignment, setEditingAlignment] = useState<string | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Fetch alignments when component opens
  useEffect(() => {
    if (isOpen && itemType && itemId) {
      fetchAlignments()
    }
  }, [isOpen, itemType, itemId, fetchAlignments])

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Focus search input when entering add mode
  useEffect(() => {
    if (isAddingMode && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isAddingMode])

  // Search for alignment targets with debouncing
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchAlignmentTargets()
      }, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
    }
  }, [searchTerm, searchAlignmentTargets])

  const fetchAlignments = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/alignments?itemType=${itemType}&itemId=${itemId}`)
      if (response.ok) {
        const data = await response.json()
        setAlignments(data.alignments)
      }
    } catch (error) {
      console.error('Error fetching alignments:', error)
    } finally {
      setIsLoading(false)
    }
  }, [itemType, itemId])

  const searchAlignmentTargets = useCallback(async () => {
    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/alignments/search?q=${encodeURIComponent(searchTerm)}&excludeType=${itemType}&excludeId=${itemId}`
      )
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results)
      }
    } catch (error) {
      console.error('Error searching alignment targets:', error)
    } finally {
      setIsSearching(false)
    }
  }, [searchTerm, itemType, itemId])

  const createAlignment = async (target: SearchResult) => {
    try {
      const alignmentData = {
        functionalType: target.source === 'functional' ? target.type : itemType,
        functionalId: target.source === 'functional' ? target.id : itemId,
        ordType: target.source === 'ord' ? target.type : itemType,
        ordId: target.source === 'ord' ? target.id : itemId,
        strength: selectedStrength,
        rationale: rationale.trim() || undefined,
        createdBy: 'user'
      }

      const response = await fetch('/api/alignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(alignmentData)
      })

      if (response.ok) {
        // Reset form
        setSearchTerm("")
        setRationale("")
        setSelectedStrength('moderate')
        setIsAddingMode(false)
        
        // Refresh alignments
        await fetchAlignments()
        onAlignmentChange?.()
      }
    } catch (error) {
      console.error('Error creating alignment:', error)
    }
  }

  const deleteAlignment = async (alignmentId: string) => {
    try {
      const response = await fetch(`/api/alignments?id=${alignmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchAlignments()
        onAlignmentChange?.()
      }
    } catch (error) {
      console.error('Error deleting alignment:', error)
    }
  }

  // const updateAlignment = async (alignmentId: string, strength: string, newRationale: string) => {
  //   try {
  //     const response = await fetch(`/api/alignments?id=${alignmentId}`, {
  //       method: 'PATCH',
  //       headers: {
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify({
  //         strength,
  //         rationale: newRationale.trim() || undefined
  //       })
  //     })

  //     if (response.ok) {
  //       setEditingAlignment(null)
  //       await fetchAlignments()
  //       onAlignmentChange?.()
  //     }
  //   } catch (error) {
  //     console.error('Error updating alignment:', error)
  //   }
  // }

  if (!isOpen) return null

  // Calculate position to stay within viewport
  const cardWidth = 320
  const cardMaxHeight = 400
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  }

  const adjustedPosition = {
    x: Math.min(position.x, viewport.width - cardWidth - 20),
    y: Math.min(position.y, viewport.height - cardMaxHeight - 20)
  }

  return (
    <div
      ref={cardRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        width: cardWidth,
        maxHeight: cardMaxHeight
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">
          Alignments ({alignments.length})
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Existing Alignments */}
            {alignments.map((alignment) => (
              <div
                key={alignment.id}
                className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${strengthColors[alignment.alignment_strength]}`}></span>
                      <span className="text-xs text-gray-500">
                        {strengthLabels[alignment.alignment_strength]}
                      </span>
                    </div>
                    <p className="font-medium text-sm text-gray-900">
                      {alignment.functional_type === itemType ? alignment.ord_name : alignment.functional_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {alignment.functional_type === itemType ? alignment.ord_path : alignment.functional_path}
                    </p>
                    {alignment.alignment_rationale && (
                      <p className="text-xs text-gray-600 mt-2 italic">
                        {alignment.alignment_rationale}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={() => setEditingAlignment(alignment.id)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      aria-label="Edit alignment"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deleteAlignment(alignment.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      aria-label="Delete alignment"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {alignments.length === 0 && !isAddingMode && (
              <p className="text-gray-500 text-center py-4">
                No alignments found
              </p>
            )}
          </>
        )}

        {/* Add Alignment Section */}
        {isAddingMode ? (
          <div className="border-t border-gray-200 pt-3 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for items to align..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Strength Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Alignment Strength
              </label>
              <select
                value={selectedStrength}
                onChange={(e) => setSelectedStrength(e.target.value as 'strong' | 'moderate' | 'weak' | 'informational')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="strong">Strong</option>
                <option value="moderate">Moderate</option>
                <option value="weak">Weak</option>
                <option value="informational">Informational</option>
              </select>
            </div>

            {/* Rationale */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Rationale (optional)
              </label>
              <textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Why are these items aligned?"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Search Results */}
            {searchTerm.length >= 2 && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  Search Results
                </label>
                {isSearching ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.source}-${result.type}-${result.id}`}
                        onClick={() => createAlignment(result)}
                        className="w-full text-left px-3 py-2 border border-gray-200 rounded hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            result.source === 'functional' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {result.source === 'functional' ? 'Func' : 'ORD'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {result.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {result.path}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 py-2">
                    No items found matching &ldquo;{searchTerm}&rdquo;
                  </p>
                )}
              </div>
            )}

            {/* Cancel Button */}
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setIsAddingMode(false)
                  setSearchTerm("")
                  setRationale("")
                  setSelectedStrength('moderate')
                }}
                className="flex-1 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // Add Alignment Button
          <button
            onClick={() => setIsAddingMode(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <Plus size={16} />
            <span className="text-sm font-medium">Add Alignment</span>
          </button>
        )}
      </div>
    </div>
  )
}