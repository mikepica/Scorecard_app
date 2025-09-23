"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Link } from "lucide-react"
import { AlignmentCard } from "@/components/alignment-card"

interface Alignment {
  id: string
  functional_type: string
  ord_type: string
  alignment_strength: 'strong' | 'moderate' | 'weak' | 'informational'
  alignment_rationale?: string
  functional_name: string
  functional_path: string
  functional_function?: string
  ord_name: string
  ord_path: string
  created_at: string
}

interface AlignmentModalProps {
  isOpen: boolean
  onClose: () => void
  itemType: 'pillar' | 'category' | 'goal' | 'program'
  itemId: string
  itemName: string
  itemPath: string
  onEdit?: (alignment: Alignment) => void
}

export function AlignmentModal({
  isOpen,
  onClose,
  itemType,
  itemId,
  itemName,
  itemPath,
  onEdit
}: AlignmentModalProps) {
  const [alignments, setAlignments] = useState<Alignment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAlignments = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/alignments?itemType=${itemType}&itemId=${itemId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch alignments')
      }
      const data = await response.json()
      setAlignments(data.alignments || [])
    } catch (err) {
      console.error('Error fetching alignments:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch alignments')
    } finally {
      setIsLoading(false)
    }
  }, [itemType, itemId])

  useEffect(() => {
    if (isOpen && itemId) {
      fetchAlignments()
    }
  }, [isOpen, itemId, fetchAlignments])

  const handleEdit = (alignment: Alignment) => {
    // Close the current modal and trigger edit in parent
    onClose()
    // Pass alignment data to parent for editing
    if (onEdit) {
      onEdit(alignment)
    }
  }

  const handleDelete = async (alignmentId: string) => {
    try {
      const response = await fetch(`/api/alignments?id=${alignmentId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error('Failed to delete alignment')
      }
      // Refresh alignments after deletion
      await fetchAlignments()
    } catch (err) {
      console.error('Error deleting alignment:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete alignment')
    }
  }

  const handleView = (alignment: Alignment) => {
    // For now, just log - could be extended to navigate to alignment details
    console.log('View alignment:', alignment)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Link size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Alignments</h2>
              <p className="text-sm text-gray-600">
                {itemName} • {itemPath}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading alignments...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <X size={48} className="mx-auto mb-2" />
                <p className="font-medium">Error loading alignments</p>
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={fetchAlignments}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : alignments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Link size={48} className="mx-auto mb-2" />
                <p className="font-medium">No alignments found</p>
                <p className="text-sm">This item doesn&apos;t have any alignments yet.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-600">
                  {alignments.length} alignment{alignments.length !== 1 ? 's' : ''} found
                </p>
              </div>
              
              <div className="grid gap-4">
                {alignments.map((alignment) => (
                  <AlignmentCard
                    key={alignment.id}
                    alignment={alignment}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
