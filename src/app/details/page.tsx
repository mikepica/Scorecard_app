"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { scorecardData, loadScorecardData } from "@/core/domain/models/scorecard-data"
import { FilterDropdown } from "@/features/details/components/FilterDropdown"
import { StatusCircle } from "@/features/details/components/StatusCircle"
import { BarChart2, Menu, Camera } from "lucide-react"
import { AIChat } from "@/features/ai-chat/components/AIChat"
import type { StrategicProgram, Pillar, Category, StrategicGoal, ScoreCardData } from "@/features/scorecard/types"
import { Toast } from "@/shared/components/common/Toast"
import { Dropdown } from "@/shared/components/ui/forms/Dropdown"
import { StatusIndicator } from "@/features/scorecard/components/StatusIndicator"

// Special value to represent "All" selection
const ALL_VALUE = "all"

export default function DetailsPage() {
  // State for data loading
  const [data, setData] = useState<ScoreCardData>(scorecardData)
  const [loading, setLoading] = useState(true)

  // Load data when the page loads
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const loadedData = await loadScorecardData()
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

  // State for selected filters - default to "all"
  const [selectedPillar, setSelectedPillar] = useState(ALL_VALUE)
  const [selectedCategory, setSelectedCategory] = useState(ALL_VALUE)
  const [selectedGoal, setSelectedGoal] = useState(ALL_VALUE)

  // Create a map of relationships for quick lookups
  const relationshipMap = useMemo(() => {
    const goalToCategoryMap = new Map<string, string>()
    const goalToPillarMap = new Map<string, string>()
    const categoryToPillarMap = new Map<string, string>()
    const pillarMap = new Map<string, Pillar>()
    const categoryMap = new Map<string, Category>()
    const goalMap = new Map<string, StrategicGoal>()

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
    const options = data.pillars.map((pillar) => ({ value: pillar.id, label: pillar.name }))
    return [{ value: ALL_VALUE, label: "All" }, ...options]
  }, [data])

  // Category options depend on selected pillar
  const categoryOptions = useMemo(() => {
    const options: { value: string; label: string }[] = []

    // Add "All" option
    options.push({ value: ALL_VALUE, label: "All" })

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

    data.pillars.forEach((pillar) => {
      // Skip if specific pillar selected and this isn't it
      if (selectedPillar !== ALL_VALUE && pillar.id !== selectedPillar) return

      pillar.categories.forEach((category) => {
        // Skip if specific category selected and this isn't it
        if (selectedCategory !== ALL_VALUE && category.id !== selectedCategory) return

        category.goals.forEach((goal) => {
          // Skip if specific goal selected and this isn't it
          if (selectedGoal !== ALL_VALUE && goal.id !== selectedGoal) return

          // Add each program with its context
          goal.programs?.forEach((program) => {
            programs.push({
              ...program,
              goalText: goal.text,
              categoryName: category.name,
              pillarName: pillar.name,
            })
          })
        })
      })
    })

    return programs
  }, [data, selectedPillar, selectedCategory, selectedGoal])

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
    switch (pillarName.toLowerCase()) {
      case "science & innovation":
        return "bg-pillar-gold/20 text-pillar-gold"
      case "growth & ta leadership":
        return "bg-pillar-magenta/20 text-pillar-magenta"
      case "people & sustainability":
        return "bg-pillar-lime/20 text-pillar-lime"
      case "precision medicine":
        return "bg-pillar-light-blue/20 text-pillar-light-blue"
      case "pipeline acceleration":
        return "bg-pillar-magenta/20 text-pillar-magenta"
      case "patient engagement":
        return "bg-pillar-lime/20 text-pillar-lime"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getQuarterHeaderColor = (quarter: string) => {
    switch (quarter) {
      case "Q1":
        return "bg-blue-50 text-blue-700"
      case "Q2":
        return "bg-green-50 text-green-700"
      case "Q3":
        return "bg-amber-50 text-amber-700"
      case "Q4":
        return "bg-purple-50 text-purple-700"
      default:
        return "bg-gray-50 text-gray-700"
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-pillar-lime/20 border-b border-pillar-lime/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Strategic Programs Details</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsChatOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-pillar-magenta text-white rounded-md hover:bg-pillar-magenta/90 transition-colors"
              >
                <BarChart2 className="w-5 h-5 mr-2" />
                AI Assistant
              </button>
              <button
                onClick={captureScreen}
                className="inline-flex items-center px-4 py-2 bg-pillar-lime text-gray-900 rounded-md hover:bg-pillar-lime/90 transition-colors"
              >
                <Camera className="w-5 h-5 mr-2" />
                Capture
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FilterDropdown
              label="Pillar"
              options={pillarOptions}
              value={selectedPillar}
              onChange={handlePillarChange}
            />
            <FilterDropdown
              label="Category"
              options={categoryOptions}
              value={selectedCategory}
              onChange={handleCategoryChange}
            />
            <FilterDropdown
              label="Goal"
              options={goalOptions}
              value={selectedGoal}
              onChange={handleGoalChange}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Program</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Goal</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Pillar</th>
                  <th className={`px-6 py-4 text-center text-sm font-semibold ${getQuarterHeaderColor("Q1")}`}>Q1</th>
                  <th className={`px-6 py-4 text-center text-sm font-semibold ${getQuarterHeaderColor("Q2")}`}>Q2</th>
                  <th className={`px-6 py-4 text-center text-sm font-semibold ${getQuarterHeaderColor("Q3")}`}>Q3</th>
                  <th className={`px-6 py-4 text-center text-sm font-semibold ${getQuarterHeaderColor("Q4")}`}>Q4</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPrograms.map((program) => (
                  <tr key={program.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{program.text}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{program.goalText}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{program.categoryName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPillarHeaderColor(program.pillarName)}`}>
                        {program.pillarName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusIndicator status={program.q1Status || "on-track"} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusIndicator status={program.q2Status || "on-track"} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusIndicator status={program.q3Status || "on-track"} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusIndicator status={program.q4Status || "on-track"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI Chat Modal */}
      {isChatOpen && <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
