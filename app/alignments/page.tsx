"use client"

import { useState, useEffect } from "react"
import { Search, Settings, MessageCircle } from "lucide-react"
import { AlignmentCard } from "@/components/alignment-card"
import { UnalignedItemsSidebar } from "@/components/unaligned-items-sidebar"
import { AIAlignmentInbox } from "@/components/ai-alignment-inbox"
import { AIChat } from "@/components/ai-chat"
import { Header } from "@/components/header"

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

export default function AlignmentsPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'suggestions'>('active')
  const [alignments, setAlignments] = useState<Alignment[]>([])
  const [unalignedItems, setUnalignedItems] = useState<UnalignedItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStrength, setSelectedStrength] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)

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
    console.log('Edit alignment:', alignment)
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

      {/* AI Chat Assistant */}
      <AIChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        context={{ pillars: [] }}
      />
    </div>
  )
}