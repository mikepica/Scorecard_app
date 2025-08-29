"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
// Database-only mode - load data from API
import { Dropdown } from "@/components/dropdown"
import { StatusCircle } from "@/components/status-circle"
import { BarChart2, Menu, Bot, FileText, Eye, EyeOff, Info, Pencil, Camera } from "lucide-react"
import { AIChat } from "@/components/ai-chat"
import type { StrategicProgram, ScoreCardData } from "@/types/scorecard"
import { Toast } from "@/components/toast"
import { EditableField } from "@/components/ui/editable-field"
import { GenerateUpdateModal } from "@/components/generate-update-modal"
import { ReprioritizeGoalsModal } from "@/components/reprioritize-goals-modal"
import { AIFlowsModal } from "@/components/ai-flows-modal"
import { getPillarConfigById } from "@/config/pillar-config"
import { StrategicProgramTooltip } from "@/components/strategic-program-tooltip"
import { getCurrentQuarter, getPreviousQuarter, getAvailableQuarters } from "@/lib/quarter-utils"

// Special value to represent "All" selection
const ALL_VALUE = "all"

// Utility function to get unique values from all programs for a sponsor field
const getUniqueSponsorValues = (programs: Array<StrategicProgram & { goalText: string; categoryName: string; pillarName: string }>, fieldName: 'ordLtSponsors' | 'sponsorsLeads' | 'reportingOwners'): string[] => {
  const allValues = new Set<string>()
  
  programs.forEach(program => {
    const fieldValue = program[fieldName] || ['(Not Specified)']
    fieldValue.forEach(value => allValues.add(value))
  })
  
  return Array.from(allValues).sort()
}

export default function DetailsPage() {
  // State for data loading
  const [data, setData] = useState<ScoreCardData | null>(null)
  const [loading, setLoading] = useState(true)

  // Quarter configuration
  const currentQuarter = getCurrentQuarter()
  const previousQuarter = getPreviousQuarter()
  // const defaultObjectiveYear = parseInt(process.env.NEXT_PUBLIC_DEFAULT_OBJECTIVE_YEAR || "2025")

  // Load data when the page loads
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const response = await fetch('/api/scorecard')
        if (!response.ok) {
          throw new Error('Failed to load scorecard data')
        }
        const loadedData = await response.json()
        setData(loadedData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // State for AI Chat
  const [isChatOpen, setIsChatOpen] = useState(false)

  // State for toast notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null)

  // State for Generate Update modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [currentProgram, setCurrentProgram] = useState<StrategicProgram | null>(null)

  // State for Generate Insights modal
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false)
  const [currentInsightsProgram, setCurrentInsightsProgram] = useState<StrategicProgram | null>(null)
  const [isReprioritizationMode, setIsReprioritizationMode] = useState(false)
  // const [, setIsAIFlowsDropdownOpen] = useState(false)
  const [isAIFlowsModalOpen, setIsAIFlowsModalOpen] = useState(false)
  const [aiFlowType] = useState<"goal-comparison" | "learnings-best-practices">("goal-comparison")

  // State for selected filters - default to "all"
  const [selectedOrdLtSponsor, setSelectedOrdLtSponsor] = useState(ALL_VALUE)
  const [selectedSponsorsLead, setSelectedSponsorsLead] = useState(ALL_VALUE)
  const [selectedReportingOwner, setSelectedReportingOwner] = useState(ALL_VALUE)
  const [selectedGoal, setSelectedGoal] = useState(ALL_VALUE)

  // State for filter visibility - default to show filters
  const [filtersVisible, setFiltersVisible] = useState(true)

  // State for tooltip
  const [hoveredProgram, setHoveredProgram] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // State for selected comparison quarter - defaults to previous quarter
  const [selectedComparisonQuarter, setSelectedComparisonQuarter] = useState(previousQuarter)

  // State for starting quarter selection - defaults to Q1-2025, persisted in localStorage
  const [startingQuarter, setStartingQuarter] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scorecard-starting-quarter')
      return saved || 'q1_2025'
    }
    return 'q1_2025'
  })

  // Note: Removed relationship map as it's no longer needed with sponsor-based filtering

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

  // ORD LT Sponsor options - all unique values
  const ordLtSponsorOptions = useMemo(() => {
    const uniqueValues = getUniqueSponsorValues(allPrograms, 'ordLtSponsors')
    return [{ value: ALL_VALUE, label: "All" }, ...uniqueValues.map(value => ({ value, label: value }))]
  }, [allPrograms])

  // Sponsors Lead options - filtered by selected ORD LT Sponsor
  const sponsorsLeadOptions = useMemo(() => {
    if (selectedOrdLtSponsor === ALL_VALUE) {
      // If all ORD LT Sponsors selected, show all Sponsors Leads
      const uniqueValues = getUniqueSponsorValues(allPrograms, 'sponsorsLeads')
      return [{ value: ALL_VALUE, label: "All" }, ...uniqueValues.map(value => ({ value, label: value }))]
    } else {
      // Filter programs by selected ORD LT Sponsor and get their Sponsors Leads
      const filteredPrograms = allPrograms.filter(program => {
        const ordLtSponsors = program.ordLtSponsors || ['(Not Specified)']
        return ordLtSponsors.includes(selectedOrdLtSponsor)
      })
      
      const uniqueValues = getUniqueSponsorValues(filteredPrograms, 'sponsorsLeads')
      return [{ value: ALL_VALUE, label: "All" }, ...uniqueValues.map(value => ({ value, label: value }))]
    }
  }, [selectedOrdLtSponsor, allPrograms])

  // Reporting Owner options - filtered by selected Sponsors Lead
  const reportingOwnerOptions = useMemo(() => {
    if (selectedOrdLtSponsor === ALL_VALUE && selectedSponsorsLead === ALL_VALUE) {
      // If all previous filters selected, show all Reporting Owners
      const uniqueValues = getUniqueSponsorValues(allPrograms, 'reportingOwners')
      return [{ value: ALL_VALUE, label: "All" }, ...uniqueValues.map(value => ({ value, label: value }))]
    } else {
      // Filter programs by selected ORD LT Sponsor and Sponsors Lead
      const filteredPrograms = allPrograms.filter(program => {
        const ordLtSponsors = program.ordLtSponsors || ['(Not Specified)']
        const sponsorsLeads = program.sponsorsLeads || ['(Not Specified)']
        
        const ordLtMatch = selectedOrdLtSponsor === ALL_VALUE || ordLtSponsors.includes(selectedOrdLtSponsor)
        const sponsorsLeadMatch = selectedSponsorsLead === ALL_VALUE || sponsorsLeads.includes(selectedSponsorsLead)
        
        return ordLtMatch && sponsorsLeadMatch
      })
      
      const uniqueValues = getUniqueSponsorValues(filteredPrograms, 'reportingOwners')
      return [{ value: ALL_VALUE, label: "All" }, ...uniqueValues.map(value => ({ value, label: value }))]
    }
  }, [selectedOrdLtSponsor, selectedSponsorsLead, allPrograms])

  // Goal options - filtered by all selected sponsors
  const goalOptions = useMemo(() => {
    if (selectedOrdLtSponsor === ALL_VALUE && selectedSponsorsLead === ALL_VALUE && selectedReportingOwner === ALL_VALUE) {
      // If all sponsor filters are "All", show all goals
      const uniqueGoals = new Map<string, string>()
      allPrograms.forEach(program => {
        if (!uniqueGoals.has(program.goalText)) {
          uniqueGoals.set(program.goalText, program.strategicGoalId)
        }
      })
      
      const options = Array.from(uniqueGoals.entries()).map(([text, id]) => ({ value: id, label: text }))
      return [{ value: ALL_VALUE, label: "All" }, ...options.sort((a, b) => a.label.localeCompare(b.label))]
    } else {
      // Filter programs by all selected sponsor filters
      const filteredPrograms = allPrograms.filter(program => {
        const ordLtSponsors = program.ordLtSponsors || ['(Not Specified)']
        const sponsorsLeads = program.sponsorsLeads || ['(Not Specified)']
        const reportingOwners = program.reportingOwners || ['(Not Specified)']
        
        const ordLtMatch = selectedOrdLtSponsor === ALL_VALUE || ordLtSponsors.includes(selectedOrdLtSponsor)
        const sponsorsLeadMatch = selectedSponsorsLead === ALL_VALUE || sponsorsLeads.includes(selectedSponsorsLead)
        const reportingOwnerMatch = selectedReportingOwner === ALL_VALUE || reportingOwners.includes(selectedReportingOwner)
        
        return ordLtMatch && sponsorsLeadMatch && reportingOwnerMatch
      })
      
      const uniqueGoals = new Map<string, string>()
      filteredPrograms.forEach(program => {
        if (!uniqueGoals.has(program.goalText)) {
          uniqueGoals.set(program.goalText, program.strategicGoalId)
        }
      })
      
      const options = Array.from(uniqueGoals.entries()).map(([text, id]) => ({ value: id, label: text }))
      return [{ value: ALL_VALUE, label: "All" }, ...options.sort((a, b) => a.label.localeCompare(b.label))]
    }
  }, [selectedOrdLtSponsor, selectedSponsorsLead, selectedReportingOwner, allPrograms])

  // Quarter options for comparison dropdown - exclude current quarter
  const quarterOptions = useMemo(() => {
    const availableQuarters = getAvailableQuarters()
    return availableQuarters
      .filter(quarter => quarter.columnName !== currentQuarter.columnName) // Exclude current quarter
      .map(quarter => ({
        value: quarter.columnName,
        label: quarter.label
      }))
  }, [currentQuarter.columnName])

  // Handle starting quarter change with localStorage persistence
  const handleStartingQuarterChange = (newStartingQuarter: string) => {
    setStartingQuarter(newStartingQuarter)
    if (typeof window !== 'undefined') {
      localStorage.setItem('scorecard-starting-quarter', newStartingQuarter)
    }
  }

  // Calculate 4 consecutive quarters starting from the selected quarter
  const displayQuarters = useMemo(() => {
    const allQuarters = getAvailableQuarters()
    const startIndex = allQuarters.findIndex(q => q.columnName === startingQuarter)
    
    if (startIndex === -1) return allQuarters.slice(0, 4) // fallback to first 4
    
    // Get 4 consecutive quarters starting from selected quarter
    const result = []
    for (let i = 0; i < 4; i++) {
      const quarterIndex = startIndex + i
      if (quarterIndex < allQuarters.length) {
        result.push(allQuarters[quarterIndex])
      }
    }
    
    return result
  }, [startingQuarter])

  // Generate dropdown options for starting quarters
  // Only include quarters where we can show 4 consecutive quarters
  const startingQuarterOptions = useMemo(() => {
    const allQuarters = getAvailableQuarters()
    const validStartingQuarters = []
    
    for (let i = 0; i <= allQuarters.length - 4; i++) {
      const quarter = allQuarters[i]
      validStartingQuarters.push({
        value: quarter.columnName,
        label: quarter.label
      })
    }
    
    return validStartingQuarters
  }, [])

  // Handle ORD LT Sponsor selection
  const handleOrdLtSponsorChange = (value: string) => {
    setSelectedOrdLtSponsor(value)
    
    // Reset downstream filters
    setSelectedSponsorsLead(ALL_VALUE)
    setSelectedReportingOwner(ALL_VALUE)
    setSelectedGoal(ALL_VALUE)
  }

  // Handle Sponsors Lead selection
  const handleSponsorsLeadChange = (value: string) => {
    setSelectedSponsorsLead(value)
    
    // Reset downstream filters
    setSelectedReportingOwner(ALL_VALUE)
    setSelectedGoal(ALL_VALUE)
  }

  // Handle Reporting Owner selection
  const handleReportingOwnerChange = (value: string) => {
    setSelectedReportingOwner(value)
    
    // Reset goal filter
    setSelectedGoal(ALL_VALUE)
  }

  // Handle goal selection
  const handleGoalChange = (value: string) => {
    setSelectedGoal(value)
    // No need to update upstream filters since this is the final filter
  }

  // Get filtered programs based on sponsor selections
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


  // Get display name based on current selections
  const displayName = useMemo(() => {
    if (selectedOrdLtSponsor === ALL_VALUE && selectedSponsorsLead === ALL_VALUE && selectedReportingOwner === ALL_VALUE && selectedGoal === ALL_VALUE) {
      return "All Programs"
    }
    
    const parts = []
    if (selectedOrdLtSponsor !== ALL_VALUE) parts.push(selectedOrdLtSponsor)
    if (selectedSponsorsLead !== ALL_VALUE) parts.push(selectedSponsorsLead)
    if (selectedReportingOwner !== ALL_VALUE) parts.push(selectedReportingOwner)
    if (selectedGoal !== ALL_VALUE) {
      const goalOption = goalOptions.find(opt => opt.value === selectedGoal)
      if (goalOption) parts.push(goalOption.label)
    }
    
    return parts.length > 0 ? parts.join(" → ") : "Filtered Programs"
  }, [selectedOrdLtSponsor, selectedSponsorsLead, selectedReportingOwner, selectedGoal, goalOptions])

  // Function to capture the screen
  const captureScreen = async () => {
    // Check if a strategic goal is selected
    if (selectedGoal === ALL_VALUE) {
      setToast({ message: "Select a Strategic Goal to capture screen", type: "warning" })
      return
    }

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

        // Use the selected goal name in the filename
        const goalName = goalOptions.find((option) => option.value === selectedGoal)?.label || "scorecard"
        const safeGoalName = goalName.replace(/[^a-z0-9]/gi, "_").substring(0, 30)

        link.download = `scorecard_${safeGoalName}_${formattedDate}.png`

        // Trigger download
        document.body.appendChild(link)
        link.click()

        // Clean up
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        setToast({ message: "Screen captured successfully", type: "success" })
      }, "image/png")
    } catch (error) {
      console.error("Error capturing screen:", error)
      setToast({ message: "Failed to capture screen", type: "error" })
    }
  }

  const getHeaderColor = () => {
    // Use a neutral color for sponsor-based filtering
    return "bg-gray-600"
  }

  const getPillarTextColor = (pillarId: string) => {
    const config = getPillarConfigById(pillarId)
    return config ? config.textClass : "text-gray-600"
  }

  // Handle status update
  const handleStatusUpdate = async (
    pillarId: string,
    categoryId: string,
    goalId: string,
    programId: string,
    quarter: string,
    newStatus: string | null
  ) => {
    try {
      const response = await fetch('/api/scorecard/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldPath: [String(pillarId), String(categoryId), String(goalId), String(programId)],
          newValue: newStatus,
          type: 'program',
          quarter,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to update status')
      }
      const updatedData = await response.json()
      setData(updatedData)
      setToast({ message: 'Status updated successfully', type: 'success' })
    } catch (error) {
      console.error('Error updating status:', error)
      setToast({ message: 'Failed to update status', type: 'error' })
    }
  }

  // Handle program text update
  const handleProgramTextUpdate = async (programId: string, newText: string) => {
    try {
      // Find the program to get its full path
      const program = filteredPrograms.find(p => p.id === programId)
      if (!program) {
        throw new Error('Program not found')
      }
      
      const response = await fetch('/api/scorecard/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldPath: [program.strategicPillarId, program.categoryId, program.strategicGoalId, programId],
          newValue: newText,
          type: 'program-text',
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to update program text')
      }
      const updatedData = await response.json()
      setData(updatedData)
      setToast({ message: 'Program text updated successfully', type: 'success' })
    } catch (error) {
      console.error('Error updating program text:', error)
      setToast({ message: 'Failed to update program text', type: 'error' })
    }
  }

  // Handle progress update (unused - commented out)
  /*
  const handleProgressUpdate = async (programId: string, newProgress: string) => {
    try {
      const program = filteredPrograms.find(p => p.id === programId)
      if (!program) {
        throw new Error('Program not found')
      }
      
      const response = await fetch('/api/scorecard/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldPath: [program.strategicPillarId, program.categoryId, program.strategicGoalId, programId],
          newValue: newProgress,
          type: 'program-progress',
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to update progress')
      }
      const updatedData = await response.json()
      setData(updatedData)
      setToast({ message: 'Progress updated successfully', type: 'success' })
    } catch (error) {
      console.error('Error updating progress:', error)
      setToast({ message: 'Failed to update progress', type: 'error' })
    }
  }
  */

  // Handle quarter-specific progress update
  const handleQuarterProgressUpdate = async (programId: string, quarterColumn: string, newProgress: string) => {
    try {
      const program = filteredPrograms.find(p => p.id === programId)
      if (!program) {
        throw new Error('Program not found')
      }
      
      const response = await fetch('/api/scorecard/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldPath: [program.strategicPillarId, program.categoryId, program.strategicGoalId, programId],
          newValue: newProgress,
          type: 'program-quarter-progress',
          quarter: quarterColumn, // This will be the full column name like 'q3_2025_progress'
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to update quarter progress')
      }
      const updatedData = await response.json()
      setData(updatedData)
      setToast({ message: 'Quarter progress updated successfully', type: 'success' })
    } catch (error) {
      console.error('Error updating quarter progress:', error)
      setToast({ message: 'Failed to update quarter progress', type: 'error' })
    }
  }

  // Handle quarterly objective update
  const handleObjectiveUpdate = async (programId: string, quarter: string, newObjective: string) => {
    try {
      const program = filteredPrograms.find(p => p.id === programId)
      if (!program) {
        throw new Error('Program not found')
      }
      
      const response = await fetch('/api/scorecard/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldPath: [program.strategicPillarId, program.categoryId, program.strategicGoalId, programId],
          newValue: newObjective,
          type: 'program-objective',
          quarter,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to update objective')
      }
      const updatedData = await response.json()
      setData(updatedData)
      setToast({ message: 'Objective updated successfully', type: 'success' })
    } catch (error) {
      console.error('Error updating objective:', error)
      setToast({ message: 'Failed to update objective', type: 'error' })
    }
  }

  // Handle opening the Generate Update modal
  const handleOpenGenerateModal = (program: StrategicProgram) => {
    setCurrentProgram(program)
    setIsGenerateModalOpen(true)
  }

  // Handle Generate Update action - now returns the generated content instead of saving directly
  const handleGenerateUpdate = async (content: string, instructions: string, files: File[]): Promise<string> => {
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('content', content)
      formData.append('instructions', instructions)
      
      // Add program context
      if (currentProgram) {
        const programContext = JSON.stringify({
          id: currentProgram.id,
          text: currentProgram.text,
          pillarName: currentProgram.pillarName,
          categoryName: currentProgram.categoryName,
          strategicGoalText: currentProgram.strategicGoalText,
          q1Objective: currentProgram.q1_2025_objective,
          q2Objective: currentProgram.q2_2025_objective,
          q3Objective: currentProgram.q3_2025_objective,
          q4Objective: currentProgram.q4_2025_objective
        })
        formData.append('programContext', programContext)
      }
      
      // Add files
      files.forEach(file => {
        formData.append('files', file)
      })
      
      const response = await fetch('/api/generate-update', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        return result.update
      } else {
        throw new Error('Failed to generate update')
      }
    } catch (error) {
      console.error('Error generating update:', error)
      throw error
    }
  }

  // Handle Apply Update action - saves the final content to current quarter column
  const handleApplyUpdate = async (content: string) => {
    try {
      if (currentProgram) {
        // Save to the current quarter progress column instead of legacy progress_updates
        await handleQuarterProgressUpdate(currentProgram.id, currentQuarter.columnName, content)
        setToast({ message: 'Update applied successfully!', type: 'success' })
        setIsGenerateModalOpen(false)
        setCurrentProgram(null)
      }
    } catch (error) {
      console.error('Error applying update:', error)
      setToast({ message: 'Error applying update', type: 'error' })
    }
  }

  // Handle opening the Reprioritize Goals modal
  /*
  const handleOpenReprioritizeModal = (program: StrategicProgram) => {
    setCurrentInsightsProgram(program)
    setIsInsightsModalOpen(true)
  }
  */

  // Handle Reprioritize Goals action
  const handleReprioritization = async (prompt: string, files: File[]) => {
    try {
      setToast({ message: 'Analyzing goals for reprioritization...', type: 'info' })
      
      // Reset chat and close modal
      setMessages([])
      setIsInsightsModalOpen(false)
      setCurrentInsightsProgram(null)
      
      // Create FormData for reprioritization request
      const formData = new FormData()
      formData.append('prompt', prompt)
      
      // Add program context
      if (currentInsightsProgram) {
        const programContext = JSON.stringify({
          id: currentInsightsProgram.id,
          text: currentInsightsProgram.text,
          pillarName: currentInsightsProgram.pillarName,
          categoryName: currentInsightsProgram.categoryName,
          strategicGoalText: currentInsightsProgram.strategicGoalText,
          q1Objective: currentInsightsProgram.q1_2025_objective || '',
          q2Objective: currentInsightsProgram.q2_2025_objective || '',
          q3Objective: currentInsightsProgram.q3_2025_objective || '',
          q4Objective: currentInsightsProgram.q4_2025_objective || '',
          q1Status: currentInsightsProgram.q1_2025_status || '',
          q2Status: currentInsightsProgram.q2_2025_status || '',
          q3Status: currentInsightsProgram.q3_2025_status || '',
          q4Status: currentInsightsProgram.q4_2025_status || '',
          progressUpdates: currentInsightsProgram.progressUpdates || ''
        })
        formData.append('programContext', programContext)
      }
      
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
        // Add AI response to chat
        const aiMessage = {
          id: Date.now().toString(),
          text: result.response,
          sender: "ai" as const,
          timestamp: new Date(),
        }
        setMessages([aiMessage])
        
        // Set reprioritization mode and open AI Chat
        setIsReprioritizationMode(true)
        setIsChatOpen(true)
        setToast({ message: 'Goals analysis complete! Check AI Chat for results.', type: 'success' })
      } else {
        setToast({ message: 'Failed to analyze goals for reprioritization', type: 'error' })
      }
    } catch (error) {
      console.error('Error in reprioritization:', error)
      setToast({ message: 'Error analyzing goals for reprioritization', type: 'error' })
    }
  }

  /*
  const handleAIFlowSelection = (flowType: "goal-comparison" | "learnings-best-practices") => {
    setAIFlowType(flowType)
    setIsAIFlowsDropdownOpen(false)
    setIsAIFlowsModalOpen(true)
  }
  */

  const handleAIFlowsGenerate = async (prompt: string, files: File[], flowType: "goal-comparison" | "learnings-best-practices", selections: { pillars: number[], categories: number[], goals: number[], programs: number[] }) => {
    try {
      setToast({ message: 'Analyzing selected data...', type: 'info' })
      
      // Reset chat
      setMessages([])
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
        // Add AI response to chat
        const aiMessage = {
          id: Date.now().toString(),
          text: result.response,
          sender: "ai" as const,
          timestamp: new Date(),
        }
        setMessages([aiMessage])
        
        // Open AI Chat
        setIsChatOpen(true)
        setToast({ message: 'Analysis complete! Check AI Chat for results.', type: 'success' })
      } else {
        setToast({ message: 'Failed to analyze data', type: 'error' })
      }
    } catch (error) {
      console.error('Error in AI Flows:', error)
      setToast({ message: 'Error analyzing data', type: 'error' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scorecard data...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No scorecard data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-200 py-2 px-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">ORD Scorecard: {displayName}</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/instructions"
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
          >
            <FileText size={20} />
            <span className="whitespace-nowrap">Instructions</span>
          </Link>

          <div className="relative group">
            <button
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px] cursor-not-allowed opacity-75"
              disabled
            >
              <Bot size={20} />
              <span className="whitespace-nowrap">AI Flows</span>
            </button>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              Functionality released in future update after determining how users interact with this application
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-800"></div>
            </div>
          </div>

          <button
            onClick={() => setFiltersVisible(!filtersVisible)}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
          >
            {filtersVisible ? <Eye size={20} /> : <EyeOff size={20} />}
            <span className="whitespace-nowrap">Show/Hide Filters</span>
          </button>

          <button
            onClick={captureScreen}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
          >
            <Camera size={20} />
            <span className="whitespace-nowrap">Capture Screen</span>
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
          >
            <BarChart2 size={20} />
            <span className="whitespace-nowrap">Goal-level view</span>
          </Link>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
          >
            <Menu size={20} />
            <span className="whitespace-nowrap">AI Chat</span>
          </button>
        </div>

        <AIChat 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          context={data} 
          isReprioritizationMode={isReprioritizationMode}
          onReset={() => setIsReprioritizationMode(false)}
        />
      </header>

      {/* Filter section */}
      {filtersVisible && (
        <div className="bg-gray-200 py-3 px-4">
          <div className="flex items-center mb-3">
            <div className="flex-1">
              <Dropdown
                options={ordLtSponsorOptions}
                value={selectedOrdLtSponsor}
                onChange={handleOrdLtSponsorChange}
                label="ORD LT Sponsor:"
                placeholder="Select an ORD LT Sponsor..."
                labelWidth="w-36"
              />
            </div>
          </div>

          <div className="mb-3">
            <Dropdown
              options={sponsorsLeadOptions}
              value={selectedSponsorsLead}
              onChange={handleSponsorsLeadChange}
              label="Sponsors Lead:"
              placeholder="Select a Sponsors Lead..."
              labelWidth="w-36"
            />
          </div>

          <div className="mb-3">
            <Dropdown
              options={reportingOwnerOptions}
              value={selectedReportingOwner}
              onChange={handleReportingOwnerChange}
              label="Reporting Owner:"
              placeholder="Select a Reporting Owner..."
              labelWidth="w-36"
            />
          </div>

          <div>
            <Dropdown
              options={goalOptions}
              value={selectedGoal}
              onChange={handleGoalChange}
              label="Strategic Goal:"
              placeholder="Select a goal..."
              labelWidth="w-36"
            />
          </div>
        </div>
      )}

      {/* Table section - make it fill the remaining space */}
      <div className="flex-1 p-4 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            {/* Section title row */}
            <tr>
              <th className="border border-gray-300 bg-gray-50 text-black text-base p-2 border-r-2 border-gray-400" style={{width: '14.3%'}}>
                {/* Empty cell to keep Strategic Programs separate */}
              </th>
              <th className="border border-gray-300 bg-gray-50 text-black text-base p-2 text-center border-r-2 border-gray-400" colSpan={2} style={{width: '28.6%'}}>
                Progress Updates
              </th>
              <th className="border border-gray-300 bg-gray-50 text-black text-base p-2 text-center" colSpan={4} style={{width: '57.2%'}}>
                Quarterly Objectives
              </th>
            </tr>
            {/* Column headers row */}
            <tr>
              <th className={`border border-gray-300 ${getHeaderColor()} text-white p-3 text-left text-base border-r-2 border-gray-400`} style={{width: '14.3%'}}>
                Strategic Programs
              </th>
              <th className="border border-gray-300 bg-gray-200 text-black p-3 text-center text-base relative border-r-2 border-gray-400" style={{width: '14.3%'}}>
                <div className="flex items-center justify-center gap-1">
                  <select 
                    value={selectedComparisonQuarter.columnName}
                    onChange={(e) => {
                      const selectedQuarter = getAvailableQuarters().find(q => q.columnName === e.target.value)
                      if (selectedQuarter) {
                        setSelectedComparisonQuarter(selectedQuarter)
                      }
                    }}
                    className="bg-transparent text-black border-0 text-center text-base cursor-pointer focus:outline-none focus:ring-0"
                  >
                    {quarterOptions.map(option => (
                      <option key={option.value} value={option.value} className="text-black">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="relative group">
                    <Info size={14} className="text-gray-600 opacity-70 hover:opacity-100 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                      Select a different Quarterly update to view
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300 bg-gray-200 text-black p-3 text-center text-base border-r-2 border-gray-400" style={{width: '14.3%'}}>{currentQuarter.label}</th>
              <th className="border border-gray-300 bg-gray-200 text-black p-3 text-center text-base relative" style={{width: '14.3%'}}>
                <div className="flex items-center justify-center gap-1">
                  <select 
                    value={startingQuarter}
                    onChange={(e) => handleStartingQuarterChange(e.target.value)}
                    className="bg-transparent text-black border-0 text-center text-base cursor-pointer focus:outline-none focus:ring-0"
                  >
                    {startingQuarterOptions.map(option => (
                      <option key={option.value} value={option.value} className="text-black">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="relative group">
                    <Info size={14} className="text-gray-600 opacity-70 hover:opacity-100 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                      Select the Starting Quarter Objectives
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              </th>
              {displayQuarters.slice(1).map((quarter) => (
                <th key={quarter.columnName} className="border border-gray-300 bg-gray-200 text-black p-3 text-center text-base" style={{width: '14.3%'}}>
                  {quarter.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredPrograms.length > 0 ? (
              filteredPrograms.map((program, idx) => {
                if (idx < 5) {
                  console.log('DEBUG - Program object:', program);
                }
                return (
                  <tr key={program.id}>
                    <td 
                      className="border border-gray-300 p-3 relative hover:bg-gray-50 border-r-2 border-gray-400" 
                      style={{width: '14.3%'}}
                      onMouseEnter={(e) => {
                        setHoveredProgram(program.id)
                        setTooltipPosition({ x: e.clientX, y: e.clientY })
                      }}
                      onMouseMove={(e) => {
                        if (hoveredProgram === program.id) {
                          setTooltipPosition({ x: e.clientX, y: e.clientY })
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredProgram(null)
                      }}
                    >
                      <EditableField
                        value={program.text}
                        onSave={(newText) => handleProgramTextUpdate(program.id, newText)}
                        className={`${getPillarTextColor(program.strategicPillarId)} font-medium text-base pr-8`}
                      />
                    </td>
                    <td className="border border-gray-300 p-3 border-r-2 border-gray-400" style={{width: '14.3%'}}>
                      <EditableField
                        value={(program as StrategicProgram & Record<string, unknown>)[selectedComparisonQuarter.columnName] as string || ""}
                        onSave={(newProgress) => handleQuarterProgressUpdate(program.id, selectedComparisonQuarter.columnName, newProgress)}
                        className="text-base"
                        placeholder={`Enter ${selectedComparisonQuarter.label} progress...`}
                      />
                    </td>
                    <td className="border border-gray-300 p-3 relative border-r-2 border-gray-400" style={{width: '14.3%'}}>
                      <div className="pb-8">
                        <EditableField
                          value={(program as StrategicProgram & Record<string, unknown>)[currentQuarter.columnName] as string || ""}
                          onSave={(newProgress) => handleQuarterProgressUpdate(program.id, currentQuarter.columnName, newProgress)}
                          className="text-base"
                          placeholder={`Enter ${currentQuarter.label} progress...`}
                        />
                      </div>
                      <button
                        onClick={() => handleOpenGenerateModal(program)}
                        className="absolute bottom-2 right-2 p-1 rounded hover:bg-gray-100 transition-colors group flex items-center gap-1"
                        title="Enter Progress Update"
                      >
                        <Pencil className="h-4 w-4 text-gray-500 group-hover:text-blue-600" />
                        <span className="text-xs text-gray-500 group-hover:text-blue-600">Enter Progress Update</span>
                      </button>
                    </td>
                    {displayQuarters.map((quarter) => {
                      const quarterKey = quarter.columnName.replace('_progress', '')
                      const objectiveField = `${quarterKey}_objective`
                      const statusField = `${quarterKey}_status`
                      
                      return (
                        <td key={quarter.columnName} className="border border-gray-300 p-3 pr-10 relative" style={{width: '14.3%'}}>
                          <div className="mb-2">
                            <EditableField
                              value={(program as StrategicProgram & Record<string, unknown>)[objectiveField] as string || ""}
                              onSave={(newObjective) => handleObjectiveUpdate(program.id, quarterKey, newObjective)}
                              className="text-base"
                              placeholder={`Enter ${quarter.label} objective...`}
                            />
                          </div>
                          <div className="status-dot-container">
                            <StatusCircle
                              status={(program as StrategicProgram & Record<string, unknown>)[statusField] as "exceeded" | "on-track" | "delayed" | "missed" | undefined}
                              onStatusChange={(newStatus) => handleStatusUpdate(String(program.strategicPillarId), String(program.categoryId), String(program.strategicGoalId), String(program.id), quarterKey, newStatus ?? null)}
                            />
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={3 + displayQuarters.length} className="border border-gray-300 p-4 text-center text-gray-500 text-base">
                  No programs found with the current filter settings.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Generate Update Modal */}
      {currentProgram && (
        <GenerateUpdateModal
          isOpen={isGenerateModalOpen}
          onClose={() => {
            setIsGenerateModalOpen(false)
            setCurrentProgram(null)
          }}
          initialContent={(currentProgram as StrategicProgram & Record<string, unknown>)?.[currentQuarter.columnName] as string || ""}
          quarterInfo={currentQuarter}
          onGenerate={handleGenerateUpdate}
          onApply={handleApplyUpdate}
        />
      )}

      {/* Reprioritize Goals Modal */}
      {currentInsightsProgram && (
        <ReprioritizeGoalsModal
          isOpen={isInsightsModalOpen}
          onClose={() => {
            setIsInsightsModalOpen(false)
            setCurrentInsightsProgram(null)
          }}
          onGenerate={handleReprioritization}
        />
      )}

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
      
      {/* Strategic Program Tooltip */}
      {hoveredProgram && (
        <StrategicProgramTooltip
          program={filteredPrograms.find(p => p.id === hoveredProgram)!}
          isVisible={hoveredProgram !== null}
          position={tooltipPosition}
        />
      )}
      
      {/* Toast notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
