"use client"

import { useState, useEffect } from "react"
import { Link } from "lucide-react"

interface AlignmentIndicatorProps {
  itemType: 'pillar' | 'category' | 'goal' | 'program'
  itemId: string
  onClick?: () => void
  className?: string
}

export function AlignmentIndicator({ 
  itemType, 
  itemId, 
  onClick, 
  className = "" 
}: AlignmentIndicatorProps) {
  const [alignmentCount, setAlignmentCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAlignmentCount() {
      try {
        const response = await fetch(`/api/alignments/count?itemType=${itemType}&itemId=${itemId}`)
        if (response.ok) {
          const data = await response.json()
          setAlignmentCount(data.count)
        }
      } catch (error) {
        console.error('Error fetching alignment count:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAlignmentCount()
  }, [itemType, itemId])

  // Don't render if still loading or if no alignments
  if (isLoading || alignmentCount === 0) {
    return null
  }

  return (
    <button
      onClick={onClick}
      className={`
        relative inline-flex items-center justify-center
        text-gray-500 hover:text-blue-600
        transition-colors duration-200
        ${className}
      `}
      title={`${alignmentCount} alignment${alignmentCount !== 1 ? 's' : ''}`}
      aria-label={`View ${alignmentCount} alignment${alignmentCount !== 1 ? 's' : ''}`}
    >
      <Link size={14} />
      <span className="
        absolute -top-1 -right-1 
        bg-blue-500 text-white 
        text-xs font-bold 
        rounded-full 
        min-w-[16px] h-4 
        flex items-center justify-center 
        leading-none px-1
      ">
        {alignmentCount > 9 ? '9+' : alignmentCount}
      </span>
    </button>
  )
}