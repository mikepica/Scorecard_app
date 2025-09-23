import React from 'react'

interface ItemFunctionTooltipProps {
  itemType: 'pillar' | 'category' | 'goal'
  itemName: string
  functions: string[]
  isVisible: boolean
  position: { x: number; y: number }
}

export const ItemFunctionTooltip: React.FC<ItemFunctionTooltipProps> = ({
  itemType,
  itemName,
  functions,
  isVisible,
  position
}) => {
  if (!isVisible) return null

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'pillar': return 'Strategic Pillar'
      case 'category': return 'Category'
      case 'goal': return 'Strategic Goal'
      default: return 'Item'
    }
  }

  return (
    <div
      className="fixed z-50 bg-gray-800 border-2 border-lime-400 rounded-lg p-3 shadow-lg pointer-events-none"
      style={{
        left: position.x + 15,
        top: position.y - 10,
        maxWidth: '300px'
      }}
    >
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-lime-400 font-medium">{getItemTypeLabel(itemType)}:</span>
          <span className="text-white ml-2">{itemName}</span>
        </div>

        <div className="border-t border-gray-600 pt-2"></div>

        <div>
          <span className="text-lime-400 font-medium">Associated Functions:</span>
          <div className="text-white ml-2 mt-1">
            {functions.length > 0 ? (
              functions.map((func, index) => (
                <div key={index} className="py-0.5">• {func}</div>
              ))
            ) : (
              <span>No functions associated</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}