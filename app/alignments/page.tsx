"use client"

import { useState, useEffect } from "react"
import { Search, Settings, MessageCircle, Plus } from "lucide-react"
import { AlignmentCard } from "@/components/alignment-card"
import { UnalignedItemsSidebar } from "@/components/unaligned-items-sidebar"
import { AIAlignmentInbox } from "@/components/ai-alignment-inbox"
import { AIChat } from "@/components/ai-chat"
import { Header } from "@/components/header"
import { HierarchicalSelect } from "@/components/ui/hierarchical-select"

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

interface UnalignedItem {
  id: string
  type: 'pillar' | 'category' | 'goal' | 'program'
  source: 'functional' | 'ord'
  name: string
  path: string
}

interface HierarchicalItem {
  id: string
  name: string
  type: 'pillar' | 'category' | 'goal' | 'program'
  children?: HierarchicalItem[]
}

interface SelectedItem {
  id: string
  name: string
  type: 'pillar' | 'category' | 'goal' | 'program'
  path: string
}

interface HierarchicalData {
  functional: HierarchicalItem[]
  ord: HierarchicalItem[]
}

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

function CreateAlignmentForm({ 
  onSave, 
  onCancel 
}: { 
  onSave: (alignmentData: {
    functionalType: string;
    functionalId: string;
    ordType: string;
    ordId: string;
    strength: string;
    rationale?: string;
  }) => void; 
  onCancel: () => void; 
}) {
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalData>({ functional: [], ord: [] })
  const [functionalItem, setFunctionalItem] = useState<SelectedItem | null>(null)
  const [ordItem, setOrdItem] = useState<SelectedItem | null>(null)
  const [strength, setStrength] = useState<'strong' | 'moderate' | 'weak' | 'informational'>('moderate')
  const [rationale, setRationale] = useState('')
  const [isLoading, setIsLoading] = useState(true)

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!functionalItem || !ordItem) {
      return
    }
    onSave({
      functionalType: functionalItem.type,
      functionalId: functionalItem.id,
      ordType: ordItem.type,
      ordId: ordItem.id,
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
        {/* Functional Side */}
        <div>
          <h4 className="font-medium text-green-600 mb-3">FUNCTIONAL SIDE</h4>
          <HierarchicalSelect
            data={hierarchicalData.functional}
            placeholder="Select functional item..."
            selectedItem={functionalItem}
            onSelect={setFunctionalItem}
            theme="green"
          />
        </div>

        {/* ORD Side */}
        <div>
          <h4 className="font-medium text-blue-600 mb-3">ORD SIDE</h4>
          <HierarchicalSelect
            data={hierarchicalData.ord}
            placeholder="Select ORD item..."
            selectedItem={ordItem}
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
          <label htmlFor="create-rationale" className="block text-sm font-medium text-gray-700 mb-2">
            Rationale (optional)
          </label>
          <textarea
            id="create-rationale"
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
            disabled={!functionalItem || !ordItem}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Create Alignment
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

function EditAlignmentForm({ 
  alignment, 
  onSave, 
  onCancel 
}: { 
  alignment: Alignment; 
  onSave: (updates: { strength: string; rationale?: string }) => void; 
  onCancel: () => void; 
}) {
  const [strength, setStrength] = useState(alignment.alignment_strength)
  const [rationale, setRationale] = useState(alignment.alignment_rationale || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ strength, rationale: rationale.trim() || undefined })
  }

  const strengthColors = {
    strong: 'bg-green-500',
    moderate: 'bg-blue-500',
    weak: 'bg-yellow-500',
    informational: 'bg-gray-500'
  }

  return (
    <form onSubmit={handleSubmit} className="p-6">
      {/* Alignment Preview */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-green-600 mb-1">FUNCTIONAL</div>
            <div className="font-semibold">{alignment.functional_name}</div>
          </div>
          <div>
            <div className="font-medium text-blue-600 mb-1">ORD</div>
            <div className="font-semibold">{alignment.ord_name}</div>
          </div>
        </div>
      </div>

      {/* Strength Selection */}
      <div className="mb-4">
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
      <div className="mb-6">
        <label htmlFor="rationale" className="block text-sm font-medium text-gray-700 mb-2">
          Rationale (optional)
        </label>
        <textarea
          id="rationale"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Why are these items aligned?"
        />
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function AlignmentsPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'suggestions'>('active')
  const [alignments, setAlignments] = useState<Alignment[]>([])
  const [unalignedItems, setUnalignedItems] = useState<UnalignedItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStrength, setSelectedStrength] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [editingAlignment, setEditingAlignment] = useState<Alignment | null>(null)
  const [isCreatingAlignment, setIsCreatingAlignment] = useState(false)

  useEffect(() => {
    fetchAlignments()
    fetchUnalignedItems()
  }, [])

  const fetchAlignments = async () => {
    try {
      console.log('Fetching alignments from /api/alignments/all')
      const response = await fetch('/api/alignments/all')
      console.log('Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Alignments data received:', data)
        setAlignments(data.alignments || [])
      } else {
        console.error('Failed to fetch alignments:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching alignments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUnalignedItems = async () => {
    try {
      const response = await fetch('/api/alignments/unaligned')
      if (response.ok) {
        const data = await response.json()
        setUnalignedItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching unaligned items:', error)
    }
  }

  const filteredAlignments = alignments.filter(alignment => {
    const matchesSearch = searchTerm === "" || 
      alignment.functional_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alignment.ord_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alignment.alignment_rationale?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStrength = selectedStrength === "all" || alignment.alignment_strength === selectedStrength

    return matchesSearch && matchesStrength
  })

  const handleEditAlignment = (alignment: Alignment) => {
    setEditingAlignment(alignment)
  }

  const handleSaveEdit = async (alignmentId: string, updates: { strength: string; rationale?: string }) => {
    try {
      const response = await fetch(`/api/alignments?id=${alignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        // Update local state
        setAlignments(alignments.map(a => 
          a.id === alignmentId 
            ? { ...a, alignment_strength: updates.strength as any, alignment_rationale: updates.rationale }
            : a
        ))
        setEditingAlignment(null)
      } else {
        console.error('Failed to update alignment')
      }
    } catch (error) {
      console.error('Error updating alignment:', error)
    }
  }

  const handleDeleteAlignment = async (alignmentId: string) => {
    try {
      const response = await fetch(`/api/alignments?id=${alignmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAlignments(alignments.filter(a => a.id !== alignmentId))
      } else {
        throw new Error('Failed to delete alignment')
      }
    } catch (error) {
      console.error('Error deleting alignment:', error)
      throw error
    }
  }

  const handleViewAlignment = (alignment: Alignment) => {
    console.log('View alignment:', alignment)
  }

  const handleCreateAlignment = (item: UnalignedItem) => {
    console.log('Create alignment for:', item)
  }

  const handleCreateNewAlignment = async (alignmentData: {
    functionalType: string;
    functionalId: string;
    ordType: string;
    ordId: string;
    strength: string;
    rationale?: string;
  }) => {
    try {
      const response = await fetch('/api/alignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...alignmentData,
          createdBy: 'user'
        })
      })

      if (response.ok) {
        await fetchAlignments()
        await fetchUnalignedItems()
        setIsCreatingAlignment(false)
      } else {
        console.error('Failed to create alignment')
      }
    } catch (error) {
      console.error('Error creating alignment:', error)
    }
  }

  const handleAcceptSuggestion = async (suggestion: AlignmentSuggestion) => {
    try {
      const response = await fetch('/api/alignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionalType: suggestion.functional_type,
          functionalId: suggestion.functional_id,
          ordType: suggestion.ord_type,
          ordId: suggestion.ord_id,
          strength: suggestion.suggested_strength,
          rationale: suggestion.ai_rationale,
          createdBy: 'ai-suggestion'
        })
      })

      if (response.ok) {
        await fetchAlignments()
        await fetchUnalignedItems()
      }
    } catch (error) {
      console.error('Error accepting suggestion:', error)
    }
  }

  const handleRejectSuggestion = (suggestion: AlignmentSuggestion) => {
    console.log('Reject suggestion:', suggestion)
  }

  const handleBulkSuggestionAction = async (action: 'accept' | 'reject', suggestions: AlignmentSuggestion[]) => {
    if (action === 'accept') {
      for (const suggestion of suggestions) {
        await handleAcceptSuggestion(suggestion)
      }
    } else {
      console.log('Bulk reject:', suggestions)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        title="Alignments Dashboard"
        onToggleChat={() => setIsChatOpen(true)}
        isFunctionalView={false}
        showScorecardLink={true}
      />
      
      {/* Sub-header with alignment count */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {alignments.length} active alignments
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'active'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Active Alignments ({alignments.length})
              </button>
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'suggestions'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                AI Suggestions (0)
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search alignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={selectedStrength}
                onChange={(e) => setSelectedStrength(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Strengths</option>
                <option value="strong">Strong</option>
                <option value="moderate">Moderate</option>
                <option value="weak">Weak</option>
                <option value="informational">Informational</option>
              </select>
              <button
                onClick={() => setIsCreatingAlignment(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus size={16} />
                <span>Create New</span>
              </button>
            </div>

            {/* Content Area */}
            {activeTab === 'active' ? (
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredAlignments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500 text-lg mb-2">No alignments found</div>
                    <div className="text-gray-400 text-sm">
                      {searchTerm || selectedStrength !== "all" 
                        ? "Try adjusting your search or filters"
                        : "Create your first alignment from the sidebar"
                      }
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAlignments.map((alignment) => (
                      <AlignmentCard
                        key={alignment.id}
                        alignment={alignment}
                        onEdit={handleEditAlignment}
                        onDelete={handleDeleteAlignment}
                        onView={handleViewAlignment}
                      />
                    ))}
                  </div>
                )}}
              </div>
            ) : (
              <AIAlignmentInbox
                onAcceptSuggestion={handleAcceptSuggestion}
                onRejectSuggestion={handleRejectSuggestion}
                onBulkAction={handleBulkSuggestionAction}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80">
            <UnalignedItemsSidebar
              items={unalignedItems}
              onCreateAlignment={handleCreateAlignment}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Create Alignment Modal */}
      {isCreatingAlignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Alignment</h3>
            </div>
            
            <CreateAlignmentForm
              onSave={handleCreateNewAlignment}
              onCancel={() => setIsCreatingAlignment(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Alignment Modal */}
      {editingAlignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Alignment</h3>
            </div>
            
            <EditAlignmentForm
              alignment={editingAlignment}
              onSave={(updates) => handleSaveEdit(editingAlignment.id, updates)}
              onCancel={() => setEditingAlignment(null)}
            />
          </div>
        </div>
      )}

      {/* AI Chat Assistant */}
      <AIChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        context={{ pillars: [] }}
      />
    </div>
  )
}