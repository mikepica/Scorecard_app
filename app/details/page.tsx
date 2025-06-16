"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
// Database-only mode - load data from API
import { Dropdown } from "@/components/dropdown"
import { StatusCircle } from "@/components/status-circle"
import { BarChart2, Menu, Camera, Bot, FileText, Eye, EyeOff } from "lucide-react"
import { AIChat } from "@/components/ai-chat"
import type { StrategicProgram, Pillar, Category, StrategicGoal, ScoreCardData } from "@/types/scorecard"
import { Toast } from "@/components/toast"
import { EditableField } from "@/components/ui/editable-field"
import { GenerateUpdateModal } from "@/components/generate-update-modal"
import { GenerateInsightsModal } from "@/components/generate-insights-modal"

// Special value to represent "All" selection
const ALL_VALUE = "all"

export default function DetailsPage() {
  // State for data loading
  const [data, setData] = useState<ScoreCardData | null>(null)
  const [loading, setLoading] = useState(true)

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

  // State for selected filters - default to "all"
  const [selectedPillar, setSelectedPillar] = useState(ALL_VALUE)
  const [selectedCategory, setSelectedCategory] = useState(ALL_VALUE)
  const [selectedGoal, setSelectedGoal] = useState(ALL_VALUE)

  // State for filter visibility - default to show filters
  const [filtersVisible, setFiltersVisible] = useState(true)

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

  // Get sponsor information
  const sponsor = useMemo(() => {
    if (selectedGoal === ALL_VALUE) {
      return "Multiple"
    }

    const goal = relationshipMap.goals.get(selectedGoal)
    return goal?.ordLtSponsors || ""
  }, [selectedGoal, relationshipMap.goals])

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

  const getPillarHeaderColor = (pillarName: string) => {
    // If showing all pillars, use a neutral color
    if (pillarName.toLowerCase().includes("all")) {
      return "bg-gray-600"
    }
    
    switch (pillarName.toLowerCase()) {
      case "science & innovation":
        return "bg-cyan-500"
      case "growth & ta leadership":
        return "bg-pink-600"
      case "people & sustainability":
        return "bg-pillar-lime"
      case "precision medicine":
        return "bg-pillar-light-blue"
      case "pipeline acceleration":
        return "bg-pillar-magenta"
      case "patient engagement":
        return "bg-pillar-lime"
      default:
        return "bg-purple-800"
    }
  }

  const getPillarTextColor = (pillarName: string) => {
    switch (pillarName.toLowerCase()) {
      case "science & innovation":
        return "text-cyan-500"
      case "growth & ta leadership":
        return "text-pink-600"
      case "people & sustainability":
        return "text-pillar-lime"
      case "precision medicine":
        return "text-pillar-light-blue"
      case "pipeline acceleration":
        return "text-pillar-magenta"
      case "patient engagement":
        return "text-pillar-lime"
      default:
        return "text-purple-800"
    }
  }

  // Handle status update
  const handleStatusUpdate = async (
    pillarId: string,
    categoryId: string,
    goalId: string,
    programId: string,
    quarter: string,
    newStatus: string
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

  // Handle progress update
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

  // Handle Generate Update action (placeholder for now)
  const handleGenerateUpdate = (content: string, instructions: string, files: File[]) => {
    // TODO: Implement actual generation logic
    console.log('Generate update called with:', { content, instructions, files })
    setToast({ message: 'Generate Update functionality will be implemented later', type: 'info' })
  }

  // Handle opening the Generate Insights modal
  const handleOpenInsightsModal = (program: StrategicProgram) => {
    setCurrentInsightsProgram(program)
    setIsInsightsModalOpen(true)
  }

  // Handle Generate Insights action (placeholder for now)
  const handleGenerateInsights = (prompt: string, promptFlow: string, files: File[]) => {
    // TODO: Implement actual insights generation logic
    console.log('Generate insights called with:', { prompt, promptFlow, files })
    setToast({ message: 'Generate Insights functionality will be implemented later', type: 'info' })
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
      <header className="bg-lime-400 py-2 px-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">ORD 2024 Scorecard: {pillarName}</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/instructions"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors text-sm"
          >
            <FileText size={16} />
            <span>Instructions</span>
          </Link>

          <button
            onClick={() => setFiltersVisible(!filtersVisible)}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md transition-colors text-sm"
          >
            {filtersVisible ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>Show/Hide Filters</span>
          </button>

          <button
            onClick={captureScreen}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md transition-colors text-sm"
          >
            <Camera size={16} />
            <span>Capture Screen</span>
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md transition-colors text-sm"
          >
            <BarChart2 size={16} />
            <span>Goal-level view</span>
          </Link>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md transition-colors text-sm"
          >
            <Menu size={16} />
            <span>AI Chat</span>
          </button>
        </div>

        <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} context={data} />
      </header>

      {/* Filter section */}
      {filtersVisible && (
        <div className="bg-lime-100 py-3 px-4">
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
            <div className="ml-4 flex items-center">
              <span className="font-medium text-lg mr-2">ORD LT sponsor:</span>
              <span>{sponsor}</span>
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
            <tr>
              <th className={`border border-gray-300 ${getPillarHeaderColor(pillarName)} text-white p-3 text-left text-base`} style={{width: '12%'}}>
                2024 proposed strategic programs
              </th>
              <th className="border border-gray-300 bg-green-500 text-white p-3 text-center text-base" style={{width: '17.6%'}}>Progress Updates</th>
              <th className="border border-gray-300 bg-green-500 text-white p-3 text-center text-base" style={{width: '17.6%'}}>Q1</th>
              <th className="border border-gray-300 bg-green-500 text-white p-3 text-center text-base" style={{width: '17.6%'}}>Q2</th>
              <th className="border border-gray-300 bg-yellow-500 text-white p-3 text-center text-base" style={{width: '17.6%'}}>Q3</th>
              <th className="border border-gray-300 bg-red-500 text-white p-3 text-center text-base" style={{width: '17.6%'}}>Q4</th>
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
                    <td className="border border-gray-300 p-3 relative" style={{width: '12%'}}>
                      <EditableField
                        value={program.text}
                        onSave={(newText) => handleProgramTextUpdate(program.id, newText)}
                        className={`${getPillarTextColor(program.pillarName)} font-medium text-base pr-8`}
                      />
                      <button
                        onClick={() => handleOpenInsightsModal(program)}
                        className="absolute bottom-2 right-2 p-1 rounded hover:bg-gray-100 transition-colors group"
                        title="Generate Insights"
                      >
                        <Bot className="h-4 w-4 text-gray-500 group-hover:text-purple-600" />
                      </button>
                    </td>
                    <td className="border border-gray-300 p-3 relative" style={{width: '17.6%'}}>
                      <EditableField
                        value={program.progressUpdates || ""}
                        onSave={(newProgress) => handleProgressUpdate(program.id, newProgress)}
                        className="text-base pr-8"
                        placeholder="Enter progress updates..."
                      />
                      <button
                        onClick={() => handleOpenGenerateModal(program)}
                        className="absolute bottom-2 right-2 p-1 rounded hover:bg-gray-100 transition-colors group"
                        title="Generate Update"
                      >
                        <Bot className="h-4 w-4 text-gray-500 group-hover:text-blue-600" />
                      </button>
                    </td>
                    <td className="border border-gray-300 p-3 pr-10 relative" style={{width: '17.6%'}}>
                      <div className="mb-2">
                        <EditableField
                          value={program.q1Objective || ""}
                          onSave={(newObjective) => handleObjectiveUpdate(program.id, "q1", newObjective)}
                          className="text-base"
                          placeholder="Enter Q1 objective..."
                        />
                      </div>
                      <div className="status-dot-container">
                        <StatusCircle
                          status={program.q1Status}
                          onStatusChange={(newStatus) => handleStatusUpdate(String(program.strategicPillarId), String(program.categoryId), String(program.strategicGoalId), String(program.id), "q1", newStatus ?? '')}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3 pr-10 relative" style={{width: '17.6%'}}>
                      <div className="mb-2">
                        <EditableField
                          value={program.q2Objective || ""}
                          onSave={(newObjective) => handleObjectiveUpdate(program.id, "q2", newObjective)}
                          className="text-base"
                          placeholder="Enter Q2 objective..."
                        />
                      </div>
                      <div className="status-dot-container">
                        <StatusCircle
                          status={program.q2Status}
                          onStatusChange={(newStatus) => handleStatusUpdate(String(program.strategicPillarId), String(program.categoryId), String(program.strategicGoalId), String(program.id), "q2", newStatus ?? '')}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3 pr-10 relative" style={{width: '17.6%'}}>
                      <div className="mb-2">
                        <EditableField
                          value={program.q3Objective || ""}
                          onSave={(newObjective) => handleObjectiveUpdate(program.id, "q3", newObjective)}
                          className="text-base"
                          placeholder="Enter Q3 objective..."
                        />
                      </div>
                      <div className="status-dot-container">
                        <StatusCircle
                          status={program.q3Status}
                          onStatusChange={(newStatus) => handleStatusUpdate(String(program.strategicPillarId), String(program.categoryId), String(program.strategicGoalId), String(program.id), "q3", newStatus ?? '')}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3 pr-10 relative" style={{width: '17.6%'}}>
                      <div className="mb-2">
                        <EditableField
                          value={program.q4Objective || ""}
                          onSave={(newObjective) => handleObjectiveUpdate(program.id, "q4", newObjective)}
                          className="text-base"
                          placeholder="Enter Q4 objective..."
                        />
                      </div>
                      <div className="status-dot-container">
                        <StatusCircle
                          status={program.q4Status}
                          onStatusChange={(newStatus) => handleStatusUpdate(String(program.strategicPillarId), String(program.categoryId), String(program.strategicGoalId), String(program.id), "q4", newStatus ?? '')}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="border border-gray-300 p-4 text-center text-gray-500 text-base">
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
          initialContent={currentProgram.progressUpdates || ""}
          onGenerate={handleGenerateUpdate}
        />
      )}

      {/* Generate Insights Modal */}
      {currentInsightsProgram && (
        <GenerateInsightsModal
          isOpen={isInsightsModalOpen}
          onClose={() => {
            setIsInsightsModalOpen(false)
            setCurrentInsightsProgram(null)
          }}
          onGenerate={handleGenerateInsights}
        />
      )}
      
      {/* Toast notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
