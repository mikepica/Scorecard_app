"use client"

import { useState } from "react"
import { Search, Plus, ChevronDown, ChevronRight } from "lucide-react"

interface UnalignedItem {
  id: string
  type: 'pillar' | 'category' | 'goal' | 'program'
  source: 'functional' | 'ord'
  name: string
  path: string
}

interface UnalignedItemsSidebarProps {
  items: UnalignedItem[]
  onCreateAlignment?: (item: UnalignedItem) => void
  isLoading?: boolean
}

export function UnalignedItemsSidebar({ 
  items, 
  onCreateAlignment, 
  isLoading = false 
}: UnalignedItemsSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set(['functional', 'ord']))
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['program', 'goal']))

  const filteredItems = items.filter(item =>
    searchTerm === "" || 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.path.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleSource = (source: string) => {
    const newExpanded = new Set(expandedSources)
    if (newExpanded.has(source)) {
      newExpanded.delete(source)
    } else {
      newExpanded.add(source)
    }
    setExpandedSources(newExpanded)
  }

  const toggleType = (key: string) => {
    const newExpanded = new Set(expandedTypes)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedTypes(newExpanded)
  }

  const groupedItems = filteredItems.reduce((acc, item) => {
    const sourceKey = item.source
    const typeKey = `${item.source}-${item.type}`
    
    if (!acc[sourceKey]) {
      acc[sourceKey] = {}
    }
    if (!acc[sourceKey][typeKey]) {
      acc[sourceKey][typeKey] = []
    }
    acc[sourceKey][typeKey].push(item)
    return acc
  }, {} as Record<string, Record<string, UnalignedItem[]>>)

  const typeLabels = {
    pillar: 'Pillars',
    category: 'Categories', 
    goal: 'Goals',
    program: 'Programs'
  }

  const sourceColors = {
    functional: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      dot: 'bg-green-500'
    },
    ord: {
      bg: 'bg-blue-50',
      border: 'border-blue-200', 
      text: 'text-blue-700',
      dot: 'bg-blue-500'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Unaligned Items</h3>
        <p className="text-sm text-gray-500 mt-1">
          {items.length} items could benefit from alignments
        </p>
      </div>
      
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search unaligned items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="text-gray-500">
              {searchTerm ? 'No items found' : 'All items aligned!'}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {searchTerm 
                ? 'Try adjusting your search'
                : 'Great work on your alignment coverage'
              }
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {Object.entries(groupedItems).map(([source, typeGroups]) => {
              const isSourceExpanded = expandedSources.has(source)
              const colors = sourceColors[source as 'functional' | 'ord']
              
              return (
                <div key={source}>
                  {/* Source Header */}
                  <button
                    onClick={() => toggleSource(source)}
                    className="w-full flex items-center justify-between py-2 text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${colors.dot}`}></div>
                      <span className={`text-sm font-medium ${colors.text}`}>
                        {source.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({Object.values(typeGroups).reduce((sum, items) => sum + items.length, 0)})
                      </span>
                    </div>
                    {isSourceExpanded ? (
                      <ChevronDown size={16} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400" />
                    )}
                  </button>
                  
                  {/* Types */}
                  {isSourceExpanded && (
                    <div className="ml-5 space-y-3">
                      {Object.entries(typeGroups).map(([typeKey, items]) => {
                        const type = typeKey.split('-')[1]
                        const isTypeExpanded = expandedTypes.has(typeKey)
                        
                        return (
                          <div key={typeKey}>
                            {/* Type Header */}
                            <button
                              onClick={() => toggleType(typeKey)}
                              className="w-full flex items-center justify-between py-1 text-left"
                            >
                              <span className="text-xs font-medium text-gray-600">
                                {typeLabels[type as keyof typeof typeLabels]} ({items.length})
                              </span>
                              {isTypeExpanded ? (
                                <ChevronDown size={14} className="text-gray-400" />
                              ) : (
                                <ChevronRight size={14} className="text-gray-400" />
                              )}
                            </button>
                            
                            {/* Items */}
                            {isTypeExpanded && (
                              <div className="ml-2 space-y-2 mt-2">
                                {items.slice(0, 10).map(item => (
                                  <div
                                    key={`${item.source}-${item.id}`}
                                    className={`group p-3 border rounded-lg cursor-pointer hover:shadow-sm transition-all ${colors.bg} ${colors.border} hover:border-opacity-70`}
                                    onClick={() => onCreateAlignment?.(item)}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm text-gray-900 truncate">
                                          {item.name}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 truncate" title={item.path}>
                                          {item.path}
                                        </div>
                                      </div>
                                      <div className="opacity-0 group-hover:opacity-100 ml-2 transition-opacity">
                                        <Plus size={16} className={colors.text} />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {items.length > 10 && (
                                  <div className="text-xs text-gray-400 text-center py-2">
                                    +{items.length - 10} more {type}s
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredItems.length > 0 && (
        <div className="p-4 border-t border-gray-200 text-center">
          <div className="text-xs text-gray-500">
            Click any item to create an alignment
          </div>
        </div>
      )}
    </div>
  )
}