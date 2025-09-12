"use client"

import { useState } from "react"
import { Edit3, Trash2, ExternalLink } from "lucide-react"

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

interface AlignmentCardProps {
  alignment: Alignment
  onEdit?: (alignment: Alignment) => void
  onDelete?: (alignmentId: string) => void
  onView?: (alignment: Alignment) => void
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

export function AlignmentCard({ 
  alignment, 
  onEdit, 
  onDelete, 
  onView 
}: AlignmentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this alignment?')) {
      setIsDeleting(true)
      try {
        await onDelete?.(alignment.id)
      } catch (error) {
        console.error('Error deleting alignment:', error)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group">
      {/* Header with strength indicator and date */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className={`w-3 h-3 rounded-full ${strengthColors[alignment.alignment_strength]}`}></span>
          <span className="text-sm font-medium text-gray-900">
            {strengthLabels[alignment.alignment_strength]}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-500">
            {new Date(alignment.created_at).toLocaleDateString()}
          </div>
          {onView && (
            <button
              onClick={() => onView(alignment)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-all"
              title="View details"
            >
              <ExternalLink size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Alignment connection display */}
      <div className="space-y-3">
        {/* Functional item */}
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <div className="text-xs text-green-600 font-medium">FUNCTIONAL</div>
          </div>
          <div className="font-semibold text-gray-900 leading-tight">
            {alignment.functional_name}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {alignment.functional_path}
          </div>
        </div>

        {/* Connection indicator */}
        <div className="flex justify-center py-1">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-px bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <div className="w-6 h-px bg-gray-300"></div>
          </div>
        </div>

        {/* ORD item */}
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <div className="text-xs text-blue-600 font-medium">ORD</div>
          </div>
          <div className="font-semibold text-gray-900 leading-tight">
            {alignment.ord_name}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {alignment.ord_path}
          </div>
        </div>

        {/* Rationale */}
        {alignment.alignment_rationale && (
          <div className="pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-400 font-medium mb-1">RATIONALE</div>
            <div className="text-sm text-gray-600 italic leading-relaxed">
              {alignment.alignment_rationale}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
        {onEdit && (
          <button
            onClick={() => onEdit(alignment)}
            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <Edit3 size={14} />
            <span>Edit</span>
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} />
            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
          </button>
        )}
      </div>
    </div>
  )
}