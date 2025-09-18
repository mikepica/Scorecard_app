"use client"

import { useState, useEffect, useCallback } from "react"
import { HierarchicalSelect } from "@/components/ui/hierarchical-select"

interface Alignment {
  id: string
  functional_type: string
  ord_type: string
  alignment_strength: 'strong' | 'moderate' | 'weak' | 'informational'
  alignment_rationale?: string
  functional_name: string
  functional_path: string
  functional_pillar_id?: string | null
  functional_category_id?: string | null
  functional_goal_id?: string | null
  functional_program_id?: string | null
  ord_name: string
  ord_path: string
  ord_pillar_id?: string | null
  ord_category_id?: string | null
  ord_goal_id?: string | null
  ord_program_id?: string | null
  created_at: string
}

interface HierarchicalItem {
  id: string
  name: string
  type: 'root' | 'pillar' | 'category' | 'goal' | 'program'
  children?: HierarchicalItem[]
  source?: 'ord' | 'functional'
  functionArea?: string
}

interface SelectedItem {
  id: string
  name: string
  type: 'root' | 'pillar' | 'category' | 'goal' | 'program'
  path: string
  source?: 'ord' | 'functional'
  functionArea?: string
}

interface HierarchicalData {
  combined: HierarchicalItem[]
}

interface AlignmentFormProps {
  onSave: (alignmentData: {
    functionalType: string;
    functionalId: string;
    ordType: string;
    ordId: string;
    strength: string;
    rationale?: string;
  }) => void;
  onCancel: () => void;
  initialAlignment?: Alignment;
  isEditMode?: boolean;
}

export function AlignmentForm({
  onSave,
  onCancel,
  initialAlignment,
  isEditMode = false
}: AlignmentFormProps) {
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalData>({ combined: [] })
  const [functionalItem, setFunctionalItem] = useState<SelectedItem | null>(null)
  const [ordItem, setOrdItem] = useState<SelectedItem | null>(null)
  const [initialFunctionalSelection, setInitialFunctionalSelection] = useState<SelectedItem | null>(null)
  const [initialOrdSelection, setInitialOrdSelection] = useState<SelectedItem | null>(null)
  const [strength, setStrength] = useState<'strong' | 'moderate' | 'weak' | 'informational'>(
    isEditMode && initialAlignment ? initialAlignment.alignment_strength : 'moderate'
  )
  const [rationale, setRationale] = useState(
    isEditMode && initialAlignment ? initialAlignment.alignment_rationale || '' : ''
  )
  const [isLoading, setIsLoading] = useState(true)

  const effectiveFunctionalItem = functionalItem || initialFunctionalSelection
  const effectiveOrdItem = ordItem || initialOrdSelection

  const isSubmitDisabled =
    !effectiveFunctionalItem ||
    !effectiveOrdItem ||
    (effectiveFunctionalItem.source &&
      effectiveOrdItem.source &&
      effectiveFunctionalItem.source === effectiveOrdItem.source)

  // Fetch hierarchical data on mount
  useEffect(() => {
    const fetchHierarchicalData = async () => {
      try {
        const response = await fetch('/api/alignments/hierarchy')
        if (!response.ok) throw new Error('Failed to fetch hierarchy data')
        const data = await response.json()
        setHierarchicalData(data)
      } catch (error) {
        console.error('Error fetching hierarchical data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHierarchicalData()
  }, [])

  // Helper function to extract original ID
  const extractOriginalId = (prefixedId: string) => {
    if (prefixedId.startsWith('ord-')) {
      return prefixedId.replace(/^ord-/, '')
    } else if (prefixedId.startsWith('functional-')) {
      const segments = prefixedId.split('-')
      return segments[segments.length - 1]
    }
    return prefixedId
  }

  const findSelectedItem = useCallback((targetId: string, source: 'ord' | 'functional') => {
    const traverse = (items: HierarchicalItem[], ancestors: HierarchicalItem[] = []): SelectedItem | null => {
      for (const item of items) {
        const currentAncestors = [...ancestors, item]
        if (
          item.source === source &&
          item.type !== 'root' &&
          item.id.endsWith(`-${targetId}`)
        ) {
          const path = currentAncestors
            .filter(ancestor => ancestor.type !== 'root')
            .map(ancestor => ancestor.name)
            .join(' > ')

          return {
            id: item.id,
            name: item.name,
            type: item.type,
            path,
            source: item.source,
            functionArea: item.functionArea
          }
        }

        if (item.children && item.children.length > 0) {
          const found = traverse(item.children, currentAncestors)
          if (found) {
            return found
          }
        }
      }
      return null
    }

    return traverse(hierarchicalData.combined)
  }, [hierarchicalData])

  const getFunctionalId = useCallback((alignment: Alignment) => {
    switch (alignment.functional_type) {
      case 'pillar':
        return alignment.functional_pillar_id || null
      case 'category':
        return alignment.functional_category_id || null
      case 'goal':
        return alignment.functional_goal_id || null
      case 'program':
        return alignment.functional_program_id || null
      default:
        return null
    }
  }, [])

  const getOrdId = useCallback((alignment: Alignment) => {
    switch (alignment.ord_type) {
      case 'pillar':
        return alignment.ord_pillar_id || null
      case 'category':
        return alignment.ord_category_id || null
      case 'goal':
        return alignment.ord_goal_id || null
      case 'program':
        return alignment.ord_program_id || null
      default:
        return null
    }
  }, [])

  // Pre-populate selections when in edit mode
  useEffect(() => {
    if (!isEditMode || !initialAlignment) {
      return
    }

    const functionalId = getFunctionalId(initialAlignment)
    const ordId = getOrdId(initialAlignment)

    if (functionalId) {
      const fallbackFunctionalItem: SelectedItem = {
        id: `functional-${functionalId}`,
        name: initialAlignment.functional_name,
        type: initialAlignment.functional_type as 'pillar' | 'category' | 'goal' | 'program',
        path: initialAlignment.functional_path,
        source: 'functional'
      }

      const hierarchicalFunctionalItem = findSelectedItem(functionalId, 'functional')
      const preferredFunctionalItem = hierarchicalFunctionalItem || fallbackFunctionalItem

      setInitialFunctionalSelection((prev) => {
        if (!prev) {
          return preferredFunctionalItem
        }
        if (hierarchicalFunctionalItem && prev.id === fallbackFunctionalItem.id) {
          return hierarchicalFunctionalItem
        }
        return prev
      })

      setFunctionalItem((prev) => {
        if (!prev || prev.id === fallbackFunctionalItem.id) {
          return preferredFunctionalItem
        }
        return prev
      })
    }

    if (ordId) {
      const fallbackOrdItem: SelectedItem = {
        id: `ord-${ordId}`,
        name: initialAlignment.ord_name,
        type: initialAlignment.ord_type as 'pillar' | 'category' | 'goal' | 'program',
        path: initialAlignment.ord_path,
        source: 'ord'
      }

      const hierarchicalOrdItem = findSelectedItem(ordId, 'ord')
      const preferredOrdItem = hierarchicalOrdItem || fallbackOrdItem

      setInitialOrdSelection((prev) => {
        if (!prev) {
          return preferredOrdItem
        }
        if (hierarchicalOrdItem && prev.id === fallbackOrdItem.id) {
          return hierarchicalOrdItem
        }
        return prev
      })

      setOrdItem((prev) => {
        if (!prev || prev.id === fallbackOrdItem.id) {
          return preferredOrdItem
        }
        return prev
      })
    }
  }, [
    isEditMode,
    initialAlignment,
    hierarchicalData,
    findSelectedItem,
    getFunctionalId,
    getOrdId
  ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!effectiveFunctionalItem || !effectiveOrdItem) {
      return
    }

    // If both items are from the same source, we can't create an alignment
    if (
      effectiveFunctionalItem.source &&
      effectiveOrdItem.source &&
      effectiveFunctionalItem.source === effectiveOrdItem.source
    ) {
      return
    }

    onSave({
      functionalType: effectiveFunctionalItem.type,
      functionalId: extractOriginalId(effectiveFunctionalItem.id),
      ordType: effectiveOrdItem.type,
      ordId: extractOriginalId(effectiveOrdItem.id),
      strength,
      rationale: rationale.trim() || undefined
    })
  }

  const strengthColors = {
    strong: 'bg-green-500',
    moderate: 'bg-blue-500',
    weak: 'bg-yellow-500',
    informational: 'bg-gray-500'
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading hierarchy data...</span>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="space-y-6">
        {/* First Item Selection */}
        <div>
          <HierarchicalSelect
            data={hierarchicalData.combined}
            placeholder="Select first item..."
            selectedItem={functionalItem || initialFunctionalSelection}
            onSelect={setFunctionalItem}
            theme="green"
          />
        </div>

        {/* Second Item Selection */}
        <div>
          <HierarchicalSelect
            data={hierarchicalData.combined}
            placeholder="Select second item..."
            selectedItem={ordItem || initialOrdSelection}
            onSelect={setOrdItem}
            theme="blue"
          />
        </div>

        {/* Strength Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alignment Strength
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['strong', 'moderate', 'weak', 'informational'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStrength(option)}
                className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                  strength === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${strengthColors[option]}`}></span>
                <span className="text-sm font-medium capitalize">{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Rationale */}
        <div>
          <label htmlFor="alignment-rationale" className="block text-sm font-medium text-gray-700 mb-2">
            Rationale (optional)
          </label>
          <textarea
            id="alignment-rationale"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Why should these items be aligned?"
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isEditMode ? 'Save Changes' : 'Create Alignment'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}
