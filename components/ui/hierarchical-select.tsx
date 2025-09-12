"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, ChevronRight, Search, Check } from "lucide-react"

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

interface HierarchicalSelectProps {
  data: HierarchicalItem[]
  placeholder: string
  selectedItem: SelectedItem | null
  onSelect: (item: SelectedItem) => void
  theme: 'green' | 'blue'
  disabled?: boolean
}

export function HierarchicalSelect({
  data,
  placeholder,
  selectedItem,
  onSelect,
  theme,
  disabled = false
}: HierarchicalSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const dropdownRef = useRef<HTMLDivElement>(null)

  const themeClasses = {
    green: {
      button: 'border-green-200 hover:border-green-300 focus:ring-green-500 focus:border-green-500',
      selectedBg: 'bg-green-50',
      selectedText: 'text-green-700',
      selectedBorder: 'border-green-200',
      itemHover: 'hover:bg-green-50',
      itemSelected: 'bg-green-100 text-green-800',
      searchFocus: 'focus:ring-green-500 focus:border-green-500'
    },
    blue: {
      button: 'border-blue-200 hover:border-blue-300 focus:ring-blue-500 focus:border-blue-500',
      selectedBg: 'bg-blue-50',
      selectedText: 'text-blue-700',
      selectedBorder: 'border-blue-200',
      itemHover: 'hover:bg-blue-50',
      itemSelected: 'bg-blue-100 text-blue-800',
      searchFocus: 'focus:ring-blue-500 focus:border-blue-500'
    }
  }

  const colors = themeClasses[theme]

  // Initialize expanded state with all nodes collapsed by default
  useEffect(() => {
    if (data.length > 0 && expandedNodes.size === 0) {
      // Start with empty set - all nodes collapsed
      setExpandedNodes(new Set())
    }
  }, [data])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm("")
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const handleSelect = (item: HierarchicalItem, path: string) => {
    // Don't allow selection of root items
    if (item.type === 'root') {
      return
    }
    
    const selectedItem: SelectedItem = {
      id: item.id,
      name: item.name,
      type: item.type,
      path: path,
      source: item.source,
      functionArea: item.functionArea
    }
    onSelect(selectedItem)
    setIsOpen(false)
    setSearchTerm("")
  }

  const buildPath = (item: HierarchicalItem, parentPath = ""): string => {
    return parentPath ? `${parentPath} > ${item.name}` : item.name
  }

  const renderItem = (item: HierarchicalItem, level = 0, parentPath = ""): React.ReactNode => {
    const currentPath = buildPath(item, parentPath)
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedNodes.has(item.id)
    const isSelected = selectedItem?.id === item.id
    const matchesSearch = searchTerm === "" || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currentPath.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch && searchTerm !== "") {
      // Check if any children match
      const hasMatchingChildren = hasChildren && item.children!.some(child => 
        child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buildPath(child, currentPath).toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (!hasMatchingChildren) return null
    }

    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'root': return '📋'
        case 'pillar': return '🏛️'
        case 'category': return '📁'
        case 'goal': return '🎯'
        case 'program': return '⚙️'
        default: return '•'
      }
    }

    return (
      <div key={item.id}>
        <div
          className={`flex items-center py-2 px-3 rounded-md text-sm ${
            item.type === 'root' 
              ? 'font-semibold text-gray-800 bg-gray-100 cursor-default'
              : isSelected 
                ? `cursor-pointer ${colors.itemSelected}`
                : `cursor-pointer ${colors.itemHover} text-gray-700`
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => handleSelect(item, currentPath)}
        >
          <div className="flex items-center flex-1 min-w-0">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleExpanded(item.id)
                }}
                className="mr-1 p-0.5 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown size={14} className="text-gray-500" />
                ) : (
                  <ChevronRight size={14} className="text-gray-500" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-5" />}
            <span className="mr-2 text-xs">{getTypeIcon(item.type)}</span>
            <span className="truncate font-medium">{item.name}</span>
            {isSelected && <Check size={14} className="ml-auto text-green-600" />}
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {item.children!.map(child => renderItem(child, level + 1, currentPath))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected item display */}
      {selectedItem && (
        <div className={`mb-2 p-3 rounded-lg border ${colors.selectedBg} ${colors.selectedBorder}`}>
          <div className={`text-sm font-medium ${colors.selectedText}`}>Selected:</div>
          <div className="text-sm text-gray-700 mt-1">{selectedItem.path}</div>
        </div>
      )}

      {/* Dropdown button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
          disabled
            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            : `bg-white ${colors.button}`
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={selectedItem ? 'text-gray-900' : 'text-gray-500'}>
            {selectedItem ? selectedItem.name : placeholder}
          </span>
          <ChevronDown 
            size={16} 
            className={`transform transition-transform ${isOpen ? 'rotate-180' : ''} ${
              disabled ? 'text-gray-400' : 'text-gray-400'
            }`} 
          />
        </div>
      </button>

      {/* Dropdown content */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:outline-none ${colors.searchFocus}`}
              />
            </div>
          </div>

          {/* Items */}
          <div className="max-h-60 overflow-y-auto p-2">
            {data.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <div>No data available</div>
              </div>
            ) : (
              <div className="space-y-1">
                {data.map(item => renderItem(item))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}