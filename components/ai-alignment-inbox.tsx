"use client"

import { useState, useEffect } from "react"
import { Check, X, Sparkles, RefreshCw, ChevronDown, ChevronRight } from "lucide-react"

interface AlignmentSuggestion {
  id: string
  functional_type: string
  functional_id: string
  functional_name: string
  functional_path: string
  ord_type: string
  ord_id: string
  ord_name: string
  ord_path: string
  suggested_strength: 'strong' | 'moderate' | 'weak' | 'informational'
  ai_rationale: string
  confidence_score: number
  created_at: string
}

interface AIAlignmentInboxProps {
  onAcceptSuggestion?: (suggestion: AlignmentSuggestion) => void
  onRejectSuggestion?: (suggestion: AlignmentSuggestion) => void
  onBulkAction?: (action: 'accept' | 'reject', suggestions: AlignmentSuggestion[]) => void
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

export function AIAlignmentInbox({
  onAcceptSuggestion,
  onRejectSuggestion,
  onBulkAction
}: AIAlignmentInboxProps) {
  const [suggestions, setSuggestions] = useState<AlignmentSuggestion[]>([])
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/alignments/suggestions')
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateNewSuggestions = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/alignments/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Error generating suggestions:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSuggestionSelect = (suggestionId: string) => {
    const newSelected = new Set(selectedSuggestions)
    if (newSelected.has(suggestionId)) {
      newSelected.delete(suggestionId)
    } else {
      newSelected.add(suggestionId)
    }
    setSelectedSuggestions(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedSuggestions.size === suggestions.length) {
      setSelectedSuggestions(new Set())
    } else {
      setSelectedSuggestions(new Set(suggestions.map(s => s.id)))
    }
  }

  const handleBulkAccept = () => {
    const selectedItems = suggestions.filter(s => selectedSuggestions.has(s.id))
    onBulkAction?.('accept', selectedItems)
    setSelectedSuggestions(new Set())
  }

  const handleBulkReject = () => {
    const selectedItems = suggestions.filter(s => selectedSuggestions.has(s.id))
    onBulkAction?.('reject', selectedItems)
    setSelectedSuggestions(new Set())
  }

  const toggleExpanded = (suggestionId: string) => {
    const newExpanded = new Set(expandedSuggestions)
    if (newExpanded.has(suggestionId)) {
      newExpanded.delete(suggestionId)
    } else {
      newExpanded.add(suggestionId)
    }
    setExpandedSuggestions(newExpanded)
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50'
    if (score >= 0.6) return 'text-blue-600 bg-blue-50'
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="text-purple-500" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">AI Suggestions</h3>
          </div>
          <button
            onClick={generateNewSuggestions}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
            <span>{isGenerating ? 'Generating...' : 'Generate New'}</span>
          </button>
        </div>
        
        {suggestions.length > 0 && (
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={selectedSuggestions.size === suggestions.length}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Select All</span>
            </label>
            {selectedSuggestions.size > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkAccept}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Check size={14} />
                  <span>Accept ({selectedSuggestions.size})</span>
                </button>
                <button
                  onClick={handleBulkReject}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <X size={14} />
                  <span>Reject ({selectedSuggestions.size})</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <Sparkles className="mx-auto text-gray-400 mb-4" size={48} />
          <div className="text-gray-500 text-lg mb-2">No AI suggestions yet</div>
          <div className="text-gray-400 text-sm mb-4">
            Generate suggestions to discover potential alignments
          </div>
          <button
            onClick={generateNewSuggestions}
            disabled={isGenerating}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate Suggestions'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion) => {
            const isExpanded = expandedSuggestions.has(suggestion.id)
            const isSelected = selectedSuggestions.has(suggestion.id)
            
            return (
              <div
                key={suggestion.id}
                className={`bg-white rounded-lg border-2 transition-all ${
                  isSelected 
                    ? 'border-blue-500 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSuggestionSelect(suggestion.id)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    
                    <div className="flex-1 min-w-0">
                      {/* Suggestion Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className={`w-3 h-3 rounded-full ${strengthColors[suggestion.suggested_strength]}`}></span>
                          <span className="text-sm font-medium text-gray-900">
                            {strengthLabels[suggestion.suggested_strength]} Alignment
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(suggestion.confidence_score)}`}>
                            {Math.round(suggestion.confidence_score * 100)}% confidence
                          </span>
                        </div>
                        
                        <button
                          onClick={() => toggleExpanded(suggestion.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </div>

                      {/* Connection Preview */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <div className="text-xs text-green-600 font-medium">FUNCTIONAL</div>
                          </div>
                          <div className="font-semibold text-sm text-gray-900">{suggestion.functional_name}</div>
                          <div className="text-xs text-gray-500">{suggestion.functional_path}</div>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <div className="text-xs text-blue-600 font-medium">ORD</div>
                          </div>
                          <div className="font-semibold text-sm text-gray-900">{suggestion.ord_name}</div>
                          <div className="text-xs text-gray-500">{suggestion.ord_path}</div>
                        </div>
                      </div>

                      {/* AI Rationale (expandable) */}
                      {isExpanded && (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-400 font-medium mb-2">AI REASONING</div>
                          <div className="text-sm text-gray-600 leading-relaxed">
                            {suggestion.ai_rationale}
                          </div>
                        </div>
                      )}

                      {/* Individual Actions */}
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => onAcceptSuggestion?.(suggestion)}
                          className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        >
                          <Check size={14} />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => onRejectSuggestion?.(suggestion)}
                          className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}