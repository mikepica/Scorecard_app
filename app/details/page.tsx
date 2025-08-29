"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
// Database-only mode - load data from API
import { Dropdown } from "@/components/dropdown"
import { StatusCircle } from "@/components/status-circle"
import { BarChart2, Menu, Bot, FileText, Eye, EyeOff, Info, Pencil, Camera } from "lucide-react"
import { AIChat } from "@/components/ai-chat"
import type { StrategicProgram, Pillar, Category, StrategicGoal, ScoreCardData } from "@/types/scorecard"
import { Toast } from "@/components/toast"
import { EditableField } from "@/components/ui/editable-field"
import { GenerateUpdateModal } from "@/components/generate-update-modal"
import { ReprioritizeGoalsModal } from "@/components/reprioritize-goals-modal"
import { AIFlowsModal } from "@/components/ai-flows-modal"
import { getPillarColorById } from "@/lib/pillar-utils"
import { getPillarConfigById } from "@/config/pillar-config"
import { StrategicProgramTooltip } from "@/components/strategic-program-tooltip"
import { getCurrentQuarter, getPreviousQuarter, getAvailableQuarters } from "@/lib/quarter-utils"

// Special value to represent "All" selection
const ALL_VALUE = "all"

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
  const [selectedPillar, setSelectedPillar] = useState(ALL_VALUE)
  const [selectedCategory, setSelectedCategory] = useState(ALL_VALUE)
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

  // Create a map of relationships for quick lookups
  const relationshipMap = useMemo(() => {
    const goalToCategoryMap = new Map<string, string>()
    const goalToPillarMap = new Map<string, string>()
    const categoryToPillarMap = new Map<string, string>()
    const pillarMap = new Map<string, Pillar>()
    const categoryMap = new Map<string, Category>()
    const goalMap = new Map<string, StrategicGoal>()

    if (!data) {
      return {
        goalToCategory: goalToCategoryMap,
        goalToPillar: goalToPillarMap,
        categoryToPillar: categoryToPillarMap,
        pillars: pillarMap,
        categories: categoryMap,
        goals: goalMap,
      }
    }

    data.pillars.forEach((pillar) => {
      pillarMap.set(pillar.id, pillar)

      pillar.categories.forEach((category) => {
        categoryMap.set(category.id, category)
        categoryToPillarMap.set(category.id, pillar.id)

        category.goals.forEach((goal) => {
          goalMap.set(goal.id, goal)
          goalToCategoryMap.set(goal.id, category.id)
          goalToPillarMap.set(goal.id, pillar.id)
        })
      })
    })

    return {
      goalToCategory: goalToCategoryMap,
      goalToPillar: goalToPillarMap,
      categoryToPillar: categoryToPillarMap,
      pillars: pillarMap,
      categories: categoryMap,
      goals: goalMap,
    }
  }, [data])

  // Extract all options for dropdowns with "All" as the first option
  const pillarOptions = useMemo(() => {
    if (!data) {
      return [{ value: ALL_VALUE, label: "All" }]
    }
    const options = data.pillars.map((pillar) => ({ value: pillar.id, label: pillar.name }))
    return [{ value: ALL_VALUE, label: "All" }, ...options]
  }, [data])

  // Category options depend on selected pillar
  const categoryOptions = useMemo(() => {
    const options: { value: string; label: string }[] = []

    // Add "All" option
    options.push({ value: ALL_VALUE, label: "All" })

    if (!data) {
      return options
    }

    // If "All" pillars selected, include all categories
    if (selectedPillar === ALL_VALUE) {
      const uniqueCategories = new Map<string, string>()

      data.pillars.forEach((pillar) => {
        pillar.categories.forEach((category) => {
          // Use category name as key to avoid duplicates
          if (!uniqueCategories.has(category.name)) {
            uniqueCategories.set(category.name, category.id)
            options.push({ value: category.id, label: category.name })
          }
        })
      })
    } else {
      // Otherwise, only include categories from the selected pillar
      const pillar = data.pillars.find((p) => p.id === selectedPillar)
      if (pillar) {
        pillar.categories.forEach((category) => {
          options.push({ value: category.id, label: category.name })
        })
      }
    }

    return options
  }, [selectedPillar, data])

  // Goal options depend on selected category and pillar
  const goalOptions = useMemo(() => {
    const options: { value: string; label: string }[] = []

    // Add "All" option
    options.push({ value: ALL_VALUE, label: "All" })

    if (!data) {
      return options
    }

    // If "All" pillars and "All" categories selected, include all goals
    if (selectedPillar === ALL_VALUE && selectedCategory === ALL_VALUE) {
      const uniqueGoals = new Map<string, string>()

      data.pillars.forEach((pillar) => {
        pillar.categories.forEach((category) => {
          category.goals.forEach((goal) => {
            // Use goal text as key to avoid duplicates
            if (!uniqueGoals.has(goal.text)) {
              uniqueGoals.set(goal.text, goal.id)
              options.push({ value: goal.id, label: goal.text })
            }
          })
        })
      })
    }
    // If "All" pillars but specific category selected
    else if (selectedPillar === ALL_VALUE) {
      data.pillars.forEach((pillar) => {
        pillar.categories.forEach((category) => {
          if (category.id === selectedCategory) {
            category.goals.forEach((goal) => {
              options.push({ value: goal.id, label: goal.text })
            })
          }
        })
      })
    }
    // If specific pillar but "All" categories selected
    else if (selectedCategory === ALL_VALUE) {
      const pillar = data.pillars.find((p) => p.id === selectedPillar)
      if (pillar) {
        pillar.categories.forEach((category) => {
          category.goals.forEach((goal) => {
            options.push({ value: goal.id, label: goal.text })
          })
        })
      }
    }
    // If specific pillar and specific category selected
    else {
      const pillar = data.pillars.find((p) => p.id === selectedPillar)
      if (pillar) {
        const category = pillar.categories.find((c) => c.id === selectedCategory)
        if (category) {
          category.goals.forEach((goal) => {
            options.push({ value: goal.id, label: goal.text })
          })
        }
      }
    }

    return options
  }, [selectedPillar, selectedCategory, data])

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

  // Handle pillar selection
  const handlePillarChange = (value: string) => {
    setSelectedPillar(value)

    // If "All" is selected, reset other filters
    if (value === ALL_VALUE) {
      setSelectedCategory(ALL_VALUE)
      setSelectedGoal(ALL_VALUE)
    }
    // If a specific pillar is selected but the current category doesn't belong to it, reset category
    else if (selectedCategory !== ALL_VALUE && relationshipMap.categoryToPillar.get(selectedCategory) !== value) {
      setSelectedCategory(ALL_VALUE)
      setSelectedGoal(ALL_VALUE)
    }
    // If category is valid but goal doesn't belong to this pillar, reset goal
    else if (selectedGoal !== ALL_VALUE && relationshipMap.goalToPillar.get(selectedGoal) !== value) {
      setSelectedGoal(ALL_VALUE)
    }
  }

  // Handle category selection
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)

    // If "All" is selected, reset goal filter
    if (value === ALL_VALUE) {
      setSelectedGoal(ALL_VALUE)
    }
    // If a specific category is selected
    else {
      // Update pillar to match the category's parent pillar
      const pillarId = relationshipMap.categoryToPillar.get(value)
      if (pillarId) {
        setSelectedPillar(pillarId)
      }

      // If goal doesn't belong to this category, reset it
      if (selectedGoal !== ALL_VALUE && relationshipMap.goalToCategory.get(selectedGoal) !== value) {
        setSelectedGoal(ALL_VALUE)
      }
    }
  }

  // Handle goal selection
  const handleGoalChange = (value: string) => {
    setSelectedGoal(value)

    // If a specific goal is selected
    if (value !== ALL_VALUE) {
      // Update category to match the goal's parent category
      const categoryId = relationshipMap.goalToCategory.get(value)
      if (categoryId) {
        setSelectedCategory(categoryId)

        // Update pillar to match the category's parent pillar
        const pillarId = relationshipMap.categoryToPillar.get(categoryId)
        if (pillarId) {
          setSelectedPillar(pillarId)
        }
      }
    }
  }

  // Get filtered programs based on selections
  const filteredPrograms = useMemo(() => {
    const programs: Array<StrategicProgram & { goalText: string; categoryName: string; pillarName: string }> = []

    if (!data) {
      return programs
    }

    data.pillars.forEach((pillar) => {
      // Skip if specific pillar selected and doesn't match
      if (selectedPillar !== ALL_VALUE && pillar.id !== selectedPillar) return

      pillar.categories.forEach((category) => {
        // Skip if specific category selected and doesn't match
        if (selectedCategory !== ALL_VALUE && category.id !== selectedCategory) return

        category.goals.forEach((goal) => {
          // Skip if specific goal selected and doesn't match
          if (selectedGoal !== ALL_VALUE && goal.id !== selectedGoal) return

          // Add all programs from matching goals
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
  }, [selectedPillar, selectedCategory, selectedGoal, data])


  // Get selected pillar name
  const pillarName = useMemo(() => {
    if (selectedPillar === ALL_VALUE) return "All Strategic Pillars"
    const pillar = relationshipMap.pillars.get(selectedPillar)
    return pillar ? pillar.name : "Strategic Pillar"
  }, [selectedPillar, relationshipMap.pillars])

  // Function to capture the screen
  const captureScreen = async () => {
    // Check if a strategic goal is selected
    if (selectedGoal === ALL_VALUE) {
      setToast({ message: "Select a Strategic Goal", type: "warning" })
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

  const getPillarHeaderColor = (pillarId: string) => {
    // If showing all pillars, use a neutral color
    if (pillarId === ALL_VALUE) {
      return "bg-gray-600"
    }
    
    return getPillarColorById(pillarId)
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
        <h1 className="text-2xl font-bold text-black">ORD Scorecard: {pillarName}</h1>
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
                options={pillarOptions}
                value={selectedPillar}
                onChange={handlePillarChange}
                label="Strategic Pillar:"
                placeholder="Select a pillar..."
                labelWidth="w-36"
              />
            </div>
          </div>

          <div className="mb-3">
            <Dropdown
              options={categoryOptions}
              value={selectedCategory}
              onChange={handleCategoryChange}
              label="Category:"
              placeholder="Select a category..."
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
              <th className={`border border-gray-300 ${getPillarHeaderColor(selectedPillar)} text-white p-3 text-left text-base border-r-2 border-gray-400`} style={{width: '14.3%'}}>
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
