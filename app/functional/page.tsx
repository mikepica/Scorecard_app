"use client"

import { useEffect, useState, useRef } from "react"
import { Scorecard } from "@/components/scorecard"
import type { ScoreCardData, StrategicProgram } from "@/types/scorecard"
import { Camera, BarChart2, Menu, FileText, Bot, Info, X, Users } from "lucide-react"
import Link from "next/link"
import { Toast } from "@/components/toast"
import { AIChat } from "@/components/ai-chat"
import { Dropdown } from "@/components/dropdown"
import { AIFlowsModal } from "@/components/ai-flows-modal"
import { ProgramDetailsSidebar } from "@/components/program-details-sidebar"
import BragStatusTable from "@/components/brag-status-table"
import { FunctionDropdown } from "@/components/function-dropdown"
import { FilterModal } from "@/components/filter-modal"
import { Header } from "@/components/header"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

export default function FunctionalView() {
  const searchParams = useSearchParams()
  const selectedFunction = searchParams.get('function')
  
  const [data, setData] = useState<ScoreCardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  
  // Filter modal state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  
  // Filter state - default to "all"
  const ALL_VALUE = "all"
  const [selectedOrdLtSponsor, setSelectedOrdLtSponsor] = useState(ALL_VALUE)
  const [selectedSponsorsLead, setSelectedSponsorsLead] = useState(ALL_VALUE)
  const [selectedReportingOwner, setSelectedReportingOwner] = useState(ALL_VALUE)
  const [selectedGoal, setSelectedGoal] = useState(ALL_VALUE)
  
  // Program details sidebar state
  const [isProgramSidebarOpen, setIsProgramSidebarOpen] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<(StrategicProgram & {
    goalText?: string
    categoryName?: string
    pillarName?: string
  }) | null>(null)
  
  // Function to get current quarter based on today's date
  const getCurrentQuarter = () => {
    const today = new Date()
    const month = today.getMonth() + 1 // getMonth() returns 0-11, we want 1-12
    const year = today.getFullYear()
    
    if (month >= 1 && month <= 3) return `q1_${year}`
    if (month >= 4 && month <= 6) return `q2_${year}`
    if (month >= 7 && month <= 9) return `q3_${year}`
    return `q4_${year}`
  }

  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter())
  const [isAIFlowsModalOpen, setIsAIFlowsModalOpen] = useState(false)
  const [aiFlowType] = useState<"goal-comparison" | "learnings-best-practices">("goal-comparison")
  const aiFlowsDropdownRef = useRef<HTMLDivElement>(null)

  const QUARTER_OPTIONS = [
    { value: "q1_2025", label: "Q1 2025" },
    { value: "q2_2025", label: "Q2 2025" },
    { value: "q3_2025", label: "Q3 2025" },
    { value: "q4_2025", label: "Q4 2025" },
    { value: "q1_2026", label: "Q1 2026" },
    { value: "q2_2026", label: "Q2 2026" },
    { value: "q3_2026", label: "Q3 2026" },
    { value: "q4_2026", label: "Q4 2026" },
  ]

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const apiUrl = selectedFunction 
          ? `/api/functional-scorecard?function=${encodeURIComponent(selectedFunction)}`
          : '/api/functional-scorecard'
        const response = await fetch(apiUrl)
        if (!response.ok) {
          throw new Error('Failed to load functional scorecard data')
        }
        const loadedData = await response.json()
        setData(loadedData)
      } catch (error) {
        console.error('Error loading functional scorecard data:', error)
        setToast({
          message: "Failed to load functional scorecard data",
          type: "error"
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedFunction])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (aiFlowsDropdownRef.current && !aiFlowsDropdownRef.current.contains(event.target as Node)) {
        // setIsAIFlowsDropdownOpen(false) // This function doesn't exist in this component
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleDataUpdate = (newData: ScoreCardData) => {
    setData(newData)
    setToast({ message: "Changes saved successfully", type: "success" })
  }

  // Extract all programs for filter processing
  const allPrograms = useMemo(() => {
    const programs: Array<StrategicProgram & { goalText: string; categoryName: string; pillarName: string }> = []

    if (!data) {
      return programs
    }

    data.pillars.forEach((pillar) => {
      pillar.categories.forEach((category) => {
        category.goals.forEach((goal) => {
          if (goal.programs && goal.programs.length > 0) {
            goal.programs.forEach((program) => {
              programs.push({
                ...program,
                goalText: goal.text,
                categoryName: category.name,
                pillarName: pillar.name,
              })
            })
          }
        })
      })
    })

    return programs
  }, [data])

  // Get filtered programs based on selections
  const filteredPrograms = useMemo(() => {
    return allPrograms.filter(program => {
      // Get sponsor arrays for this program
      const ordLtSponsors = program.ordLtSponsors || ['(Not Specified)']
      const sponsorsLeads = program.sponsorsLeads || ['(Not Specified)']
      const reportingOwners = program.reportingOwners || ['(Not Specified)']
      
      // Check sponsor filters
      const ordLtMatch = selectedOrdLtSponsor === ALL_VALUE || ordLtSponsors.includes(selectedOrdLtSponsor)
      const sponsorsLeadMatch = selectedSponsorsLead === ALL_VALUE || sponsorsLeads.includes(selectedSponsorsLead)
      const reportingOwnerMatch = selectedReportingOwner === ALL_VALUE || reportingOwners.includes(selectedReportingOwner)
      
      // Check goal filter
      const goalMatch = selectedGoal === ALL_VALUE || program.strategicGoalId === selectedGoal
      
      return ordLtMatch && sponsorsLeadMatch && reportingOwnerMatch && goalMatch
    })
  }, [selectedOrdLtSponsor, selectedSponsorsLead, selectedReportingOwner, selectedGoal, allPrograms])

  // Filter data to only show content that matches filters
  const filteredData = useMemo(() => {
    if (!data || (selectedOrdLtSponsor === ALL_VALUE && selectedSponsorsLead === ALL_VALUE && selectedReportingOwner === ALL_VALUE && selectedGoal === ALL_VALUE)) {
      return data
    }

    const filteredProgramIds = new Set(filteredPrograms.map(p => p.id))
    
    const filteredPillars = data.pillars.map(pillar => ({
      ...pillar,
      categories: pillar.categories.map(category => ({
        ...category,
        goals: category.goals.map(goal => ({
          ...goal,
          programs: goal.programs ? goal.programs.filter(program => filteredProgramIds.has(program.id)) : []
        })).filter(goal => goal.programs && goal.programs.length > 0)
      })).filter(category => category.goals.length > 0)
    })).filter(pillar => pillar.categories.length > 0)

    return { pillars: filteredPillars }
  }, [data, filteredPrograms, selectedOrdLtSponsor, selectedSponsorsLead, selectedReportingOwner, selectedGoal])

  // Handler for opening program sidebar
  const handleProgramSelect = (program: StrategicProgram & {
    goalText?: string
    categoryName?: string
    pillarName?: string
  }) => {
    setSelectedProgram(program)
    setIsProgramSidebarOpen(true)
  }

  // Handler for closing program sidebar
  const handleProgramSidebarClose = () => {
    setIsProgramSidebarOpen(false)
    setSelectedProgram(null)
  }

  // Handler for program updates from sidebar
  const handleProgramUpdate = (programId: string, updatedData: ScoreCardData) => {
    setData(updatedData)
    setToast({ message: "Functional program updated successfully", type: "success" })
  }

  // Function to capture the screen
  const captureScreen = async () => {
    try {
      // Dynamically import html2canvas to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default

      // Get the element to capture (the entire page)
      const element = document.documentElement

      // Create the canvas
      const canvas = await html2canvas(element, {
        allowTaint: true,
        useCORS: true,
        logging: false,
        scale: window.devicePixelRatio,
      })

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          setToast({ message: "Failed to capture screen", type: "error" })
          return
        }

        // Create a download link
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url

        // Generate filename with current date and time
        const date = new Date()
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}_${date.getHours().toString().padStart(2, "0")}-${date.getMinutes().toString().padStart(2, "0")}`

        link.download = `functional_scorecard_overview_${formattedDate}.png`

        // Trigger download
        document.body.appendChild(link)
        link.click()

        // Clean up
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        setToast({ message: "Screen captured successfully", type: "success" })
      }, "image/png")
    } catch (error) {
      console.error('Screen capture error:', error)
      setToast({ message: "Failed to capture screen", type: "error" })
    }
  }

  const handleAIFlowsGenerate = async (prompt: string, files: File[], flowType: "goal-comparison" | "learnings-best-practices", selections: { pillars: number[], categories: number[], goals: number[], programs: number[] }) => {
    try {
      setToast({ message: 'Analyzing selected functional data...', type: 'info' })
      
      // Reset chat
      setIsChatOpen(false)
      
      // Create FormData for AI Flows request
      const formData = new FormData()
      formData.append('prompt', prompt)
      formData.append('flowType', flowType)
      formData.append('selections', JSON.stringify(selections))
      formData.append('scorecardData', JSON.stringify(data))
      
      // Add files
      files.forEach(file => {
        formData.append('files', file)
      })
      
      // Send to chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.response) {
        // Open AI Chat with results
        setIsChatOpen(true)
        setToast({ message: 'Analysis complete! Check AI Chat for results.', type: 'success' })
      } else {
        setToast({ message: 'Failed to analyze functional data', type: 'error' })
      }
    } catch (error) {
      console.error('Error in Functional AI Flows:', error)
      setToast({ message: 'Error analyzing functional data', type: 'error' })
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header 
        title={`ORD Scorecard - Functional View${selectedFunction ? `: ${selectedFunction}` : ''}`}
        onCaptureScreen={captureScreen}
        onToggleSidebar={() => setIsProgramSidebarOpen(!isProgramSidebarOpen)}
        onOpenFilter={() => setIsFilterModalOpen(true)}
        quarterOptions={QUARTER_OPTIONS}
        selectedQuarter={selectedQuarter}
        onQuarterChange={setSelectedQuarter}
        isFunctionalView={true}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
      />

      <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} context={data || { pillars: [] }} />

      <div className={`flex flex-1 transition-all duration-300`} style={{
        paddingLeft: isProgramSidebarOpen ? (window.innerWidth >= 1024 ? '640px' : window.innerWidth >= 768 ? '512px' : '0') : '0'
      }}>
        <div className="container mx-auto px-4 pt-4 flex-1 flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading functional scorecard data...</p>
              </div>
            </div>
          ) : filteredData ? (
            <div className="flex-1 flex flex-col">
              <Scorecard 
                data={filteredData} 
                onDataUpdate={handleDataUpdate} 
                selectedQuarter={selectedQuarter}
                onProgramSelect={handleProgramSelect}
                isFunctionalView={true}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-gray-600">No functional scorecard data available</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Program Details Sidebar */}
      <ProgramDetailsSidebar
        program={selectedProgram}
        isOpen={isProgramSidebarOpen}
        onClose={handleProgramSidebarClose}
        onUpdate={handleProgramUpdate}
        isFunctionalView={true}
        availablePrograms={allPrograms}
        onProgramSelect={handleProgramSelect}
      />

      {/* AI Flows Modal */}
      {data && (
        <AIFlowsModal
          isOpen={isAIFlowsModalOpen}
          onClose={() => setIsAIFlowsModalOpen(false)}
          flowType={aiFlowType}
          scorecardData={data}
          onGenerate={handleAIFlowsGenerate}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={{
          selectedOrdLtSponsor,
          selectedSponsorsLead,
          selectedReportingOwner,
          selectedGoal
        }}
        onFiltersChange={{
          setSelectedOrdLtSponsor,
          setSelectedSponsorsLead,
          setSelectedReportingOwner,
          setSelectedGoal
        }}
        allPrograms={allPrograms}
      />

      {/* BRAG Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">BRAG Status Legend</h2>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <BragStatusTable />
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </main>
  )
}