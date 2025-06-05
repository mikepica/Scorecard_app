# .github/workflows/main.yaml

```yaml

# Continuous Integration Pipeline for Streamlit App
name: Azimuth Demo Apps

on:
  push:
    branches:
      - 'main'
  
  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

jobs:
  build:
    runs-on:
      - self-hosted
      - azimuth

    steps:
      - uses: actions/checkout@v4
        with:
            persist-credentials: 'false'

      - name: Login to Harbor
        uses: docker/login-action@v3
        with:
          registry: harbor.csis.astrazeneca.net
          username: ${{ secrets.AZIMUTH_HARBOR_USERNAME }}
          password: ${{ secrets.AZIMUTH_HARBOR_PASSWORD }}


      #- name: Simple Streamlit Apps
      #  run: |
        #  tag=v9
        #  docker build . -t harbor.csis.astrazeneca.net/azimuth-demo/simple-streamlit:$tag
        #  docker push harbor.csis.astrazeneca.net/azimuth-demo/simple-streamlit:$tag

      - name: React App Demo
        run: |
          echo "React App Demo"
          tag=latest
          docker build . -t harbor.csis.astrazeneca.net/azimuth-demo/scorecard-app:$tag --file src/Dockerfile
          docker push harbor.csis.astrazeneca.net/azimuth-demo/scorecard-app:$tag

      - name: Docker Size
        run: docker system df -v
```

# .gitignore

```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.



# dependencies
/node_modules

# next.js
/.next/
/out/

# production
/build

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts


```

# app/api/chat/route.ts

```ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate request body
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    const { messages, context } = body;

    // Load system prompt from file
    const promptPath = path.join(process.cwd(), 'llm-system-prompt.md');
    const systemPrompt = await fs.readFile(promptPath, 'utf-8');

    // Limit context size to prevent token overflow
    const contextString = JSON.stringify(context);
    const maxContextLength = 20000; // Adjust based on needs
    const truncatedContext = contextString.length > maxContextLength 
      ? contextString.substring(0, maxContextLength) + '...[truncated]'
      : contextString;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `${systemPrompt}\n\nHere is the context of the scorecard data: ${truncatedContext}`
        },
        ...messages
      ],
    });

    return NextResponse.json({ 
      response: completion.choices[0].message.content 
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 
```

# app/api/scorecard/route.ts

```ts
import { NextResponse } from "next/server"
import { loadAndMergeScorecardCSVs } from '@/utils/csv-parser'

export async function GET() {
  try {
    const mergedData = await loadAndMergeScorecardCSVs()
    return NextResponse.json(mergedData)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read CSV files' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Here you would typically validate the data structure
    // and save it to a database

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
  }
}
```

# app/api/scorecard/update/route.ts

```ts
import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { transformCSVToScoreCardData, loadAndMergeScorecardCSVs, parseCSVString } from "@/utils/csv-parser"

// For best practice, consider using an environment variable for this path in production
const CSV_FILE_PATH = path.join(process.cwd(), "data", "DummyData.csv")

// Synchronous CSV parser for local string content (handles quoted fields)
function parseCSVSync(csvText: string): string[][] {
  const rows = csvText.split("\n")
  return rows.map((row) => {
    const values: string[] = []
    let inQuotes = false
    let currentValue = ""
    for (let i = 0; i < row.length; i++) {
      const char = row[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        values.push(currentValue)
        currentValue = ""
      } else {
        currentValue += char
      }
    }
    values.push(currentValue)
    return values
  })
}

export async function POST(request: Request) {
  try {
    const { fieldPath, newValue, type, quarter }: { fieldPath: string[], newValue: string, type: string, quarter?: 'q1' | 'q2' | 'q3' | 'q4' } = await request.json()
    // type: 'program' | 'category' | 'goal'
    // fieldPath: [pillarId, categoryId, goalId, programId] for program, [pillarId, categoryId] for category, [pillarId, categoryId, goalId] for goal

    let csvPath: string, idColumn: string, statusColumn: string, idValue: string, isProgram = false
    let updateRowFn: (row: string[], header: string[]) => void
    if (type === 'program') {
      // Program status update (DummyData.csv)
      csvPath = path.join(process.cwd(), 'data', 'DummyData.csv')
      idColumn = 'StrategicProgramID'
      isProgram = true
      const [pillarId, categoryId, goalId, programId] = fieldPath
      // Use the quarter parameter to determine which status column to update
      const quarterToStatusColumn = {
        q1: 'Q1 Status',
        q2: 'Q2 Status',
        q3: 'Q3 Status',
        q4: 'Q4 Status',
      }
      statusColumn = quarter && quarterToStatusColumn[quarter] ? quarterToStatusColumn[quarter] : 'Q4 Status'
      idValue = programId
      updateRowFn = (row: string[], header: string[]) => {
        const statusIdx = header.indexOf(statusColumn)
        if (statusIdx !== -1) row[statusIdx] = newValue || ''
      }
    } else if (type === 'category') {
      // Category status update (Category-status-comments.csv)
      csvPath = path.join(process.cwd(), 'data', 'Category-status-comments.csv')
      idColumn = 'CategoryID'
      const [pillarId, categoryId] = fieldPath
      idValue = categoryId
      statusColumn = 'Status'
      updateRowFn = (row: string[], header: string[]) => {
        const statusIdx = header.indexOf(statusColumn)
        if (statusIdx !== -1) row[statusIdx] = newValue || ''
      }
    } else if (type === 'goal') {
      // Goal status update (Strategic-Goals.csv)
      csvPath = path.join(process.cwd(), 'data', 'Strategic-Goals.csv')
      idColumn = 'StrategicGoalID'
      const [pillarId, categoryId, goalId] = fieldPath
      idValue = goalId
      statusColumn = 'Status'
      updateRowFn = (row: string[], header: string[]) => {
        const statusIdx = header.indexOf(statusColumn)
        if (statusIdx !== -1) row[statusIdx] = newValue || ''
      }
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // Read and parse the CSV
    const csvContent = await fs.readFile(csvPath, 'utf-8')
    const rows = parseCSVString(csvContent)
    const header = rows[0]
    const normalizedHeader = header.map(h => h.replace(/^\uFEFF/, '').replace(/\r/g, '').trim())
    const idIdx = normalizedHeader.indexOf(idColumn)
    if (idIdx === -1) {
      return NextResponse.json({ error: `${idColumn} column not found`, header: normalizedHeader }, { status: 404 })
    }
    // Find the row by ID
    const allIds = rows.slice(1).map(row => row[idIdx])
    const rowIdx = rows.findIndex((row, idx) => idx !== 0 && row[idIdx]?.trim() === idValue.trim())
    if (rowIdx === -1) {
      return NextResponse.json({ error: `${type} not found`, allIds, idValue }, { status: 404 })
    }
    // Update the status
    updateRowFn(rows[rowIdx], header)
    // Write back to CSV
    const newCsvContent = rows.map(row => row.join(",")).join("\n")
    try {
      await fs.writeFile(csvPath, newCsvContent)
    } catch (writeError) {
      return NextResponse.json({ error: 'Failed to write CSV file' }, { status: 500 })
    }

    // Return the updated merged hierarchy
    const mergedData = await loadAndMergeScorecardCSVs()
    return NextResponse.json(mergedData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
} 
```

# app/details/page.tsx

```tsx
"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { scorecardData, loadScorecardData } from "@/data/scorecard-data"
import { Dropdown } from "@/components/dropdown"
import { StatusCircle } from "@/components/status-circle"
import { BarChart2, Menu, Camera } from "lucide-react"
import { AIChat } from "@/components/ai-chat"
import type { StrategicProgram, Pillar, Category, StrategicGoal, ScoreCardData } from "@/types/scorecard"
import { Toast } from "@/components/toast"

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
    <div className="min-h-screen flex flex-col">
      <header className="bg-lime-400 py-2 px-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">ORD 2024 Scorecard: {pillarName}</h1>
        <div className="bg-red-600 text-white px-4 py-1">Overall Status</div>
        <div className="flex items-center gap-2">
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

      {/* Table section - make it fill the remaining space */}
      <div className="flex-1 p-4 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`border border-gray-300 ${getPillarHeaderColor(pillarName)} text-white p-3 text-left w-1/5 text-base`}>
                2024 proposed strategic programs
              </th>
              <th className="border border-gray-300 bg-green-500 text-white p-3 text-center w-1/5 text-base">Q1</th>
              <th className="border border-gray-300 bg-green-500 text-white p-3 text-center w-1/5 text-base">Q2</th>
              <th className="border border-gray-300 bg-yellow-500 text-white p-3 text-center w-1/5 text-base">Q3</th>
              <th className="border border-gray-300 bg-red-500 text-white p-3 text-center w-1/5 text-base">Q4</th>
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
                    <td className="border border-gray-300 p-3">
                      <div className={`${getPillarTextColor(program.pillarName)} font-medium text-base`}>{program.text}</div>
                    </td>
                    <td className="border border-gray-300 p-3 pr-10 relative">
                      <div className="mb-2 text-base">
                        {program.q1Objective || "On target against year-to-date number"}
                      </div>
                      <div className="status-dot-container">
                        <StatusCircle
                          status={program.q1Status}
                          onStatusChange={(newStatus) => handleStatusUpdate(String(program.strategicPillarId), String(program.categoryId), String(program.strategicGoalId), String(program.id), "q1", newStatus ?? '')}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3 pr-10 relative">
                      <div className="mb-2 text-base">
                        {program.q2Objective || "On target against year-to-date number"}
                      </div>
                      <div className="status-dot-container">
                        <StatusCircle
                          status={program.q2Status}
                          onStatusChange={(newStatus) => handleStatusUpdate(String(program.strategicPillarId), String(program.categoryId), String(program.strategicGoalId), String(program.id), "q2", newStatus ?? '')}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3 pr-10 relative">
                      <div className="mb-2 text-base">
                        {program.q3Objective || "On target against year-to-date number"}
                      </div>
                      <div className="status-dot-container">
                        <StatusCircle
                          status={program.q3Status}
                          onStatusChange={(newStatus) => handleStatusUpdate(String(program.strategicPillarId), String(program.categoryId), String(program.strategicGoalId), String(program.id), "q3", newStatus ?? '')}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3 pr-10 relative">
                      <div className="mb-2 text-base">
                        {program.q4Objective || "On target against year-to-date number"}
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
                <td colSpan={5} className="border border-gray-300 p-4 text-center text-gray-500 text-base">
                  No programs found with the current filter settings.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Toast notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

```

# app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: Arial, Helvetica, sans-serif;
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

.status-dot-container {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

```

# app/layout.tsx

```tsx
import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import "react-day-picker/dist/style.css"

export const metadata: Metadata = {
  title: "ORD Scorecards",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="download" content="force" />
      </head>
      <body>{children}</body>
    </html>
  )
}

```

# app/page.tsx

```tsx
"use client"

import { useEffect, useState } from "react"
import { Scorecard } from "@/components/scorecard"
import { scorecardData, loadScorecardData } from "@/data/scorecard-data"
import type { ScoreCardData } from "@/types/scorecard"
import { Camera, BarChart2, Menu } from "lucide-react"
import Link from "next/link"
import { Toast } from "@/components/toast"
import { AIChat } from "@/components/ai-chat"
import { Dropdown } from "@/components/dropdown"

export default function Home() {
  const [data, setData] = useState<ScoreCardData>(scorecardData)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedQuarter, setSelectedQuarter] = useState("q1")

  const QUARTER_OPTIONS = [
    { value: "q1", label: "Q1" },
    { value: "q2", label: "Q2" },
    { value: "q3", label: "Q3" },
    { value: "q4", label: "Q4" },
  ]

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const loadedData = await loadScorecardData()
        setData(loadedData)
      } catch (error) {
        // Remove all console.error statements
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleDataUpdate = (newData: ScoreCardData) => {
    setData(newData)
    setToast({ message: "Changes saved successfully", type: "success" })
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

        link.download = `scorecard_overview_${formattedDate}.png`

        // Trigger download
        document.body.appendChild(link)
        link.click()

        // Clean up
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        setToast({ message: "Screen captured successfully", type: "success" })
      }, "image/png")
    } catch (error) {
      // Remove all console.error statements
      setToast({ message: "Failed to capture screen", type: "error" })
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="relative py-2 bg-lime-400 flex justify-between items-center px-4">
        <h1 className="text-2xl font-bold">ORD 2024 Scorecard</h1>

        <div className="flex items-center gap-4">
          <Dropdown
            options={QUARTER_OPTIONS}
            value={selectedQuarter}
            onChange={setSelectedQuarter}
            label="Quarter:"
            labelWidth="w-24"
          />
          <button
            onClick={captureScreen}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
          >
            <Camera size={20} />
            <span className="whitespace-nowrap">Capture Screen</span>
          </button>

          <Link
            href="/details"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
          >
            <BarChart2 size={20} />
            <span className="whitespace-nowrap">Program View</span>
          </Link>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
          >
            <Menu size={20} />
            <span className="whitespace-nowrap">AI Chat</span>
          </button>
        </div>

        <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} context={data} />
      </div>

      <div className="container mx-auto px-4 pt-4 flex-1 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading scorecard data...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <Scorecard data={data} onDataUpdate={handleDataUpdate} selectedQuarter={selectedQuarter} />
          </div>
        )}
      </div>
      {/* Toast notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </main>
  )
}

```

# app/upload/page.tsx

```tsx
"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("Please select a JSON file")
      return
    }

    if (file.type !== "application/json") {
      setError("Only JSON files are supported")
      return
    }

    setLoading(true)

    try {
      const fileContent = await file.text()
      const jsonData = JSON.parse(fileContent)

      // Validate the structure
      if (!jsonData.pillars || !Array.isArray(jsonData.pillars)) {
        throw new Error('Invalid JSON structure. The file must contain a "pillars" array.')
      }

      // Send to API
      const response = await fetch("/api/scorecard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload scorecard data")
      }

      // Redirect to the scorecard view
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Upload Scorecard Data</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
          <input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            className="hidden"
            accept="application/json"
          />
          <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-800">
            {file ? file.name : "Choose a JSON file"}
          </label>
          <p className="text-sm text-gray-500 mt-2">{file ? "Click upload to continue" : "or drag and drop here"}</p>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Uploading..." : "Upload Scorecard Data"}
        </button>
      </form>
    </div>
  )
}

```

# components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

# components/ai-chat.tsx

```tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, RefreshCw } from "lucide-react"
import { Overlay } from "./overlay"
import type { ScoreCardData } from "@/types/scorecard"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

type Message = {
  id: string
  text: string
  sender: "user" | "ai"
  timestamp: Date
}

type AIChatProps = {
  isOpen: boolean
  onClose: () => void
  context: ScoreCardData
}

export function AIChat({ isOpen, onClose, context }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Initialize chat with context
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          text: "Hello! I have access to your scorecard data and can help you analyze it. How can I assist you today?",
          sender: "ai",
          timestamp: new Date(),
        },
      ])
    }
  }, [isOpen, messages.length])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (typeof window !== 'undefined' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Reset chat
  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setMessages([])
    setInput("")
    setIsLoading(false)
  }

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController()

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.text
            })),
            {
              role: 'user',
              content: input
            }
          ],
          context
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
    } catch (error: unknown) {
      // Only show error if it's not an abort error
      if (error instanceof Error && error.name !== 'AbortError') {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "I apologize, but I encountered an error. Please try again.",
          sender: "ai",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  // Format timestamp
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (!isOpen) return null

  return (
    <>
      <Overlay isVisible={isOpen} onClick={() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
          abortControllerRef.current = null
        }
        onClose()
      }} />
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-[768px] bg-white shadow-lg z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-purple-600 text-white">
          <h2 className="text-lg font-semibold">AI Chat</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleReset} 
              className="p-1 rounded-full hover:bg-purple-700"
              title="Reset Chat"
            >
              <RefreshCw size={20} />
            </button>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-purple-700">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${message.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === "user" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-800"
                }`}
              >
                {message.sender === "ai" ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                      {message.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  message.text
                )}
              </div>
              <span className="text-xs text-gray-500 mt-1">{formatTime(message.timestamp)}</span>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start">
              <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

```

# components/dropdown.tsx

```tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"

interface DropdownProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  labelWidth?: string
}

export function Dropdown({
  options,
  value,
  onChange,
  label,
  placeholder = "Select...",
  labelWidth = "w-32",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className="relative w-full flex items-center" ref={dropdownRef}>
      <label className={`font-medium text-lg ${labelWidth} flex-shrink-0`}>{label}</label>
      <div
        className="flex items-center justify-between w-full p-2 border border-gray-300 rounded-md bg-white cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className="text-gray-500" />
      </div>

      {isOpen && (
        <div
          className="absolute z-10 w-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
          style={{ top: "100%", marginLeft: labelWidth }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                value === option.value ? "bg-purple-50 text-purple-700" : ""
              }`}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

```

# components/header.tsx

```tsx
"use client"

import { useState } from "react"
import { Menu, BarChart2, Camera } from "lucide-react"
import { AIChat } from "./ai-chat"
import Link from "next/link"

export function Header({
  title = "ORD 2024 Scorecard",
  onCaptureScreen,
}: {
  title?: string
  onCaptureScreen?: () => void
}) {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <header className="relative py-2 bg-lime-400 flex justify-between items-center px-4">
      <h1 className="text-2xl font-bold">{title}</h1>

      <div className="flex items-center gap-2">
        <Link
          href="/details"
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md transition-colors text-sm"
        >
          <BarChart2 size={16} />
          <span>Program View</span>
        </Link>

        {onCaptureScreen && (
          <button
            onClick={onCaptureScreen}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md transition-colors text-sm"
          >
            <Camera size={16} />
            <span>Capture Screen</span>
          </button>
        )}

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md transition-colors text-sm"
        >
          <Menu size={16} />
          <span>AI Chat</span>
        </button>
      </div>

      <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </header>
  )
}

```

# components/overlay.tsx

```tsx
"use client"

export function Overlay({ isVisible, onClick }: { isVisible: boolean; onClick: () => void }) {
  if (!isVisible) return null

  return <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={onClick} />
}

```

# components/pillar-card.tsx

```tsx
import type React from "react"

interface PillarCardProps {
  title: string
  description: string
  imageUrl?: string
}

const PillarCard: React.FC<PillarCardProps> = ({ title, description, imageUrl }) => {
  return (
    <div className="border rounded-md overflow-hidden h-full flex flex-col">
      {imageUrl && <img src={imageUrl || "/placeholder.svg"} alt={title} className="w-full h-48 object-cover" />}
      <div className="p-4 flex-1">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-700">{description}</p>
      </div>
    </div>
  )
}

export default PillarCard

```

# components/pillar-icon.tsx

```tsx
export function PillarIcon({ name }: { name: string }) {
  const getIconSrc = () => {
    const lowerName = name.toLowerCase()

    // Map to the new icon files
    if (lowerName.includes("precision medicine")) {
      return "/icons/precision-medicine.png"
    } else if (lowerName.includes("pipeline acceleration")) {
      return "/icons/pipeline.png"
    } else if (lowerName.includes("people")) {
      return "/icons/people.png"
    } else if (lowerName.includes("science") || lowerName.includes("patient engagement")) {
      // Using people icon as fallback for science/patient engagement since no science icon was uploaded
      return "/icons/people.png"
    } else if (lowerName.includes("growth")) {
      // Using precision-medicine icon as fallback for growth since no growth icon was uploaded
      return "/icons/precision-medicine.png"
    }

    return null
  }

  const getBgColor = () => {
    const lowerName = name.toLowerCase()

    if (lowerName.includes("precision medicine")) {
      return "bg-pillar-light-blue"
    } else if (lowerName.includes("pipeline acceleration")) {
      return "bg-pillar-magenta"
    } else if (lowerName.includes("people")) {
      return "bg-pillar-lime"
    } else if (lowerName.includes("patient engagement")) {
      return "bg-green-500"
    } else if (lowerName.includes("science")) {
      return "bg-cyan-400"
    } else if (lowerName.includes("growth")) {
      return "bg-pink-600"
    }

    return "bg-gray-300"
  }

  const iconSrc = getIconSrc()

  // If we have an icon source, use the img tag
  if (iconSrc) {
    const lowerName = name.toLowerCase()
    
    // Remove circle for Patient Engagement
    if (lowerName.includes("patient engagement")) {
      return (
        <div className="w-24 h-24 flex items-center justify-center">
          <img 
            src={iconSrc || "/placeholder.svg"} 
            alt={`${name} icon`} 
            className="w-15 h-15 object-contain" 
          />
        </div>
      )
    }
    
    // Keep circle for all other pillars
    return (
      <div className={`w-24 h-24 rounded-full ${getBgColor()} flex items-center justify-center overflow-hidden p-2`}>
        <img 
          src={iconSrc || "/placeholder.svg"} 
          alt={`${name} icon`} 
          className="w-20 h-20 object-contain" 
        />
      </div>
    )
  }

  // Fallback to the original icon display
  const getIcon = () => {
    const lowerName = name.toLowerCase()

    if (lowerName.includes("science") || lowerName.includes("patient engagement")) {
      return "🧪"
    } else if (lowerName.includes("growth") || lowerName.includes("precision medicine")) {
      return "📈"
    } else if (lowerName.includes("people") || lowerName.includes("pipeline acceleration")) {
      return "👥"
    }

    return "📊"
  }

  return <div className={`w-24 h-24 rounded-full ${getBgColor()} flex items-center justify-center text-3xl`}>{getIcon()}</div>
}

```

# components/scorecard.tsx

```tsx
"use client"
import { StatusIndicator } from "@/components/status-indicator"
import { PillarIcon } from "@/components/pillar-icon"
import type { ScoreCardData, Pillar, Category, StrategicGoal } from "@/types/scorecard"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"
import { EditableField } from "@/components/ui/editable-field"
import { useEditableField } from "@/hooks/use-editable-field"
import { Dropdown } from "@/components/dropdown"
import { StatusCircle } from "@/components/status-circle"

const STATUS_OPTIONS = [
  { value: "exceeded", label: "Exceeded" },
  { value: "on-track", label: "On Track" },
  { value: "delayed", label: "Delayed" },
  { value: "missed", label: "Missed" },
]

export function Scorecard({ data, onDataUpdate, selectedQuarter = "q4" }: { data: ScoreCardData; onDataUpdate: (newData: ScoreCardData) => void; selectedQuarter?: string }) {
  // Check if data and data.pillars exist before mapping
  if (!data || !data.pillars || !Array.isArray(data.pillars)) {
    return <div className="w-full p-4 text-center">No scorecard data available</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full h-full flex-1 mt-6">
      {data.pillars.map((pillar) => (
        <PillarCard key={pillar.id} pillar={pillar} onDataUpdate={onDataUpdate} selectedQuarter={selectedQuarter} />
      ))}
    </div>
  )
}

function PillarCard({ pillar, onDataUpdate, selectedQuarter }: { pillar: Pillar; onDataUpdate: (newData: ScoreCardData) => void; selectedQuarter: string }) {
  const getBgColor = (name: string) => {
    switch (name.toLowerCase()) {
      case "science & innovation":
        return "bg-cyan-200"
      case "growth & ta leadership":
        return "bg-pink-500 text-white"
      case "people & sustainability":
        return "bg-pillar-lime"
      case "precision medicine":
        return "bg-pillar-light-blue"
      case "pipeline acceleration":
        return "bg-pillar-magenta text-white"
      case "patient engagement":
        return "bg-pillar-lime"
      default:
        return "bg-gray-200"
    }
  }

  const getLineColor = (name: string) => {
    switch (name.toLowerCase()) {
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
        return "bg-gray-400"
    }
  }

  return (
    <div className="border rounded-md overflow-hidden h-full flex flex-col relative">
      <div className={`p-3 ${getBgColor(pillar.name)}`}>
        <div className="flex items-center gap-2">
          <PillarIcon name={pillar.name} />
          <h2 className="text-xl font-bold">{pillar.name}</h2>
        </div>
      </div>
      <div className="p-3 overflow-auto flex-1">
        {pillar.categories &&
          pillar.categories.map((category) => (
            <CategorySection key={category.id} category={category} pillar={pillar} onDataUpdate={onDataUpdate} selectedQuarter={selectedQuarter} />
          ))}
      </div>
      {/* Bottom line positioned slightly above the bottom */}
      <div className={`h-1 w-full ${getLineColor(pillar.name)} absolute bottom-1`}></div>
    </div>
  )
}

function CategorySection({ category, pillar, onDataUpdate, selectedQuarter }: { category: Category; pillar: Pillar; onDataUpdate: (newData: ScoreCardData) => void; selectedQuarter: string }) {
  // Handler for category status update
  const handleCategoryStatusChange = async (newStatus: string | undefined) => {
    const response = await fetch('/api/scorecard/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: [pillar.id, category.id],
        newValue: newStatus,
        type: 'category',
      }),
    })
    if (!response.ok) throw new Error('Failed to update category status');
    const updatedData = await response.json();
    onDataUpdate(updatedData);
  }
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center mb-2 gap-2">
        <h3 className={`text-base font-medium ${getCategoryColor(pillar.name)}`}>{category.name}</h3>
        <StatusCircle
          status={category.status}
          onStatusChange={handleCategoryStatusChange}
        />
      </div>
      <ul className="space-y-2">
        {category.goals && category.goals.map((goal) => (
          <GoalItem key={goal.id} goal={goal} pillar={pillar} category={category} onDataUpdate={onDataUpdate} selectedQuarter={selectedQuarter} />
        ))}
      </ul>
    </div>
  )
}

function GoalItem({ goal, pillar, category, onDataUpdate, selectedQuarter }: { goal: StrategicGoal; pillar: Pillar; category: Category; onDataUpdate: (newData: ScoreCardData) => void; selectedQuarter: string }) {
  const [expanded, setExpanded] = useState(false)
  const hasPrograms = goal.programs && goal.programs.length > 0

  // Use Q4 status for display, fallback to other quarters if not available
  const displayStatus = goal.status || goal.q4Status || goal.q3Status || goal.q2Status || goal.q1Status

  // Handler for goal status update
  const handleGoalStatusChange = async (newStatus: string | undefined) => {
    const response = await fetch('/api/scorecard/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: [pillar.id, category.id, goal.id],
        newValue: newStatus,
        type: 'goal',
      }),
    })
    if (!response.ok) throw new Error('Failed to update goal status');
    const updatedData = await response.json();
    onDataUpdate(updatedData);
  }

  const { handleSave } = useEditableField({
    fieldPath: [pillar.id, category.id, goal.id, "", "Strategic Goal"],
    onDataUpdate,
  })

  // Local handler for program editing
  const handleProgramSave = async (programText: string, newValue: string) => {
    const response = await fetch('/api/scorecard/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: [pillar.id, category.id, goal.id, programText, "Strategic Program"],
        newValue,
      }),
    })
    if (!response.ok) throw new Error('Failed to update field');
    const updatedData = await response.json();
    onDataUpdate(updatedData);
  }

  const getProgramBorderColor = (pillarName: string) => {
    switch (pillarName.toLowerCase()) {
      case "science & innovation":
        return "border-cyan-500"
      case "growth & ta leadership":
        return "border-pink-500"
      case "people & sustainability":
        return "border-pillar-lime"
      case "precision medicine":
        return "border-pillar-light-blue"
      case "pipeline acceleration":
        return "border-pillar-magenta"
      case "patient engagement":
        return "border-pillar-lime"
      default:
        return "border-gray-200"
    }
  }

  // Helper to get the correct status for the selected quarter
  const getProgramStatus = (program: any) => {
    switch (selectedQuarter) {
      case "q1": return program.q1Status;
      case "q2": return program.q2Status;
      case "q3": return program.q3Status;
      case "q4": return program.q4Status;
      default: return program.q4Status;
    }
  }

  return (
    <li>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1">
          {hasPrograms && (
            <button onClick={() => setExpanded(!expanded)} className="mt-0.5 text-gray-500 hover:text-gray-700">
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          <EditableField
            value={goal.text}
            onSave={handleSave}
            className="text-base"
          />
        </div>
        <StatusCircle
          status={displayStatus}
          onStatusChange={handleGoalStatusChange}
        />
      </div>

      {expanded && hasPrograms && (
        <ul className={`pl-6 mt-2 space-y-2 border-l-2 ${getProgramBorderColor(pillar.name)}`}>
          {goal.programs?.map((program) => (
            <li key={program.id} className="flex items-start justify-between gap-2">
              <EditableField
                value={program.text}
                onSave={async (newValue) => handleProgramSave(program.text, newValue)}
                className="text-sm"
              />
              <StatusCircle
                status={getProgramStatus(program)}
                onStatusChange={async (newStatus) => {
                  const response = await fetch('/api/scorecard/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      fieldPath: [program.strategicPillarId, program.categoryId, program.strategicGoalId, program.id],
                      newValue: newStatus,
                      type: 'program',
                    }),
                  })
                  if (!response.ok) throw new Error('Failed to update program status');
                  const updatedData = await response.json();
                  onDataUpdate(updatedData);
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function getCategoryColor(pillarName: string) {
  if (!pillarName) return "text-gray-500"

  switch (pillarName.toLowerCase()) {
    case "science & innovation":
      return "text-cyan-500"
    case "growth & ta leadership":
      return "text-pink-500"
    case "people & sustainability":
      return "text-pillar-lime"
    case "precision medicine":
      return "text-pillar-light-blue"
    case "pipeline acceleration":
      return "text-pillar-magenta"
    case "patient engagement":
      return "text-pillar-lime"
    default:
      return "text-gray-500"
  }
}

```

# components/status-circle.tsx

```tsx
import { useState, useRef } from "react"
import { StatusSelector } from "./status-selector"

interface StatusCircleProps {
  status?: string
  onStatusChange?: (newStatus: string | undefined) => void
}

export function StatusCircle({ status, onStatusChange }: StatusCircleProps) {
  const [showSelector, setShowSelector] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const circleRef = useRef<HTMLDivElement>(null)

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-gray-300"

    switch (status.toLowerCase()) {
      case "exceeded":
      case "blue":
        return "bg-blue-500"
      case "on-track":
      case "green":
        return "bg-green-500"
      case "delayed":
      case "amber":
        return "bg-yellow-500"
      case "missed":
      case "red":
        return "bg-red-500"
      default:
        return "bg-gray-300"
    }
  }

  const getStatusTooltip = (status?: string) => {
    if (!status) return "Not defined"
    return status
  }

  const handleClick = () => {
    if (onStatusChange && circleRef.current) {
      setAnchorRect(circleRef.current.getBoundingClientRect())
      setShowSelector(true)
    }
  }

  const handleStatusChange = (newStatus: string | undefined) => {
    if (onStatusChange) {
      onStatusChange(newStatus)
    }
  }

  return (
    <div className="relative">
      <div
        ref={circleRef}
        className={`w-6 h-6 rounded-full ${getStatusColor(status)} mx-auto cursor-pointer hover:ring-2 hover:ring-gray-400`}
        title={getStatusTooltip(status)}
        onClick={handleClick}
      />
      {showSelector && (
        <StatusSelector
          currentStatus={status}
          onStatusChange={handleStatusChange}
          onClose={() => setShowSelector(false)}
          anchorRect={anchorRect}
        />
      )}
    </div>
  )
}

```

# components/status-indicator.tsx

```tsx
export function StatusIndicator({ status }: { status?: string }) {
  const getStatusColor = () => {
    if (!status) return "bg-gray-300"

    switch (status) {
      case "exceeded":
        return "bg-blue-400"
      case "on-track":
        return "bg-green-500"
      case "delayed":
        return "bg-yellow-400"
      case "missed":
        return "bg-red-500"
      default:
        return "bg-gray-300"
    }
  }

  return <div className={`w-5 h-5 rounded-full ${getStatusColor()} flex-shrink-0`} title={status || "Not defined"}></div>
}

```

# components/status-selector.tsx

```tsx
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

interface StatusSelectorProps {
  currentStatus?: string
  onStatusChange: (newStatus: string | undefined) => void
  onClose: () => void
  anchorRect?: DOMRect | null
}

export function StatusSelector({ currentStatus, onStatusChange, onClose, anchorRect }: StatusSelectorProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(currentStatus)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null)

  const statusOptions = [
    { value: "exceeded", label: "Exceeded", color: "bg-blue-500" },
    { value: "on-track", label: "On Track", color: "bg-green-500" },
    { value: "delayed", label: "Delayed", color: "bg-yellow-500" },
    { value: "missed", label: "Missed", color: "bg-red-500" },
    { value: undefined, label: "Not Defined", color: "bg-gray-300" },
  ]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  // Position the dropdown near the triggering element
  useEffect(() => {
    if (anchorRect) {
      setDropdownPos({ top: anchorRect.bottom + window.scrollY, left: anchorRect.left + window.scrollX })
    } else {
      const parent = dropdownRef.current?.parentElement
      if (parent) {
        const rect = parent.getBoundingClientRect()
        setDropdownPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX })
      }
    }
  }, [anchorRect])

  const handleStatusSelect = (status: string | undefined) => {
    setSelectedStatus(status)
    onStatusChange(status)
    onClose()
  }

  const dropdown = (
    <div
      ref={dropdownRef}
      className="fixed z-[1000] mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
      style={dropdownPos ? { top: dropdownPos.top, left: dropdownPos.left } : {}}
    >
      <div className="py-1" role="menu" aria-orientation="vertical">
        {statusOptions.map((option) => (
          <button
            key={option.value || "undefined"}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${
              selectedStatus === option.value ? "bg-gray-50" : ""
            }`}
            onClick={() => handleStatusSelect(option.value)}
            role="menuitem"
          >
            <div className={`w-4 h-4 rounded-full ${option.color}`} />
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )

  if (typeof window === "undefined") return null
  return createPortal(dropdown, document.body)
} 
```

# components/theme-provider.tsx

```tsx
'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

```

# components/toast.tsx

```tsx
"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface ToastProps {
  message: string
  type?: "success" | "error" | "warning" | "info"
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Allow time for fade-out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
      case "warning":
        return "bg-yellow-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center p-4 mb-4 text-white rounded-md shadow-lg transition-opacity duration-300 ${getBackgroundColor()} ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="mr-3">{message}</div>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
        className="ml-auto text-white hover:text-gray-200"
      >
        <X size={18} />
      </button>
    </div>
  )
}

```

# components/ui/accordion.tsx

```tsx
"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }

```

# components/ui/alert-dialog.tsx

```tsx
"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}

```

# components/ui/alert.tsx

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }

```

# components/ui/aspect-ratio.tsx

```tsx
"use client"

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

const AspectRatio = AspectRatioPrimitive.Root

export { AspectRatio }

```

# components/ui/avatar.tsx

```tsx
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }

```

# components/ui/badge.tsx

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

```

# components/ui/breadcrumb.tsx

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className
    )}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      className={cn("transition-colors hover:text-foreground", className)}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-foreground", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:w-3.5 [&>svg]:h-3.5", className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}

```

# components/ui/button.tsx

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

```

# components/ui/calendar.tsx

```tsx
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

```

# components/ui/card.tsx

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

```

# components/ui/carousel.tsx

```tsx
"use client"

import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    )
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return
      }

      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }, [])

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev()
    }, [api])

    const scrollNext = React.useCallback(() => {
      api?.scrollNext()
    }, [api])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          scrollPrev()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          scrollNext()
        }
      },
      [scrollPrev, scrollNext]
    )

    React.useEffect(() => {
      if (!api || !setApi) {
        return
      }

      setApi(api)
    }, [api, setApi])

    React.useEffect(() => {
      if (!api) {
        return
      }

      onSelect(api)
      api.on("reInit", onSelect)
      api.on("select", onSelect)

      return () => {
        api?.off("select", onSelect)
      }
    }, [api, onSelect])

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute  h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}

```

# components/ui/chart.tsx

```tsx
"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}

```

# components/ui/checkbox.tsx

```tsx
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }

```

# components/ui/collapsible.tsx

```tsx
"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }

```

# components/ui/command.tsx

```tsx
"use client"

import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

const CommandDialog = ({ children, ...props }: DialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm"
    {...props}
  />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    {...props}
  />
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      className
    )}
    {...props}
  />
))

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}

```

# components/ui/context-menu.tsx

```tsx
"use client"

import * as React from "react"
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const ContextMenu = ContextMenuPrimitive.Root

const ContextMenuTrigger = ContextMenuPrimitive.Trigger

const ContextMenuGroup = ContextMenuPrimitive.Group

const ContextMenuPortal = ContextMenuPrimitive.Portal

const ContextMenuSub = ContextMenuPrimitive.Sub

const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup

const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </ContextMenuPrimitive.SubTrigger>
))
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName

const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
))
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName

const ContextMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>
))
ContextMenuCheckboxItem.displayName =
  ContextMenuPrimitive.CheckboxItem.displayName

const ContextMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.RadioItem>
))
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName

const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold text-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
))
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName

const ContextMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
ContextMenuShortcut.displayName = "ContextMenuShortcut"

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}

```

# components/ui/dialog.tsx

```tsx
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}

```

# components/ui/drawer.tsx

```tsx
"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}

```

# components/ui/dropdown-menu.tsx

```tsx
"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}

```

# components/ui/editable-field.tsx

```tsx
import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface EditableFieldProps {
  value: string
  onSave: (newValue: string) => Promise<void>
  type?: "text" | "textarea"
  className?: string
  placeholder?: string
}

export function EditableField({
  value,
  onSave,
  type = "text",
  className,
  placeholder,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) {
        e.preventDefault()
        setIsEditing(true)
      }
    }

    document.addEventListener("contextmenu", handleContextMenu)
    return () => document.removeEventListener("contextmenu", handleContextMenu)
  }, [])

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setEditValue(value)
    }
  }

  if (isEditing) {
    const InputComponent = type === "textarea" ? Textarea : Input
    return (
      <div ref={containerRef} className={cn("relative", className)}>
        <InputComponent
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isSaving}
          placeholder={placeholder}
          className="w-full"
          autoFocus
        />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "cursor-pointer hover:bg-gray-50 rounded px-2 py-1",
        className
      )}
    >
      {value || placeholder}
    </div>
  )
} 
```

# components/ui/form.tsx

```tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}

```

# components/ui/hover-card.tsx

```tsx
"use client"

import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }

```

# components/ui/input-otp.tsx

```tsx
"use client"

import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Dot />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }

```

# components/ui/input.tsx

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

```

# components/ui/label.tsx

```tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }

```

# components/ui/menubar.tsx

```tsx
"use client"

import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const MenubarMenu = MenubarPrimitive.Menu

const MenubarGroup = MenubarPrimitive.Group

const MenubarPortal = MenubarPrimitive.Portal

const MenubarSub = MenubarPrimitive.Sub

const MenubarRadioGroup = MenubarPrimitive.RadioGroup

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-10 items-center space-x-1 rounded-md border bg-background p-1",
      className
    )}
    {...props}
  />
))
Menubar.displayName = MenubarPrimitive.Root.displayName

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      className
    )}
    {...props}
  />
))
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </MenubarPrimitive.SubTrigger>
))
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName

const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(
  (
    { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
    ref
  ) => (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>
  )
)
MenubarContent.displayName = MenubarPrimitive.Content.displayName

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarItem.displayName = MenubarPrimitive.Item.displayName

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
))
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName

const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
))
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName

const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarLabel.displayName = MenubarPrimitive.Label.displayName

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName

const MenubarShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
MenubarShortcut.displayname = "MenubarShortcut"

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
}

```

# components/ui/navigation-menu.tsx

```tsx
import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn(
      "relative z-10 flex max-w-max flex-1 items-center justify-center",
      className
    )}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
))
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      className
    )}
    {...props}
  />
))
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

const NavigationMenuItem = NavigationMenuPrimitive.Item

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
)

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}{" "}
    <ChevronDown
      className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
))
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto ",
      className
    )}
    {...props}
  />
))
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName

const NavigationMenuLink = NavigationMenuPrimitive.Link

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className={cn("absolute left-0 top-full flex justify-center")}>
    <NavigationMenuPrimitive.Viewport
      className={cn(
        "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]",
        className
      )}
      ref={ref}
      {...props}
    />
  </div>
))
NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName

const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className
    )}
    {...props}
  >
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
  </NavigationMenuPrimitive.Indicator>
))
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
}

```

# components/ui/pagination.tsx

```tsx
import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}

```

# components/ui/popover.tsx

```tsx
"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }

```

# components/ui/progress.tsx

```tsx
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }

```

# components/ui/radio-group.tsx

```tsx
"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }

```

# components/ui/resizable.tsx

```tsx
"use client"

import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }

```

# components/ui/scroll-area.tsx

```tsx
"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }

```

# components/ui/select.tsx

```tsx
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}

```

# components/ui/separator.tsx

```tsx
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }

```

# components/ui/sheet.tsx

```tsx
"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}

```

# components/ui/sidebar.tsx

```tsx
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar:state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
      [setOpenProp, open]
    )

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open)
    }, [isMobile, setOpen, setOpenMobile])

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div
          className={cn(
            "duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
          )}
        />
        <div
          className={cn(
            "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            // Adjust the padding for floating and inset variants.
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
          >
            {children}
          </div>
        </div>
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  )
})
SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-background",
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
        className
      )}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className
      )}
      {...props}
    />
  )
})
SidebarInput.displayName = "SidebarInput"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn("w-full text-sm", className)}
    {...props}
  />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { isMobile, state } = useSidebar()

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    )

    if (!tooltip) {
      return button
    }

    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip,
      }
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== "collapsed" || isMobile}
          {...tooltip}
        />
      </Tooltip>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    showOnHover?: boolean
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="menu-badge"
    className={cn(
      "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none",
      "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
      "peer-data-[size=sm]/menu-button:top-1",
      "peer-data-[size=default]/menu-button:top-1.5",
      "peer-data-[size=lg]/menu-button:top-2.5",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean
  }
>(({ className, showIcon = false, ...props }, ref) => {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("rounded-md h-8 flex gap-2 px-2 items-center", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 flex-1 max-w-[--skeleton-width]"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
})
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
      "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => <li ref={ref} {...props} />)
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean
    size?: "sm" | "md"
    isActive?: boolean
  }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}

```

# components/ui/skeleton.tsx

```tsx
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }

```

# components/ui/slider.tsx

```tsx
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }

```

# components/ui/sonner.tsx

```tsx
"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

```

# components/ui/switch.tsx

```tsx
"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }

```

# components/ui/table.tsx

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

```

# components/ui/tabs.tsx

```tsx
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

```

# components/ui/textarea.tsx

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }

```

# components/ui/toast.tsx

```tsx
"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}

```

# components/ui/toaster.tsx

```tsx
"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

```

# components/ui/toggle-group.tsx

```tsx
"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }

```

# components/ui/toggle.tsx

```tsx
"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 gap-2",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-3 min-w-10",
        sm: "h-9 px-2.5 min-w-9",
        lg: "h-11 px-5 min-w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }

```

# components/ui/tooltip.tsx

```tsx
"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

```

# components/ui/use-mobile.tsx

```tsx
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

```

# components/ui/use-toast.ts

```ts
"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }

```

# config.ts

```ts
export const config = {
  csvFilePath: process.env.CSV_FILE_PATH || 'data/DummyData.csv'
} 
```

# data/Category-status-comments.csv

```csv
﻿CategoryID,StrategicPillarID,Category,Status,Comments,,,,,,,,
Cat100,SPill100,Biomarker Discovery,Red,Comprehensive biomarker validation and discovery platform requiring robust study designs, cross-functional coordination, and advanced analytics capabilities. Success depends on establishing standardized protocols, regulatory-grade validation criteria, and integrated data management systems across genomics and single-cell platforms. Critical focus areas include patient cohort identification, statistical analysis planning, and regulatory pathway alignment for clinical translation.,,
Cat101,SPill100,Targeted Therapies,Amber,Advanced therapeutic development portfolio spanning kinase inhibitors, bispecific antibodies, and AI-powered target selection requiring specialized expertise and comprehensive execution planning. Success factors include molecular target validation, manufacturing scalability, competitive landscape analysis, and cross-functional collaboration between computational and biological teams. Strategic emphasis on protocol standardization, regulatory strategy development, and clinical translation pathways.,
Cat102,SPill100,Companion Diagnostics,Red,Integrated diagnostic development program focusing on therapy-diagnostic co-development, NGS panel regulatory approval, and assay standardization requiring strong regulatory strategy and vendor partnerships. Critical success factors include FDA interaction planning, clinical validation studies, manufacturing considerations, and seamless integration with therapeutic programs. Emphasis on protocol finalization, regulatory compliance, and clinical utility demonstration for market approval.,
Cat103,SPill101,Early Clinical Development,Green,Process optimization and innovation initiative targeting IND cycle time reduction, adaptive trial designs, and first-in-human network expansion requiring operational excellence and regulatory efficiency improvements. Success depends on cross-functional coordination, statistical methodology advancement, site qualification, and investigator engagement strategies. Key focus areas include bottleneck identification, process standardization, and regulatory pathway optimization for accelerated development timelines.,
Cat104,SPill101,Regulatory Affairs,Green,Global regulatory harmonization and agency engagement strategy requiring comprehensive execution planning, cross-regional coordination, and manufacturing readiness enhancement. Critical success factors include milestone tracking, stakeholder relationship management, regulatory intelligence, and CMC compliance across multiple jurisdictions. Strategic emphasis on filing efficiency, agency communication, quality systems development, and leadership endorsement for harmonization objectives.
Cat105,SPill101,Digital Trial Innovation,Green,Technology-driven platform deployment focusing on decentralized trials, wearables integration, and data capture automation requiring specialized technical expertise and infrastructure development. Success factors include platform scalability, user adoption, data quality assurance, and clinical integration capabilities. Key implementation considerations include technology validation, workflow optimization, regulatory acceptance, and patient engagement through digital innovation.
Cat106,SPill102,Real-World Evidence,Amber,Comprehensive evidence generation platform encompassing registry development, comparative effectiveness studies, and EHR data integration requiring robust data governance and analytical capabilities. Critical success factors include patient recruitment strategies, data quality assurance, statistical methodology, and regulatory-grade evidence generation. Strategic focus on community partnerships, data standardization, signal detection capabilities, and clinical utility demonstration for regulatory acceptance.
Cat107,SPill102,Access & Equity,Red,Patient-centered initiatives targeting minority enrollment enhancement and financial assistance programs requiring community engagement expertise and comprehensive support strategies. Success depends on cultural competency development, protocol accessibility, community partnerships, and program design optimization. Key focus areas include outreach effectiveness, eligibility criteria development, patient support infrastructure, and enrollment retention strategies for diverse patient populations.,,
```

# data/DummyData.csv

```csv
StrategicProgramID,StrategicGoalID,CategoryID,StrategicPillarID,Strategic Program,Q1 Objective,Q2 Objective,Q3 Objective,Q4 Objective,ORD LT Sponsor(s),Sponsor(s)/Lead(s),Reporting owner(s),Q1 Status,Q2 Status,Q3 Status,Q4 Status,Q1 Comments,Q2 Comments,Q3 Comments,Q4 Comments
SP100,SG100,Cat100,SPill100,Another change.,In Q1 we will launch the BD-01 Validate Initiative 1 project in support of the strategic goal to validate novel predictive biomarkers. This involves assembling the core team, finalizing the detailed project charter, and securing cross‑functional commitment. An early engagement with clinical teams will ensure downstream study readiness.,Achieve 50% of planned experiments for BD-01 Validate Initiative 1.,Complete data analysis phase of BD-01 Validate Initiative 1.,Submit year‑end review and next‑year plan for BD-01 Validate Initiative 1.,Dr. Alice Nguyen,on-track,exceeded,,exceeded,Critical biomarker validation initiative requiring robust study design and cross-functional team coordination. Success depends on establishing clear validation criteria and patient cohort identification protocols.,,,
SP101,SG101,Cat100,SPill100,Change.,In Q1 we will launch the BD-02 Validate Initiative 2 project in support of the strategic goal to validate novel predictive biomarkers. Key deliverables include drafting protocols, outlining resource requirements, and obtaining governance approval. Vendor assessments will be completed to decide on any external partnerships needed.,Achieve 50% of planned experiments for BD-02 Validate Initiative 2.,Complete data analysis phase of BD-02 Validate Initiative 2.,Submit year‑end review and next‑year plan for BD-02 Validate Initiative 2.,Dr. Alice Nguyen,exceeded,exceeded,delayed,,Second phase biomarker validation project building on BD-01 learnings. Focus on protocol standardization and data quality assurance will be essential for regulatory acceptance.,,,
SP102,SG101,Cat100,SPill100,BD-03 Validate Initiative 3,In Q1 we will launch the BD-03 Validate Initiative 3 project in support of the strategic goal to validate novel predictive biomarkers. Key deliverables include drafting protocols, outlining resource requirements, and obtaining governance approval. We will set up a dashboard to track milestones and provide transparent real‑time updates. By quarter close, we expect to have a resourced, scheduled, and risk‑assessed plan endorsed by sponsors.,Achieve 50% of planned experiments for BD-03 Validate Initiative 3.,exceeded,,,,Comprehensive biomarker validation program requiring integrated approach across discovery platforms. Protocol development and statistical analysis plan will be key deliverables for regulatory pathway.,,,
SP103,SG102,Cat100,SPill100,BD-04 Expand Initiative 4,In Q1 we will launch the BD-04 Expand Initiative 4 project in support of the strategic goal to expand tumor genomics database. Key deliverables include drafting protocols, outlining resource requirements, and obtaining governance approval. We will set up a dashboard to track milestones and provide transparent real‑time updates. Our stretch goal is to initiate early pilot work so that data is available for Q2 decision gates.,Achieve 50% of planned experiments for BD-04 Expand Initiative 4.,Complete data analysis phase of BD-04 Expand Initiative 4.,Submit year‑end review and next‑year plan for BD-04 Expand Initiative 4.,Dr. Alice Nguyen,Green,exceeded,,,Database expansion initiative leveraging existing genomics infrastructure. Success requires robust data governance framework and integration with existing clinical datasets.,,,
SP104,SG102,Cat100,SPill100,BD-05 Expand Initiative 5,In Q1 we will launch the BD-05 Expand Initiative 5 project in support of the strategic goal to expand tumor genomics database. This involves assembling the core team, finalizing the detailed project charter, and securing cross‑functional commitment. We will set up a dashboard to track milestones and provide transparent real‑time updates.,Achieve 50% of planned experiments for BD-05 Expand Initiative 5.,Complete data analysis phase of BD-05 Expand Initiative 5.,Submit year‑end review and next‑year plan for BD-05 Expand Initiative 5.,Dr. Alice Nguyen,Green,,,,Large-scale genomics database project requiring significant computational resources and data management capabilities. Team assembly and technical infrastructure planning will be critical for execution.,,,
SP105,SG102,Cat100,SPill100,BD-06 Expand Initiative 6,In Q1 we will launch the BD-06 Expand Initiative 6 project in support of the strategic goal to expand tumor genomics database. We will host a series of workshops to solidify scope, clarify success metrics, and map dependencies. Risks and mitigation strategies will be documented early to ensure the program remains on track.,Achieve 50% of planned experiments for BD-06 Expand Initiative 6.,Complete data analysis phase of BD-06 Expand Initiative 6.,Submit year‑end review and next‑year plan for BD-06 Expand Initiative 6.,Dr. Alice Nguyen,Red,,,,Advanced genomics expansion program requiring workshop-driven scope definition. Technical feasibility and resource allocation discussions will guide implementation strategy.,,,
SP106,SG103,Cat100,SPill100,BD-07 Advance Initiative 7,In Q1 we will launch the BD-07 Advance Initiative 7 project in support of the strategic goal to advance single‑cell analytics platform. Key deliverables include drafting protocols, outlining resource requirements, and obtaining governance approval. Vendor assessments will be completed to decide on any external partnerships needed. Our stretch goal is to initiate early pilot work so that data is available for Q2 decision gates.,Achieve 50% of planned experiments for BD-07 Advance Initiative 7.,Complete data analysis phase of BD-07 Advance Initiative 7.,Submit year‑end review and next‑year plan for BD-07 Advance Initiative 7.,Dr. Alice Nguyen,Green,,,,Next-generation single-cell platform implementation requiring specialized technical expertise. Protocol development will focus on standardization and reproducibility across research applications.,,,
SP107,SG103,Cat100,SPill100,BD-08 Advance Initiative 8,In Q1 we will launch the BD-08 Advance Initiative 8 project in support of the strategic goal to advance single‑cell analytics platform. Key deliverables include drafting protocols, outlining resource requirements, and obtaining governance approval. An early engagement with clinical teams will ensure downstream study readiness. Quarter‑end exit criteria include a locked protocol, budget sign‑off, and an agreed set of KPIs.,Achieve 50% of planned experiments for BD-08 Advance Initiative 8.,Complete data analysis phase of BD-08 Advance Initiative 8.,Green,,,,Advanced analytics platform deployment building on existing single-cell capabilities. Technical protocols and validation studies will be essential for platform adoption.,,,
SP108,SG103,Cat100,SPill100,BD-09 Advance Initiative 9,In Q1 we will launch the BD-09 Advance Initiative 9 project in support of the strategic goal to advance single‑cell analytics platform. This involves assembling the core team, finalizing the detailed project charter, and securing cross‑functional commitment. We will set up a dashboard to track milestones and provide transparent real‑time updates. Quarter‑end exit criteria include a locked protocol, budget sign‑off, and an agreed set of KPIs.,Achieve 50% of planned experiments for BD-09 Advance Initiative 9.,Complete data analysis phase of BD-09 Advance Initiative 9.,Green,,,,Comprehensive single-cell analytics initiative requiring dedicated team formation. Platform integration and user training will be key success factors for widespread adoption.,,,
SP109,SG104,Cat101,SPill100,TT-10 Optimize Initiative 10,In Q1 we will launch the TT-10 Optimize Initiative 10 project in support of the strategic goal to optimize next‑gen kinase inhibitors. The kick‑off will culminate in a signed execution plan and a communication roll‑out to all contributors. Risks and mitigation strategies will be documented early to ensure the program remains on track. Success for Q1 will be measured by completion of the scoped deliverables and endorsement from the Oncology R&D Leadership Team.,Achieve 50% of planned experiments for TT-10 Optimize Initiative 10.,Complete data analysis phase of TT-10 Optimize Initiative 10.,Submit year‑end review and next‑year plan for TT-10 Optimize Initiative 10.,Dr. Michael Rossi,Lucas Thomas,Charlotte Hernandez,Green,,,,Advanced kinase inhibitor optimization program with comprehensive execution planning. Risk mitigation strategies and leadership endorsement will be critical for maintaining program momentum and achieving quarterly milestones.,,,
SP110,SG104,Cat101,SPill100,TT-11 Optimize Initiative 11,In Q1 we will launch the TT-11 Optimize Initiative 11 project in support of the strategic goal to optimize next‑gen kinase inhibitors. We will host a series of workshops to solidify scope, clarify success metrics, and map dependencies. Initial experiments or data pulls will begin by the end of the quarter to validate feasibility. Quarter‑end exit criteria include a locked protocol, budget sign‑off, and an agreed set of KPIs.,Achieve 50% of planned experiments for TT-11 Optimize Initiative 11.,Complete data analysis phase of TT-11 Optimize Initiative 11.,Green,,,,Kinase inhibitor development project requiring workshop-based scope refinement. Technical feasibility and competitive landscape analysis will guide development priorities.,,,
SP111,SG104,Cat101,SPill100,TT-12 Optimize Initiative 12,In Q1 we will launch the TT-12 Optimize Initiative 12 project in support of the strategic goal to optimize next‑gen kinase inhibitors. Our immediate focus will be to refine the scientific plan, align timelines with stakeholders, and allocate budget. Vendor assessments will be completed to decide on any external partnerships needed. By quarter close, we expect to have a resourced, scheduled, and risk‑assessed plan endorsed by sponsors.,Achieve 50% of planned experiments for TT-12 Optimize Initiative 12.,Green,,,,Strategic kinase inhibitor program focusing on scientific plan optimization. Molecular target validation and lead compound selection will be key decision points.,,,
SP112,SG105,Cat101,SPill100,TT-13 Develop Initiative 13,In Q1 we will launch the TT-13 Develop Initiative 13 project in support of the strategic goal to develop bispecific antibodies portfolio. This involves assembling the core team, finalizing the detailed project charter, and securing cross‑functional commitment. Initial experiments or data pulls will begin by the end of the quarter to validate feasibility. Completion of training for all contributors is also targeted within this timeframe.,Achieve 50% of planned experiments for TT-13 Develop Initiative 13.,Complete data analysis phase of TT-13 Develop Initiative 13.,Submit year‑end review and next‑year plan for TT-13 Develop Initiative 13.,Dr. Michael Rossi,Amber,,,,Bispecific antibody portfolio development requiring specialized immunology expertise. Team formation and technical platform establishment will be foundational for program success.,,,
SP113,SG105,Cat101,SPill100,TT-14 Develop Initiative 14,In Q1 we will launch the TT-14 Develop Initiative 14 project in support of the strategic goal to develop bispecific antibodies portfolio. Key deliverables include drafting protocols, outlining resource requirements, and obtaining governance approval. Vendor assessments will be completed to decide on any external partnerships needed.,Achieve 50% of planned experiments for TT-14 Develop Initiative 14.,Complete data analysis phase of TT-14 Develop Initiative 14.,Submit year‑end review and next‑year plan for TT-14 Develop Initiative 14.,Dr. Michael Rossi,Green,,,,Advanced bispecific antibody program focusing on protocol standardization and development timelines. Manufacturing considerations and regulatory strategy will guide implementation approach.,,,
SP114,SG105,Cat101,SPill100,TT-15 Develop Initiative 15,In Q1 we will launch the TT-15 Develop Initiative 15 project in support of the strategic goal to develop bispecific antibodies portfolio. Key deliverables include drafting protocols, outlining resource requirements, and obtaining governance approval. Vendor assessments will be completed to decide on any external partnerships needed. By quarter close, we expect to have a resourced, scheduled, and risk‑assessed plan endorsed by sponsors.,Achieve 50% of planned experiments for TT-15 Develop Initiative 15.,Green,,,,Comprehensive bispecific development initiative requiring robust protocol framework. Clinical translation pathway and manufacturing scalability will be critical success factors.,,,
SP115,SG106,Cat101,SPill100,TT-16 Integrate Initiative 16,In Q1 we will launch the TT-16 Integrate Initiative 16 project in support of the strategic goal to integrate ai for target selection. We will host a series of workshops to solidify scope, clarify success metrics, and map dependencies. Initial experiments or data pulls will begin by the end of the quarter to validate feasibility.,Achieve 50% of planned experiments for TT-16 Integrate Initiative 16.,Complete data analysis phase of TT-16 Integrate Initiative 16.,Submit year‑end review and next‑year plan for TT-16 Integrate Initiative 16.,Dr. Michael Rossi,Green,,,,AI-powered target selection platform requiring interdisciplinary collaboration between computational and biological teams. Workshop outcomes will define technical specifications and validation approaches.,,,
SP116,SG106,Cat101,SPill100,TT-17 Integrate Initiative 17,In Q1 we will launch the TT-17 Integrate Initiative 17 project in support of the strategic goal to integrate ai for target selection. Key deliverables include drafting protocols, outlining resource requirements, and obtaining governance approval. Initial experiments or data pulls will begin by the end of the quarter to validate feasibility. Success for Q1 will be measured by completion of the scoped deliverables and endorsement from the Oncology R&D Leadership Team.,Achieve 50% of planned experiments for TT-17 Integrate Initiative 17.,Complete data analysis phase of TT-17 Integrate Initiative 17.,Submit year‑end review and next‑year plan for TT-17 Integrate Initiative 17.,Dr. Michael Rossi,Green,,,,Machine learning integration project for target identification and validation. Protocol development will focus on data integration and algorithmic validation approaches.,,,
SP117,SG106,Cat101,SPill100,TT-18 Integrate Initiative 18,In Q1 we will launch the TT-18 Integrate Initiative 18 project in support of the strategic goal to integrate ai for target selection. We will host a series of workshops to solidify scope, clarify success metrics, and map dependencies. We will set up a dashboard to track milestones and provide transparent real‑time updates. Our stretch goal is to initiate early pilot work so that data is available for Q2 decision gates.,Achieve 50% of planned experiments for TT-18 Integrate Initiative 18.,Complete data analysis phase of TT-18 Integrate Initiative 18.,Submit year‑end review and next‑year plan for TT-18 Integrate Initiative 18.,Dr. Michael Rossi,Green,,,,Strategic AI implementation program requiring scope clarification through structured workshops. Technology platform selection and validation criteria will guide implementation strategy.,,,
SP118,SG107,Cat102,SPill100,CDX-19 Co‑develop Initiative 19,In Q1 we will launch the CDX-19 Co‑develop Initiative 19 project in support of the strategic goal to co‑develop cdx assays with therapy programs. The kick‑off will culminate in a signed execution plan and a communication roll‑out to all contributors. Vendor assessments will be completed to decide on any external partnerships needed. Quarter‑end exit criteria include a locked protocol, budget sign‑off, and an agreed set of KPIs.,Achieve 50% of planned experiments for CDX-19 Co‑develop Initiative 19.,Complete data analysis phase of CDX-19 Co‑develop Initiative 19.,Submit year‑end review and next‑year plan for CDX-19 Co‑develop Initiative 19.,Dr. Priya Desai,Green,,,,Companion diagnostic co-development program with comprehensive execution planning and vendor partnerships. Protocol finalization and regulatory alignment will be critical for successful therapy-diagnostic integration.,,,
SP119,SG107,Cat102,SPill100,CDX-20 Co‑develop Initiative 20,In Q1 we will launch the CDX-20 Co‑develop Initiative 20 project in support of the strategic goal to co‑develop cdx assays with therapy programs. This involves assembling the core team, finalizing the detailed project charter, and securing cross‑functional commitment. Initial experiments or data pulls will begin by the end of the quarter to validate feasibility.,Achieve 50% of planned experiments for CDX-20 Co‑develop Initiative 20.,Complete data analysis phase of CDX-20 Co‑develop Initiative 20.,Submit year‑end review and next‑year plan for CDX-20 Co‑develop Initiative 20.,Dr. Priya Desai,Green,,,,CDx assay development initiative requiring core team establishment and technical platform selection. Regulatory strategy and clinical trial integration will be key planning elements.,,,
SP120,SG107,Cat102,SPill100,CDX-21 Co‑develop Initiative 21,In Q1 we will launch the CDX-21 Co‑develop Initiative 21 project in support of the strategic goal to co‑develop cdx assays with therapy programs. Key deliverables include drafting protocols, outlining resource requirements, and obtaining governance approval. Vendor assessments will be completed to decide on any external partnerships needed.,Achieve 50% of planned experiments for CDX-21 Co‑develop Initiative 21.,Complete data analysis phase of CDX-21 Co‑develop Initiative 21.,Submit year‑end review and next‑year plan for CDX-21 Co‑develop Initiative 21.,Dr. Priya Desai,Green,,,,Companion diagnostic protocol development focusing on assay standardization and validation criteria. Clinical utility demonstration will be essential for regulatory approval pathway.,,,
SP121,SG108,Cat102,SPill100,CDX-22 Obtain Initiative 22,In Q1 we will launch the CDX-22 Obtain Initiative 22 project in support of the strategic goal to obtain fda clearance for ngs panel. We will host a series of workshops to solidify scope, clarify success metrics, and map dependencies. Risks and mitigation strategies will be documented early to ensure the program remains on track.,Achieve 50% of planned experiments for CDX-22 Obtain Initiative 22.,Complete data analysis phase of CDX-22 Obtain Initiative 22.,Submit year‑end review and next‑year plan for CDX-22 Obtain Initiative 22.,Dr. Priya Desai,Amber,,,,FDA clearance initiative for NGS panel requiring workshop-driven scope definition. Regulatory strategy development and clinical validation planning will be critical success factors.,,,
SP122,SG108,Cat102,SPill100,CDX-23 Obtain Initiative 23,In Q1 we will launch the CDX-23 Obtain Initiative 23 project in support of the strategic goal to obtain fda clearance for ngs panel. Key deliverables include drafting protocols, outlining resource requirements, and obtaining governance approval. An early engagement with clinical teams will ensure downstream study readiness.,Achieve 50% of planned experiments for CDX-23 Obtain Initiative 23.,Complete data analysis phase of CDX-23 Obtain Initiative 23.,Submit year‑end review and next‑year plan for CDX-23 Obtain Initiative 23.,Dr. Priya Desai,Amber,,,,NGS panel regulatory approval program focusing on protocol development and validation studies. FDA interaction strategy and clinical evidence generation will guide implementation approach.,,,
SP123,SG108,Cat102,SPill100,CDX-24 Obtain Initiative 24,In Q1 we will launch the CDX-24 Obtain Initiative 24 project in support of the strategic goal to obtain fda clearance for ngs panel. Our immediate focus will be to refine the scientific plan, align timelines with stakeholders, and allocate budget. Risks and mitigation strategies will be documented early to ensure the program remains on track. Success for Q1 will be measured by completion of the scoped deliverables and endorsement from the Oncology R&D Leadership Team.,Achieve 50% of planned experiments for CDX-24 Obtain Initiative 24.,Complete data analysis phase of CDX-24 Obtain Initiative 24.,Submit year‑end review and next‑year plan for CDX-24 Obtain Initiative 24.,Dr. Priya Desai,Green,,,,Comprehensive NGS clearance initiative requiring scientific plan refinement and regulatory pathway optimization. Clinical validation studies and manufacturing considerations will be key deliverables.,,,
SP124,SG109,Cat103,SPill101,ECD-25 Reduce Initiative 25,In Q1 we will launch the ECD-25 Reduce Initiative 25 project in support of the strategic goal to reduce ind cycle time by 20%. This involves assembling the core team, finalizing the detailed project charter, and securing cross‑functional commitment. Initial experiments or data pulls will begin by the end of the quarter to validate feasibility. Completion of training for all contributors is also targeted within this timeframe.,Achieve 50% of planned experiments for ECD-25 Reduce Initiative 25.,Complete data analysis phase of ECD-25 Reduce Initiative 25.,Submit year‑end review and next‑year plan for ECD-25 Reduce Initiative 25.,Dr. James Carter,Green,,,,IND cycle time reduction initiative requiring core team formation and process optimization analysis. Regulatory efficiency improvements and cross-functional coordination will be key success metrics.,,,
SP125,SG109,Cat103,SPill101,ECD-26 Reduce Initiative 26,In Q1 we will launch the ECD-26 Reduce Initiative 26 project in support of the strategic goal to reduce ind cycle time by 20%. We will host a series of workshops to solidify scope, clarify success metrics, and map dependencies. Vendor assessments will be completed to decide on any external partnerships needed. Quarter‑end exit criteria include a locked protocol, budget sign‑off, and an agreed set of KPIs.,Achieve 50% of planned experiments for ECD-26 Reduce Initiative 26.,Complete data analysis phase of ECD-26 Reduce Initiative 26.,Green,,,,Process improvement program focusing on IND timeline optimization through workshop-based problem solving. Bottleneck identification and resource allocation will guide implementation strategy.,,,
SP126,SG109,Cat103,SPill101,ECD-27 Reduce Initiative 27,In Q1 we will launch the ECD-27 Reduce Initiative 27 project in support of the strategic goal to reduce ind cycle time by 20%. Our immediate focus will be to refine the scientific plan, align timelines with stakeholders, and allocate budget. Initial experiments or data pulls will begin by the end of the quarter to validate feasibility.,Achieve 50% of planned experiments for ECD-27 Reduce Initiative 27.,Complete data analysis phase of ECD-27 Reduce Initiative 27.,Submit year‑end review and next‑year plan for ECD-27 Reduce Initiative 27.,Dr. James Carter,Green,,,,Strategic IND acceleration initiative requiring scientific plan refinement and process standardization. Regulatory pathway optimization and timeline compression will be primary objectives.,,,
SP127,SG109,Cat103,SPill101,ECD-28 Reduce Initiative 28,In Q1 we will launch the ECD-28 Reduce Initiative 28 project in support of the strategic goal to reduce ind cycle time by 20%. Key deliverables include drafting protocols, outlining resource requirements, and obtaining governance approval. An early engagement with clinical teams will ensure downstream study readiness. Success for Q1 will be measured by completion of the scoped deliverables and endorsement from the Oncology R&D Leadership Team.,Achieve 50% of planned experiments for ECD-28 Reduce Initiative 28.,Complete data analysis phase of ECD-28 Reduce Initiative 28.,Submit year‑end review and next‑year plan for ECD-28 Reduce Initiative 28.,Dr. James Carter,Red,,,,IND efficiency program focusing on protocol development and regulatory submission optimization. Process standardization and quality assurance will be critical for timeline reduction goals.,,,
SP128,SG110,Cat103,SPill101,ECD-29 Implement Initiative 29,In Q1 we will launch the ECD-29 Implement Initiative 29 project in support of the strategic goal to implement adaptive trial designs. Our immediate focus will be to refine the scientific plan, align timelines with stakeholders, and allocate budget. Initial experiments or data pulls will begin by the end of the quarter to validate feasibility.,Achieve 50% of planned experiments for ECD-29 Implement Initiative 29.,Complete data analysis phase of ECD-29 Implement Initiative 29.,Submit year‑end review and next‑year plan for ECD-29 Implement Initiative 29.,Dr. James Carter,Green,,,,Adaptive trial design implementation requiring scientific plan development and statistical methodology refinement. Regulatory acceptance and operational feasibility will be key implementation challenges.,,,
SP129,SG110,Cat103,SPill101,ECD-30 Implement Initiative 30,In Q1 we will launch the ECD-30 Implement Initiative 30 project in support of the strategic goal to implement adaptive trial designs. This involves assembling the core team, finalizing the detailed project charter, and securing cross‑functional commitment. An early engagement with clinical teams will ensure downstream study readiness.,Achieve 50% of planned experiments for ECD-30 Implement Initiative 30.,Complete data analysis phase of ECD-30 Implement Initiative 30.,Submit year‑end review and next‑year plan for ECD-30 Implement Initiative 30.,Dr. James Carter,Green,,,,Advanced trial design initiative requiring specialized statistical expertise and core team assembly. Protocol flexibility and regulatory alignment will be essential for successful implementation.,,,
SP130,SG110,Cat103,SPill101,ECD-31 Implement Initiative 31,In Q1 we will launch the ECD-31 Implement Initiative 31 project in support of the strategic goal to implement adaptive trial designs. Key deliverables include drafting protocols, outlining resource requirements, and obtaining governance approval. Risks and mitigation strategies will be documented early to ensure the program remains on track. Quarter‑end exit criteria include a locked protocol, budget sign‑off, and an agreed set of KPIs.,Achieve 50% of planned experiments for ECD-31 Implement Initiative 31.,Complete data analysis phase of ECD-31 Implement Initiative 31.,Green,,,,Comprehensive adaptive design program focusing on protocol standardization and regulatory strategy. Statistical innovation and operational execution will be critical success factors.,,,
SP131,SG111,Cat103,SPill101,ECD-32 Expand Initiative 32,In Q1 we will launch the ECD-32 Expand Initiative 32 project in support of the strategic goal to expand first‑in‑human trial network. Our immediate focus will be to refine the scientific plan, align timelines with stakeholders, and allocate budget. An early engagement with clinical teams will ensure downstream study readiness. Completion of training for all contributors is also targeted within this timeframe.,Achieve 50% of planned experiments for ECD-32 Expand Initiative 32.,Complete data analysis phase of ECD-32 Expand Initiative 32.,Submit year‑end review and next‑year plan for ECD-32 Expand Initiative 32.,Dr. James Carter,Green,,,,Trial network expansion initiative requiring scientific plan optimization and site identification strategies. Geographic coverage and investigator engagement will be key expansion metrics.,,,
SP132,SG111,Cat103,SPill101,ECD-33 Expand Initiative 33,In Q1 we will launch the ECD-33 Expand Initiative 33 project in support of the strategic goal to expand first‑in‑human trial network. Key deliverables include drafting protocols, outlining resource requirements, and obtaining governance approval. An early engagement with clinical teams will ensure downstream study readiness. Completion of training for all contributors is also targeted within this timeframe.,Achieve 50% of planned experiments for ECD-33 Expand Initiative 33.,Complete data analysis phase of ECD-33 Expand Initiative 33.,Submit year‑end review and next‑year plan for ECD-33 Expand Initiative 33.,Dr. James Carter,Green,,,,First-in-human network development focusing on protocol standardization and site qualification criteria. Investigator training and regulatory alignment will be essential for network success.,,,
SP133,SG111,Cat103,SPill101,ECD-34 Expand Initiative 34,In Q1 we will launch the ECD-34 Expand Initiative 34 project in support of the strategic goal to expand first‑in‑human trial network. We will host a series of workshops to solidify scope, clarify success metrics, and map dependencies. Initial experiments or data pulls will begin by the end of the quarter to validate feasibility. Quarter‑end exit criteria include a locked protocol, budget sign‑off, and an agreed set of KPIs.,Achieve 50% of planned experiments for ECD-34 Expand Initiative 34.,Complete data analysis phase of ECD-34 Expand Initiative 34.,Green,,,,Comprehensive trial network expansion requiring workshop-driven scope definition and implementation planning. Site selection criteria and operational excellence will guide network development.,,,
SP134,SG112,Cat104,SPill101,RA-35 Harmonize Initiative 35,In Q1 we will launch the RA-35 Harmonize Initiative 35 project in support of the strategic goal to harmonize global filings. The kick‑off will culminate in a signed execution plan and a communication roll‑out to all contributors. We will set up a dashboard to track milestones and provide transparent real‑time updates. Success for Q1 will be measured by completion of the scoped deliverables and endorsement from the Oncology R&D Leadership Team.,Achieve 50% of planned experiments for RA-35 Harmonize Initiative 35.,Complete data analysis phase of RA-35 Harmonize Initiative 35.,Submit year‑end review and next‑year plan for RA-35 Harmonize Initiative 35.,Dr. Sophia Hernandez,Isabella Anderson,Olivia Lopez,Green,,,,Global regulatory harmonization program with comprehensive execution planning and milestone tracking dashboard. Leadership endorsement and cross-regional coordination will be critical for achieving harmonization objectives.,,,
SP135,SG112,Cat104,SPill101,RA-36 Harmonize Initiative 36,In Q1 we will launch the RA-36 Harmonize Initiative 36 project in support of the strategic goal to harmonize global filings. We will host a series of workshops to solidify scope, clarify success metrics, and map dependencies. Vendor assessments will be completed to decide on any external partnerships needed.,Achieve 50% of planned experiments for RA-36 Harmonize Initiative 36.,Complete data analysis phase of RA-36 Harmonize Initiative 36.,Submit year‑end review and next‑year plan for RA-36 Harmonize Initiative 36.,Dr. Sophia Hernandez,Green,,,,Regulatory filing harmonization initiative requiring workshop-based scope definition and process standardization. Cross-regional alignment and submission efficiency will be key success metrics.,,,
SP136,SG112,Cat104,SPill101,RA-37 Harmonize Initiative 37,In Q1 we will launch the RA-37 Harmonize Initiative 37 project in support of the strategic goal to harmonize global filings. Key deliverables include drafting protocols, outlining resource requirements, and obtaining governance approval. An early engagement with clinical teams will ensure downstream study readiness.,Achieve 50% of planned experiments for RA-37 Harmonize Initiative 37.,Complete data analysis phase of RA-37 Harmonize Initiative 37.,Submit year‑end review and next‑year plan for RA-37 Harmonize Initiative 37.,Dr. Sophia Hernandez,Green,,,,Global filing coordination program focusing on protocol development and regulatory strategy alignment. Process optimization and cross-functional collaboration will guide implementation approach.,,,
SP137,SG113,Cat104,SPill101,RA-38 Strengthen Initiative 38,In Q1 we will launch the RA-38 Strengthen Initiative 38 project in support of the strategic goal to strengthen agency engagement strategy. Our immediate focus will be to refine the scientific plan, align timelines with stakeholders, and allocate budget. Vendor assessments will be completed to decide on any external partnerships needed.,Achieve 50% of planned experiments for RA-38 Strengthen Initiative 38.,Complete data analysis phase of RA-38 Strengthen Initiative 38.,Submit year‑end review and next‑year plan for RA-38 Strengthen Initiative 38.,Dr. Sophia Hernandez,Green,,,,Agency engagement strategy enhancement requiring scientific plan refinement and stakeholder mapping. Regulatory relationship building and strategic communication will be key success factors.,,,
SP138,SG113,Cat104,SPill101,RA-39 Strengthen Initiative 39,In Q1 we will launch the RA-39 Strengthen Initiative 39 project in support of the strategic goal to strengthen agency engagement strategy. Key deliverables include drafting protocols, outlining resource requirements, and obtaining governance approval. Vendor assessments will be completed to decide on any external partnerships needed. Completion of training for all contributors is also targeted within this timeframe.,Achieve 50% of planned experiments for RA-39 Strengthen Initiative 39.,Complete data analysis phase of RA-39 Strengthen Initiative 39.,Submit year‑end review and next‑year plan for RA-39 Strengthen Initiative 39.,Dr. Sophia Hernandez,Green,,,,Strategic regulatory engagement program focusing on protocol development and agency interaction planning. Communication strategy and regulatory intelligence will guide implementation approach.,,,
SP139,SG113,Cat104,SPill101,RA-40 Strengthen Initiative 40,In Q1 we will launch the RA-40 Strengthen Initiative 40 project in support of the strategic goal to strengthen agency engagement strategy. Our immediate focus will be to refine the scientific plan, align timelines with stakeholders, and allocate budget. Vendor assessments will be completed to decide on any external partnerships needed.,Achieve 50% of planned experiments for RA-40 Strengthen Initiative 40.,Complete data analysis phase of RA-40 Strengthen Initiative 40.,Submit year‑end review and next‑year plan for RA-40 Strengthen Initiative 40.,Dr. Sophia Hernandez,Red,,,,Comprehensive agency engagement initiative requiring scientific plan optimization and stakeholder relationship development. Strategic positioning and regulatory advocacy will be primary objectives.,,,
SP140,SG113,Cat104,SPill101,RA-41 Strengthen Initiative 41,In Q1 we will launch the RA-41 Strengthen Initiative 41 project in support of the strategic goal to strengthen agency engagement strategy. This involves assembling the core team, finalizing the detailed project charter, and securing cross‑functional commitment. Vendor assessments will be completed to decide on any external partnerships needed. Our stretch goal is to initiate early pilot work so that data is available for Q2 decision gates.,Achieve 50% of planned experiments for RA-41 Strengthen Initiative 41.,Complete data analysis phase of RA-41 Strengthen Initiative 41.,Submit year‑end review and next‑year plan for RA-41 Strengthen Initiative 41.,Dr. Sophia Hernandez,Green,,,,Agency engagement enhancement program requiring core team formation and relationship management strategy. Regulatory intelligence and strategic communication will be essential for program success.,,,
SP141,SG114,Cat104,SPill101,RA-42 Enhance Initiative 42,In Q1 we will launch the RA-42 Enhance Initiative 42 project in support of the strategic goal to enhance cmc readiness. This involves assembling the core team, finalizing the detailed project charter, and securing cross‑functional commitment. An early engagement with clinical teams will ensure downstream study readiness. Quarter‑end exit criteria include a locked protocol, budget sign‑off, and an agreed set of KPIs.,Achieve 50% of planned experiments for RA-42 Enhance Initiative 42.,Complete data analysis phase of RA-42 Enhance Initiative 42.,Amber,,,,CMC readiness enhancement initiative requiring specialized manufacturing expertise and core team assembly. Process optimization and regulatory compliance will be key development priorities.,,,
SP142,SG114,Cat104,SPill101,RA-43 Enhance Initiative 43,In Q1 we will launch the RA-43 Enhance Initiative 43 project in support of the strategic goal to enhance cmc readiness. We will host a series of workshops to solidify scope, clarify success metrics, and map dependencies. Vendor assessments will be completed to decide on any external partnerships needed.,Achieve 50% of planned experiments for RA-43 Enhance Initiative 43.,Complete data analysis phase of RA-43 Enhance Initiative 43.,Submit year‑end review and next‑year plan for RA-43 Enhance Initiative 43.,Dr. Sophia Hernandez,Green,,,,Manufacturing readiness program requiring workshop-driven scope definition and technical capability assessment. Quality systems and regulatory alignment will guide implementation strategy.,,,
SP143,SG114,Cat104,SPill101,RA-44 Enhance Initiative 44,In Q1 we will launch the RA-44 Enhance Initiative 44 project in support of the strategic goal to enhance cmc readiness. This involves assembling the core team, finalizing the detailed project charter, and securing cross‑functional commitment. An early engagement with clinical teams will ensure downstream study readiness.,Achieve 50% of planned experiments for RA-44 Enhance Initiative 44.,Complete data analysis phase of RA-44 Enhance Initiative 44.,Submit year‑end review and next‑year plan for RA-44 Enhance Initiative 44.,Dr. Sophia Hernandez,Green,,,,Comprehensive CMC enhancement initiative requiring dedicated team formation and technical infrastructure development. Manufacturing excellence and regulatory compliance will be critical success factors.,,,
SP144,SG115,Cat105,SPill101,DTI-45 Deploy Initiative 45,In Q1 we will launch the DTI-45 Deploy Initiative 45 project in support of the strategic goal to deploy decentralized trial platform. This involves assembling the core team, finalizing the detailed project charter, and securing cross‑functional commitment. Vendor assessments will be completed to decide on any external partnerships needed. Success for Q1 will be measured by completion of the scoped deliverables and endorsement from the Oncology R&D Leadership Team.,Achieve 50% of planned experiments for DTI-45 Deploy Initiative 45.,Complete data analysis phase of DTI-45 Deploy Initiative 45.,Submit year‑end review and next‑year plan for DTI-45 Deploy Initiative 45.,Dr. Wei Zhang,Green,,,,Decentralized trial platform deployment requiring specialized technology expertise and core team formation. Platform integration and user adoption will be key implementation challenges.,,,
SP145,SG115,Cat105,SPill101,DTI-46 Deploy Initiative 46,In Q1 we will launch the DTI-46 Deploy Initiative 46 project in support of the strategic goal to deploy decentralized trial platform. This involves assembling the core team, finalizing the detailed project charter, and securing cross‑functional commitment. An early engagement with clinical teams will ensure downstream study readiness. Quarter‑end exit criteria include a locked protocol, budget sign‑off, and an agreed set of KPIs.,Achieve 50% of planned experiments for DTI-46 Deploy Initiative 46.,Complete data analysis phase of DTI-46 Deploy Initiative 46.,Green,,,,Digital trial platform initiative requiring technical team assembly and technology infrastructure development. Platform scalability and user experience will be essential for successful deployment.,,,
SP146,SG115,Cat105,SPill101,DTI-47 Deploy Initiative 47,In Q1 we will launch the DTI-47 Deploy Initiative 47 project in support of the strategic goal to deploy decentralized trial platform. Our immediate focus will be to refine the scientific plan, align timelines with stakeholders, and allocate budget. We will set up a dashboard to track milestones and provide transparent real‑time updates. Completion of training for all contributors is also targeted within this timeframe.,Achieve 50% of planned experiments for DTI-47 Deploy Initiative 47.,Complete data analysis phase of DTI-47 Deploy Initiative 47.,Submit year‑end review and next‑year plan for DTI-47 Deploy Initiative 47.,Dr. Wei Zhang,Green,,,,Comprehensive decentralized platform program requiring scientific plan refinement and technology optimization. Operational excellence and patient engagement will be critical success factors.,,,
SP147,SG116,Cat105,SPill101,DTI-48 Leverage Initiative 48,In Q1 we will launch the DTI-48 Leverage Initiative 48 project in support of the strategic goal to leverage wearables for safety monitoring. Our immediate focus will be to refine the scientific plan, align timelines with stakeholders, and allocate budget. We will set up a dashboard to track milestones and provide transparent real‑time updates. Our stretch goal is to initiate early pilot work so that data is available for Q2 decision gates.,Achieve 50% of planned experiments for DTI-48 Leverage Initiative 48.,Complete data analysis phase of DTI-48 Leverage Initiative 48.,Submit year‑end review and next‑year plan for DTI-48 Leverage Initiative 48.,Dr. Wei Zhang,Green,,,,Wearables integration program requiring scientific plan development and technology validation studies. Data quality and regulatory acceptance will be key implementation considerations.,,,
SP148,SG116,Cat105,SPill101,DTI-49 Leverage Initiative 49,In Q1 we will launch the DTI-49 Leverage Initiative 49 project in support of the strategic goal to leverage wearables for safety monitoring. Our immediate focus will be to refine the scientific plan, align timelines with stakeholders, and allocate budget. Vendor assessments will be completed to decide on any external partnerships needed. Our stretch goal is to initiate early pilot work so that data is available for Q2 decision gates.,Achieve 50% of planned experiments for DTI-49 Leverage Initiative 49.,Complete data analysis phase of DTI-49 Leverage Initiative 49.,Submit year‑end review and next‑year plan for DTI-49 Leverage Initiative 49.,Dr. Wei Zhang,Green,,,,Safety monitoring enhancement initiative using wearable technology requiring technical plan refinement. Data integration and clinical utility validation will be essential for program success.,,,
SP149,SG116,Cat105,SPill101,DTI-50 Leverage Initiative 50,In Q1 we will launch the DTI-50 Leverage Initiative 50 project in support of the strategic goal to leverage wearables for safety monitoring. We will host a series of workshops to solidify scope, clarify success metrics, and map dependencies. We will set up a dashboard to track milestones and provide transparent real‑time updates. By quarter close, we expect to have a resourced, scheduled, and risk‑assessed plan endorsed by sponsors.,Achieve 50% of planned experiments for DTI-50 Leverage Initiative 50.,Green,,,,Wearables platform development requiring workshop-based scope definition and technical feasibility assessment. Technology integration and clinical validation will guide implementation strategy.,,,
SP150,SG116,Cat105,SPill101,DTI-51 Leverage Initiative 51,In Q1 we will launch the DTI-51 Leverage Initiative 51 project in support of the strategic goal to leverage wearables for safety monitoring. The kick‑off will culminate in a signed execution plan and a communication roll‑out to all contributors. Initial experiments or data pulls will begin by the end of the quarter to validate feasibility. By quarter close, we expect to have a resourced, scheduled, and risk‑assessed plan endorsed by sponsors.,Achieve 50% of planned experiments for DTI-51 Leverage Initiative 51.,Complete data analysis phase of DTI-51 Leverage Initiative 51.,Submit year‑end review and next‑year plan for DTI-51 Leverage Initiative 51.,Green,,,,Advanced wearables program with comprehensive execution planning and feasibility validation studies. Technical infrastructure and clinical integration will be critical for achieving safety monitoring objectives by quarter close.,,,
SP151,SG117,Cat105,SPill101,DTI-52 Automate Initiative 52,In Q1 we will launch the DTI-52 Automate Initiative 52 project in support of the strategic goal to automate data capture workflows. We will host a series of workshops to solidify scope, clarify success metrics, and map dependencies. Initial experiments or data pulls will begin by the end of the quarter to validate feasibility.,Achieve 50% of planned experiments for DTI-52 Automate Initiative 52.,Complete data analysis phase of DTI-52 Automate Initiative 52.,Submit year‑end review and next‑year plan for DTI-52 Automate Initiative 52.,Dr. Wei Zhang,Green,,,,Data capture automation initiative requiring workshop-driven scope definition and process optimization analysis. Technical integration and workflow efficiency will be key success metrics.,,,
SP152,SG117,Cat105,SPill101,DTI-53 Automate Initiative 53,In Q1 we will launch the DTI-53 Automate Initiative 53 project in support of the strategic goal to automate data capture workflows. We will host a series of workshops to solidify scope, clarify success metrics, and map dependencies. Vendor assessments will be completed to decide on any external partnerships needed.,Achieve 50% of planned experiments for DTI-53 Automate Initiative 53.,Complete data analysis phase of DTI-53 Automate Initiative 53.,Submit year‑end review and next‑year plan for DTI-53 Automate Initiative 53.,Dr. Wei Zhang,Amber,,,,Workflow automation program requiring structured scope definition and technical infrastructure development. Process standardization and efficiency gains will guide implementation priorities.,,,
SP153,SG117,Cat105,SPill101,DTI-54 Automate Initiative 54,In Q1 we will launch the DTI-54 Automate Initiative 54 project in support of the strategic goal to automate data capture workflows. We will host a series of workshops to solidify scope, clarify success metrics, and map dependencies. We will set up a dashboard to track milestones and provide transparent real‑time updates.,Achieve 50% of planned experiments for DTI-54 Automate Initiative 54.,Complete data analysis phase of DTI-54 Automate Initiative 54.,Submit year‑end review and next‑year plan for DTI-54 Automate Initiative 54.,Dr. Wei Zhang,Amber,,,,Comprehensive data automation initiative requiring workshop-based planning and technology integration strategy. Operational excellence and data quality will be essential for workflow optimization.,,,
SP154,SG117,Cat105,SPill101,DTI-55 Automate Initiative 55,In Q1 we will launch the DTI-55 Automate Initiative 55 project in support of the strategic goal to automate data capture workflows. We will host a series of workshops to solidify scope, clarify success metrics, and map dependencies. We will set up a dashboard to track milestones and provide transparent real‑time updates.,Achieve 50% of planned experiments for DTI-55 Automate Initiative 55.,Complete data analysis phase of DTI-55 Automate Initiative 55.,Submit year‑end review and next‑year plan for DTI-55 Automate Initiative 55.,Dr. Wei Zhang,Amber,,,,Advanced automation program requiring scope definition and technical capability assessment. System integration and user adoption will be critical for achieving workflow optimization goals.,,,
SP155,SG118,Cat106,SPill102,RWE-56 Build Initiative 56,In Q1 we will launch the RWE-56 Build Initiative 56 project in support of the strategic goal to build oncology rwe registry. This involves assembling the core team, finalizing the detailed project charter, and securing cross‑functional commitment. Vendor assessments will be completed to decide on any external partnerships needed. Success for Q1 will be measured by completion of the scoped deliverables and endorsement from the Oncology R&D Leadership Team.,Achieve 50% of planned experiments for RWE-56 Build Initiative 56.,Complete data analysis phase of RWE-56 Build Initiative 56.,Submit year‑end review and next‑year plan for RWE-56 Build Initiative 56.,Dr. Karen Johnson,Amber,,,,Real-world evidence registry development requiring specialized data management expertise and core team formation. Data governance and patient recruitment will be key success factors.,,,
SP156,SG118,Cat106,SPill102,RWE-57 Build Initiative 57,In Q1 we will launch the RWE-57 Build Initiative 57 project in support of the strategic goal to build oncology rwe registry. Key deliverables include drafting protocols, outlining resource requirements, and obtaining governance approval. Initial experiments or data pulls will begin by the end of the quarter to validate feasibility. By quarter close, we expect to have a resourced, scheduled, and risk‑assessed plan endorsed by sponsors.,Achieve 50% of planned experiments for RWE-57 Build Initiative 57.,Red,,,,Oncology registry initiative focusing on protocol development and data collection standardization. Patient engagement and data quality assurance will be essential for registry success.,,,
SP157,SG118,Cat106,SPill102,RWE-58 Build Initiative 58,In Q1 we will launch the RWE-58 Build Initiative 58 project in support of the strategic goal to build oncology rwe registry. Key deliverables include drafting protocols, outlining resource requirements, and obtaining governance approval. An early engagement with clinical teams will ensure downstream study readiness. Success for Q1 will be measured by completion of the scoped deliverables and endorsement from the Oncology R&D Leadership Team.,Achieve 50% of planned experiments for RWE-58 Build Initiative 58.,Complete data analysis phase of RWE-58 Build Initiative 58.,Submit year‑end review and next‑year plan for RWE-58 Build Initiative 58.,Dr. Karen Johnson,Amber,,,,Comprehensive RWE registry program requiring protocol standardization and data management infrastructure. Clinical utility and regulatory acceptance will be critical development objectives.,,,
SP158,SG119,Cat106,SPill102,RWE-59 Generate Initiative 59,In Q1 we will launch the RWE-59 Generate Initiative 59 project in support of the strategic goal to generate comparative effectiveness studies. The kick‑off will culminate in a signed execution plan and a communication roll‑out to all contributors. Initial experiments or data pulls will begin by the end of the quarter to validate feasibility.,Achieve 50% of planned experiments for RWE-59 Generate Initiative 59.,Complete data analysis phase of RWE-59 Generate Initiative 59.,Submit year‑end review and next‑year plan for RWE-59 Generate Initiative 59.,Dr. Karen Johnson,Noah Thomas,Evelyn Anderson,Amber,,,,Comparative effectiveness research program with comprehensive execution planning and feasibility validation. Study design and data collection protocols will be essential for generating regulatory-grade evidence.,,,
SP159,SG119,Cat106,SPill102,RWE-60 Generate Initiative 60,In Q1 we will launch the RWE-60 Generate Initiative 60 project in support of the strategic goal to generate comparative effectiveness studies. Our immediate focus will be to refine the scientific plan, align timelines with stakeholders, and allocate budget. Vendor assessments will be completed to decide on any external partnerships needed. Completion of training for all contributors is also targeted within this timeframe.,Achieve 50% of planned experiments for RWE-60 Generate Initiative 60.,Complete data analysis phase of RWE-60 Generate Initiative 60.,Submit year‑end review and next‑year plan for RWE-60 Generate Initiative 60.,Dr. Karen Johnson,Amber,,,,Effectiveness studies initiative requiring scientific plan refinement and study design optimization. Data quality and statistical methodology will be key success factors for evidence generation.,,,
SP160,SG119,Cat106,SPill102,RWE-61 Generate Initiative 61,In Q1 we will launch the RWE-61 Generate Initiative 61 project in support of the strategic goal to generate comparative effectiveness studies. The kick‑off will culminate in a signed execution plan and a communication roll‑out to all contributors. Vendor assessments will be completed to decide on any external partnerships needed.,Achieve 50% of planned experiments for RWE-61 Generate Initiative 61.,Complete data analysis phase of RWE-61 Generate Initiative 61.,Submit year‑end review and next‑year plan for RWE-61 Generate Initiative 61.,Dr. Karen Johnson,Mason Hernandez,Evelyn Anderson,Amber,,,,Advanced effectiveness research program with comprehensive planning and vendor partnership evaluation. External collaboration and data integration will be critical for study execution success.,,,
SP161,SG120,Cat106,SPill102,RWE-62 Integrate Initiative 62,In Q1 we will launch the RWE-62 Integrate Initiative 62 project in support of the strategic goal to integrate ehr data for signal detection. We will host a series of workshops to solidify scope, clarify success metrics, and map dependencies. Initial experiments or data pulls will begin by the end of the quarter to validate feasibility.,Achieve 50% of planned experiments for RWE-62 Integrate Initiative 62.,Complete data analysis phase of RWE-62 Integrate Initiative 62.,Submit year‑end review and next‑year plan for RWE-62 Integrate Initiative 62.,Dr. Karen Johnson,Amber,,,,EHR data integration initiative requiring workshop-based scope definition and technical infrastructure development. Data quality and signal detection capabilities will be key implementation priorities.,,,
SP162,SG120,Cat106,SPill102,RWE-63 Integrate Initiative 63,In Q1 we will launch the RWE-63 Integrate Initiative 63 project in support of the strategic goal to integrate ehr data for signal detection. Key deliverables include drafting protocols, outlining resource requirements, and obtaining governance approval. Initial experiments or data pulls will begin by the end of the quarter to validate feasibility. Success for Q1 will be measured by completion of the scoped deliverables and endorsement from the Oncology R&D Leadership Team.,Achieve 50% of planned experiments for RWE-63 Integrate Initiative 63.,Complete data analysis phase of RWE-63 Integrate Initiative 63.,Submit year‑end review and next‑year plan for RWE-63 Integrate Initiative 63.,Dr. Karen Johnson,Amber,,,,Electronic health record integration program focusing on protocol development and data standardization. Technical integration and analytical capabilities will be essential for signal detection success.,,,
SP163,SG120,Cat106,SPill102,RWE-64 Integrate Initiative 64,In Q1 we will launch the RWE-64 Integrate Initiative 64 project in support of the strategic goal to integrate ehr data for signal detection. This involves assembling the core team, finalizing the detailed project charter, and securing cross‑functional commitment. We will set up a dashboard to track milestones and provide transparent real‑time updates. Quarter‑end exit criteria include a locked protocol, budget sign‑off, and an agreed set of KPIs.,Achieve 50% of planned experiments for RWE-64 Integrate Initiative 64.,Complete data analysis phase of RWE-64 Integrate Initiative 64.,Amber,,,,Comprehensive EHR integration initiative requiring core team formation and data management strategy. Technical infrastructure and analytical workflows will be critical for detection capabilities.,,,
SP164,SG121,Cat107,SPill102,AE-65 Increase Initiative 65,In Q1 we will launch the AE-65 Increase Initiative 65 project in support of the strategic goal to increase minority patient enrollment. This involves assembling the core team, finalizing the detailed project charter, and securing cross‑functional commitment. We will set up a dashboard to track milestones and provide transparent real‑time updates. Our stretch goal is to initiate early pilot work so that data is available for Q2 decision gates.,Achieve 50% of planned experiments for AE-65 Increase Initiative 65.,Complete data analysis phase of AE-65 Increase Initiative 65.,Submit year‑end review and next‑year plan for AE-65 Increase Initiative 65.,Dr. David Lee,Green,,,,Minority enrollment enhancement program requiring specialized outreach expertise and core team formation. Community engagement and protocol accessibility will be key success metrics.,,,
SP165,SG121,Cat107,SPill102,AE-66 Increase Initiative 66,In Q1 we will launch the AE-66 Increase Initiative 66 project in support of the strategic goal to increase minority patient enrollment. Key deliverables include drafting protocols, outlining resource requirements, and obtaining governance approval. An early engagement with clinical teams will ensure downstream study readiness. By quarter close, we expect to have a resourced, scheduled, and risk‑assessed plan endorsed by sponsors.,Achieve 50% of planned experiments for AE-66 Increase Initiative 66.,Green,,,,Patient diversity initiative focusing on protocol development and enrollment strategy optimization. Community partnerships and cultural competency will be essential for achieving enrollment goals.,,,
SP166,SG121,Cat107,SPill102,AE-67 Increase Initiative 67,In Q1 we will launch the AE-67 Increase Initiative 67 project in support of the strategic goal to increase minority patient enrollment. We will host a series of workshops to solidify scope, clarify success metrics, and map dependencies. We will set up a dashboard to track milestones and provide transparent real‑time updates. Success for Q1 will be measured by completion of the scoped deliverables and endorsement from the Oncology R&D Leadership Team.,Achieve 50% of planned experiments for AE-67 Increase Initiative 67.,Complete data analysis phase of AE-67 Increase Initiative 67.,Submit year‑end review and next‑year plan for AE-67 Increase Initiative 67.,Dr. David Lee,Green,,,,Comprehensive enrollment program requiring workshop-driven scope definition and community engagement strategy. Outreach effectiveness and protocol design will guide implementation approach.,,,
SP167,SG122,Cat107,SPill102,AE-68 Implement Initiative 68,In Q1 we will launch the AE-68 Implement Initiative 68 project in support of the strategic goal to implement financial assistance programs. The kick‑off will culminate in a signed execution plan and a communication roll‑out to all contributors. Risks and mitigation strategies will be documented early to ensure the program remains on track.,Achieve 50% of planned experiments for AE-68 Implement Initiative 68.,Complete data analysis phase of AE-68 Implement Initiative 68.,Submit year‑end review and next‑year plan for AE-68 Implement Initiative 68.,Dr. David Lee,Ethan Williams,Liam Garcia,Green,,,,Financial assistance program implementation with comprehensive execution planning and risk management strategy. Program accessibility and patient support will be critical for achieving enrollment and retention objectives.,,,
SP168,SG122,Cat107,SPill102,AE-69 Implement Initiative 69,In Q1 we will launch the AE-69 Implement Initiative 69 project in support of the strategic goal to implement financial assistance programs. Our immediate focus will be to refine the scientific plan, align timelines with stakeholders, and allocate budget. An early engagement with clinical teams will ensure downstream study readiness. Quarter‑end exit criteria include a locked protocol, budget sign‑off, and an agreed set of KPIs.,Achieve 50% of planned experiments for AE-69 Implement Initiative 69.,Complete data analysis phase of AE-69 Implement Initiative 69.,Red,,,,Patient support initiative requiring scientific plan refinement and program design optimization. Financial modeling and eligibility criteria will be key development considerations.,,,
SP169,SG122,Cat107,SPill102,AE-70 Implement Initiative 70,In Q1 we will launch the AE-70 Implement Initiative 70 project in support of the strategic goal to implement financial assistance programs. Our immediate focus will be to refine the scientific plan, align timelines with stakeholders, and allocate budget. Risks and mitigation strategies will be documented early to ensure the program remains on track.,Achieve 50% of planned experiments for AE-70 Implement Initiative 70.,Complete data analysis phase of AE-70 Implement Initiative 70.,Submit year‑end review and next‑year plan for AE-70 Implement Initiative 70.,Dr. David Lee,Green,,,,Comprehensive assistance program requiring scientific plan optimization and implementation strategy development. Program effectiveness and patient access will be primary success objectives.,,,
```

# data/scorecard-data.ts

```ts
import type { ScoreCardData } from "@/types/scorecard"
import { parseCSV, transformCSVToScoreCardData } from "@/utils/csv-parser"

// Default data as fallback
const defaultData: ScoreCardData = {
  pillars: [
    {
      id: "p1",
      name: "Loading...",
      categories: [
        {
          id: "c1",
          name: "Loading categories...",
          pillar: "Loading...",
          goals: [
            {
              id: "g1",
              text: "Loading goals...",
              q1Status: "on-track",
              programs: [],
            },
          ],
        },
      ],
    },
  ],
}

// This will be populated when the data is loaded
let loadedData: ScoreCardData = defaultData

// Function to load data from CSV
export async function loadScorecardData(): Promise<ScoreCardData> {
  try {
    const response = await fetch('/api/scorecard')
    if (!response.ok) {
      throw new Error('Failed to fetch scorecard data')
    }
    const transformedData = await response.json()

    // Update the loaded data
    loadedData = transformedData
    return transformedData
  } catch (error) {
    console.error("Error loading scorecard data:", error)
    return defaultData
  }
}

// Export the data
export const scorecardData: ScoreCardData = loadedData
```

# data/Strategic-Goals.csv

```csv
﻿StrategicGoalID,CategoryID,StrategicPillarID,Strategic Goal,Status,Comments,,,,,,,,
SG100,Cat100,SPill100,Another change.,Red,Placeholder strategic goal requiring definition and scope clarification. Implementation approach and success criteria need to be established through strategic planning initiatives.,,,,,,,,
SG101,Cat100,SPill100,Validate novel predictive biomarkers,Blue,Multi-phase biomarker validation program requiring robust study design,  cross-functional coordination,, and regulatory-grade protocols. Success depends on establishing clear validation criteria, patient cohort identification, and statistical analysis planning for clinical translation and regulatory acceptance. Critical focus on protocol standardization and data quality assurance across validation phases.,,,
SG102,Cat100,SPill100,Expand tumor genomics database,Red,Large-scale genomics infrastructure expansion requiring significant computational resources, robust data governance framework, and integration capabilities. Success factors include data management infrastructure, technical feasibility planning, and integration with existing clinical datasets. Strategic emphasis on scalability, data quality, and cross-platform compatibility for research applications.,,
SG103,Cat100,SPill100,Advance single cell analytics platform,Green,Next-generation analytics platform development requiring specialized technical expertise, protocol standardization, and platform integration capabilities. Critical success factors include reproducibility across research applications, user training programs, and widespread adoption strategies. Key focus areas include technical validation, platform optimization, and establishment of standardized analytical workflows.,,
SG104,Cat101,SPill100,Optimize next gen kinase inhibitors,Green,Advanced kinase inhibitor development program requiring comprehensive execution planning, molecular target validation, and competitive landscape analysis. Success depends on scientific plan optimization, lead compound selection, risk mitigation strategies, and leadership endorsement. Strategic emphasis on technical feasibility, development timelines, and maintaining program momentum through quarterly milestones.,
SG105,Cat101,SPill100,Develop bispecific antibodies portfolio,Green,Comprehensive bispecific antibody development initiative requiring specialized immunology expertise, manufacturing considerations, and clinical translation pathway planning. Critical success factors include technical platform establishment, protocol standardization, manufacturing scalability, and regulatory strategy development. Key focus areas include team formation, development timelines, and clinical utility demonstration.,
SG106,Cat101,SPill100,Integrate AI for target selection,Amber,AI-powered target identification platform requiring interdisciplinary collaboration between computational and biological teams, technology platform selection, and algorithmic validation. Success depends on data integration capabilities, validation criteria establishment, and technical specifications definition. Strategic emphasis on machine learning implementation, workshop-driven scope refinement, and cross-functional coordination.,,
SG107,Cat102,SPill100,Codevelop CDx assays with therapy programs,Red,Integrated companion diagnostic development requiring comprehensive execution planning, vendor partnerships, and seamless therapy-diagnostic integration. Critical success factors include protocol finalization, regulatory alignment, clinical trial integration, and assay standardization. Key focus areas include regulatory strategy, clinical utility demonstration, and cross-functional collaboration between diagnostic and therapeutic teams.,
SG108,Cat102,SPill100,Obtain FDA clearance for NGS panel,Green,NGS panel regulatory approval program requiring comprehensive regulatory strategy, clinical validation studies, and FDA interaction planning. Success depends on workshop-driven scope definition, scientific plan refinement, and manufacturing considerations. Strategic emphasis on regulatory pathway optimization, clinical evidence generation, and compliance with FDA requirements for market clearance.,,
SG109,Cat103,SPill101,Reduce IND cycle time by 20%,on-track,Process optimization initiative targeting regulatory efficiency improvements, bottleneck identification, and cross-functional coordination enhancement. Critical success factors include process standardization, resource allocation optimization, and quality assurance improvements. Key focus areas include workflow analysis, regulatory submission optimization, and timeline compression strategies while maintaining compliance standards.,,
SG110,Cat103,SPill101,Implement adaptive trial designs,Red,Advanced statistical methodology implementation requiring specialized expertise, regulatory acceptance strategies, and operational feasibility planning. Success depends on protocol flexibility development, statistical innovation, and regulatory alignment for trial design approval. Strategic emphasis on scientific plan development, protocol standardization, and operational execution capabilities for complex trial designs.,,
SG111,Cat103,SPill101,Expand first human trial network,Green,Trial network expansion initiative requiring site identification strategies, investigator engagement, and operational excellence development. Critical success factors include geographic coverage optimization, site qualification criteria, investigator training programs, and regulatory alignment. Key focus areas include network development planning, site selection optimization, and operational infrastructure for early-phase clinical trials.,
SG112,Cat104,SPill101,Harmonize global filings,Green,Global regulatory coordination program requiring comprehensive execution planning, cross-regional alignment, and milestone tracking systems. Success depends on process standardization, submission efficiency optimization, and leadership endorsement across multiple jurisdictions. Strategic emphasis on regulatory intelligence, cross-functional collaboration, and achieving harmonization objectives through structured implementation planning.,,
SG113,Cat104,SPill101,Strengthen agency engagement strategy,Green,Strategic regulatory relationship management requiring stakeholder mapping, communication strategy development, and regulatory intelligence enhancement. Critical success factors include agency interaction planning, relationship building, and strategic positioning with regulatory authorities. Key focus areas include regulatory advocacy, scientific plan refinement, and comprehensive engagement program development for multiple agencies.,,
SG114,Cat104,SPill101,Enhance CMC readiness,Amber,Manufacturing readiness enhancement requiring specialized expertise, quality systems development, and regulatory compliance optimization. Success depends on process optimization, technical infrastructure development, and manufacturing excellence achievement. Strategic emphasis on core team formation, technical capability assessment, and regulatory alignment for chemistry, manufacturing, and controls requirements.
SG115,Cat105,SPill101,Deploy decentralized trial platform,Red,Digital trial platform implementation requiring technology infrastructure development, user adoption strategies, and clinical integration capabilities. Critical success factors include platform scalability, technical expertise deployment, and patient engagement optimization. Key focus areas include technology validation, operational excellence, and user experience optimization for decentralized clinical trial execution.,,
SG116,Cat105,SPill101,Leverage wearables for safety monitoring,Green,Advanced wearables integration program requiring technology validation, data quality assurance, and clinical utility demonstration. Success depends on technical plan refinement, data integration capabilities, and regulatory acceptance strategies. Strategic emphasis on feasibility validation, clinical integration, and comprehensive execution planning for safety monitoring enhancement through wearable technology platforms.,,
SG117,Cat105,SPill101,Automate data capture workflows,Amber,Workflow automation initiative requiring technical infrastructure development, process optimization, and system integration capabilities. Critical success factors include scope definition, workflow efficiency improvements, and user adoption strategies. Key focus areas include technology integration, operational excellence, data quality enhancement, and comprehensive automation program development for clinical data capture processes.,
SG118,Cat106,SPill102,Build oncology RWE registry,Red,Real-world evidence registry development requiring specialized data management expertise, patient recruitment strategies, and robust data governance frameworks. Success depends on protocol standardization, data collection infrastructure, and clinical utility demonstration. Strategic emphasis on patient engagement, data quality assurance, and regulatory acceptance for real-world evidence generation in oncology applications.,,
SG119,Cat106,SPill102,Generate comparative effectiveness studies,Green,Comprehensive effectiveness research program requiring study design optimization, data quality assurance, and regulatory-grade evidence generation. Critical success factors include statistical methodology development, vendor partnerships, and external collaboration capabilities. Key focus areas include feasibility validation, data integration strategies, and evidence generation for comparative effectiveness research in clinical settings.,,
SG120,Cat106,SPill102,Integrate EHR data for signal detection,Green,Electronic health record integration requiring technical infrastructure development, data standardization, and analytical capability enhancement. Success depends on data quality optimization, signal detection algorithm development, and technical integration planning. Strategic emphasis on data management strategy, analytical workflow development, and comprehensive integration capabilities for clinical signal detection applications.,,
SG121,Cat107,SPill102,Increase minority patient enrollment,Green,Patient diversity enhancement requiring specialized outreach expertise, community engagement strategies, and protocol accessibility optimization. Critical success factors include community partnerships, cultural competency development, and enrollment strategy effectiveness. Key focus areas include outreach program development, protocol design optimization, and comprehensive engagement strategies for diverse patient population recruitment and retention.,,
SG122,Cat107,SPill102,Implement financial assistance programs,Amber,Patient support program development requiring comprehensive execution planning, program design optimization, and accessibility enhancement. Success depends on financial modeling, eligibility criteria development, and patient support infrastructure establishment. Strategic emphasis on program effectiveness measurement, patient access improvement, and comprehensive assistance program implementation for enhanced patient enrollment and treatment accessibility.,,
```

# data/StrategicPillars.csv

```csv
﻿StrategicPillarID,Strategic Pillar
SPill100,Precision Medicine
SPill101,Pipeline Acceleration
SPill102,Patient Engagement
```

# hooks/use-editable-field.ts

```ts
import { useState, useCallback } from 'react'
import type { ScoreCardData } from '@/types/scorecard'

interface UseEditableFieldProps {
  fieldPath: string[]
  onDataUpdate: (newData: ScoreCardData) => void
}

export function useEditableField({ fieldPath, onDataUpdate }: UseEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = useCallback(async (newValue: string) => {
    try {
      const response = await fetch('/api/scorecard/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldPath,
          newValue,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update field')
      }

      const updatedData = await response.json()
      onDataUpdate(updatedData)
    } catch (error) {
      throw error
    }
  }, [fieldPath, onDataUpdate])

  return {
    isEditing,
    setIsEditing,
    handleSave,
  }
} 
```

# hooks/use-mobile.tsx

```tsx
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

```

# hooks/use-toast.ts

```ts
"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }

```

# lib/utils.ts

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

```

# llm-system-prompt.md

```md
# System Prompt for Scorecard AI Assistant

You are an AI assistant specialized in analyzing and summarizing scorecard data for a large organization. Your primary goal is to help users understand, interpret, and act on the data provided in the context. The context will include structured information about strategic pillars, categories, goals, programs, objectives, statuses, and comments.

## Instructions
- Always use the provided context to answer user questions. If the answer is not in the context, say so.
- Be concise, factual, and clear. Avoid speculation or making up information.
- If a user asks for a summary, provide a high-level overview of the relevant data.
- If a user asks about a specific pillar, category, goal, or program, reference the relevant details from the context.
- If a user asks for risks, delays, or issues, highlight any items in the context marked as "delayed", "missed", or with negative comments.
- If a user asks for opportunities or successes, highlight items marked as "on-track" or "exceeded".
- Use markdown formatting for clarity (e.g., lists, bold, tables, headings).
- If the user asks for a recommendation, base it strictly on the data in the context.

## Example Behaviors
- **Summary Request:**
  - "Here is a summary of Q1 status by pillar: ..."
- **Specific Query:**
  - "The 'Precision Medicine' pillar has 3 goals, 2 are on-track, 1 is delayed."
- **Risk/Issue Highlight:**
  - "Goal BD-04 is delayed due to resource constraints. Mitigation is in place."
- **If Data is Missing:**
  - "I do not have information on that item in the current context."

## Tone and Format
- Be professional, supportive, and neutral.
- Use markdown for structure (e.g., headings, bullet points, bold for statuses).
- Avoid unnecessary verbosity.

## Limitations
- Do not answer questions outside the provided context.
- Do not provide medical, legal, or financial advice.

---

**Context:**
The context will be provided as structured data (JSON or similar) containing all relevant scorecard information. Use it as your sole source of truth for answering queries. 
```

# next-env.d.ts

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

```

# next.config.mjs

```mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig

```

# package.json

```json
{
  "name": "my-v0-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.1",
    "@radix-ui/react-accordion": "1.2.2",
    "@radix-ui/react-alert-dialog": "1.1.4",
    "@radix-ui/react-aspect-ratio": "1.1.1",
    "@radix-ui/react-avatar": "1.1.2",
    "@radix-ui/react-checkbox": "1.1.3",
    "@radix-ui/react-collapsible": "1.1.2",
    "@radix-ui/react-context-menu": "2.2.4",
    "@radix-ui/react-dialog": "1.1.4",
    "@radix-ui/react-dropdown-menu": "2.1.4",
    "@radix-ui/react-hover-card": "1.1.4",
    "@radix-ui/react-label": "2.1.1",
    "@radix-ui/react-menubar": "1.1.4",
    "@radix-ui/react-navigation-menu": "1.2.3",
    "@radix-ui/react-popover": "1.1.4",
    "@radix-ui/react-progress": "1.1.1",
    "@radix-ui/react-radio-group": "1.2.2",
    "@radix-ui/react-scroll-area": "1.2.2",
    "@radix-ui/react-select": "2.1.4",
    "@radix-ui/react-separator": "1.1.1",
    "@radix-ui/react-slider": "1.2.2",
    "@radix-ui/react-slot": "1.1.1",
    "@radix-ui/react-switch": "1.1.2",
    "@radix-ui/react-tabs": "1.1.2",
    "@radix-ui/react-toast": "1.2.4",
    "@radix-ui/react-toggle": "1.1.1",
    "@radix-ui/react-toggle-group": "1.1.1",
    "@radix-ui/react-tooltip": "1.1.6",
    "autoprefixer": "^10.4.20",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "1.0.4",
    "date-fns": "^2.30.0",
    "embla-carousel-react": "8.5.1",
    "html2canvas": "latest",
    "input-otp": "1.4.1",
    "lucide-react": "^0.454.0",
    "next": "15.2.4",
    "next-themes": "^0.4.4",
    "openai": "^4.28.0",
    "react": "^18.2.0",
    "react-day-picker": "8.10.1",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.54.1",
    "react-markdown": "^9.0.1",
    "react-resizable-panels": "^2.1.7",
    "recharts": "2.15.0",
    "rehype-sanitize": "^6.0.0",
    "remark-gfm": "^4.0.0",
    "sonner": "^1.7.1",
    "tailwind-merge": "^2.5.5",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.6",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@tailwindcss/typography": "^0.5.16",
    "@types/node": "^22",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "postcss": "^8",
    "tailwindcss": "^3.4.17",
    "typescript": "^5"
  }
}

```

# postcss.config.mjs

```mjs
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
  },
};

export default config;

```

# public/icons/people.png

This is a binary file of the type: Image

# public/icons/pipeline.png

This is a binary file of the type: Image

# public/icons/precision-medicine.png

This is a binary file of the type: Image

# public/placeholder-logo.png

This is a binary file of the type: Image

# public/placeholder-logo.svg

This is a file of the type: SVG Image

# public/placeholder-user.jpg

This is a binary file of the type: Image

# public/placeholder.jpg

This is a binary file of the type: Image

# public/placeholder.svg

This is a file of the type: SVG Image

# README.md

```md
# Scorecard App

A web application for managing and displaying scorecard data from CSV files.

## Setup

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Place your CSV file in the `data` directory (e.g., `data/DummyData.csv`)

## Configuration

The application uses a CSV file as its data source. By default, it looks for a file named `DummyData.csv` in the `data` directory. You can change this by setting the `CSV_FILE_PATH` environment variable.

### Setting the CSV File Path

You can set the CSV file path in one of two ways:

1. Create a `.env` file in the root directory with:
   \`\`\`
   CSV_FILE_PATH=data/your-file.csv
   \`\`\`

2. Set the environment variable directly when running the application:
   \`\`\`bash
   CSV_FILE_PATH=data/your-file.csv npm run dev
   \`\`\`

### Data Directory Structure

The `data` directory is used to store CSV files and is gitignored by default. This means:
- You can keep your data files local to your environment
- Different repositories can use different data files
- Sensitive data can be kept out of version control

To use the application:
1. Create a `data` directory if it doesn't exist
2. Place your CSV file in the `data` directory
3. The file will be automatically ignored by git

## Running the Application

To start the development server:

\`\`\`bash
npm run dev
\`\`\`

The application will be available at `http://localhost:3000`

## CSV File Format

The CSV file should follow this structure:
- First row should contain headers
- Required columns:
  - Strategic Pillar
  - Category
  - Strategic Goal
  - Strategic Program
  - Q1-Q4 Objective
  - Q1-Q4 Status (values: green, amber, red, blue)
  - Q1-Q4 Comments
  - ORD LT Sponsor(s)
  - Sponsor(s)/Lead(s)
  - Reporting owner(s)

## Features

- View scorecard data in an organized dashboard
- Upload new scorecard data via JSON
- Track strategic goals and their progress
- Monitor quarterly objectives and status 
```

# src/Dockerfile

```
FROM harbor.csis.astrazeneca.net/azimuth-images/node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./
COPY package-lock*.json ./
COPY public /app/public
COPY app /app/app
COPY styles /app/styles
COPY components /app/components

# Install the project dependencies
RUN npm install

# Install Python 3 and pip
# RUN apt-get update && apt-get install -y python3 python3-pip python3-venv

# Copy requirements.txt and install Python dependencies
# COPY requirements.txt ./
# RUN python3 -m venv venv && \
#    /bin/bash -c "source venv/bin/activate && pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt"

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port your app runs on (adjust if necessary)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

# src/requirements.txt

```txt

```

# styles/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: Arial, Helvetica, sans-serif;
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

```

# tailwind.config.ts

```ts
import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}"
  ],
  safelist: [
    'bg-pillar-magenta',
    'bg-pillar-light-blue', 
    'bg-pillar-lime',
    'bg-pillar-gold',
    'text-pillar-magenta',
    'text-pillar-light-blue',
    'text-pillar-lime', 
    'text-pillar-gold',
    'bg-pillar-magenta/30',
    'bg-pillar-light-blue/30',
    'bg-pillar-lime/30',
    'border-pillar-magenta',
    'border-pillar-light-blue',
    'border-pillar-lime',
    'border-pillar-gold'
  ],
  theme: {
  	extend: {
  		colors: {
  			// Custom pillar colors
  			'pillar-magenta': '#d0006f',
  			'pillar-light-blue': '#68d2df',
  			'pillar-lime': '#c4d600',
  			'pillar-gold': '#f0ab00',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/typography'),
  ],
};
export default config;

```

# tsconfig.json

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "target": "ES6",
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

```

# types/scorecard.ts

```ts
export interface StrategicProgram {
  id: string
  text: string
  q1Objective?: string
  q2Objective?: string
  q3Objective?: string
  q4Objective?: string
  ordLtSponsors?: string
  sponsorsLeads?: string
  reportingOwners?: string
  q1Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q2Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q3Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q4Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q1Comments?: string
  q2Comments?: string
  q3Comments?: string
  q4Comments?: string
  strategicGoalId: string
  categoryId: string
  strategicPillarId: string
}

export interface StrategicGoal {
  id: string
  text: string
  q1Objective?: string
  q2Objective?: string
  q3Objective?: string
  q4Objective?: string
  ordLtSponsors?: string
  sponsorsLeads?: string
  reportingOwners?: string
  q1Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q2Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q3Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q4Status?: "exceeded" | "on-track" | "delayed" | "missed"
  q1Comments?: string
  q2Comments?: string
  q3Comments?: string
  q4Comments?: string
  programs?: StrategicProgram[]
  status?: "exceeded" | "on-track" | "delayed" | "missed"
  comments?: string
  categoryId: string
  strategicPillarId: string
}

export interface Category {
  id: string
  name: string
  status?: "exceeded" | "on-track" | "delayed" | "missed"
  comments?: string
  goals: StrategicGoal[]
  strategicPillarId: string
}

export interface Pillar {
  id: string
  name: string
  categories: Category[]
}

export interface ScoreCardData {
  pillars: Pillar[]
}

```

# utils/csv-parser.ts

```ts
import type { ScoreCardData, Pillar, Category, StrategicGoal, StrategicProgram } from "@/types/scorecard";
import { promises as fs } from 'fs';
import path from 'path';

// Helper function to map status values
function mapStatus(status: string | null | undefined): "exceeded" | "on-track" | "delayed" | "missed" | undefined {
  if (!status || status.trim() === '') return undefined;
  
  const statusMap: { [key: string]: "exceeded" | "on-track" | "delayed" | "missed" } = {
    "Green": "on-track",
    "Blue": "exceeded",
    "Amber": "delayed",
    "Red": "missed",
    "exceeded": "exceeded",
    "on-track": "on-track",
    "delayed": "delayed",
    "missed": "missed"
  };
  
  return statusMap[status.trim()];
}

// Helper to normalize IDs
function norm(id: string | undefined | null): string {
  return (id || '').trim().toUpperCase();
}

// Helper to trim display text
function trimText(val: string | undefined | null): string {
  return (val || '').trim();
}

// Helper to get column index safely
function colIdx(headers: string[], col: string): number {
  const idx = headers.findIndex(h => h.trim() === col.trim());
  return idx;
}

// Function to parse CSV data from file
export async function parseCSV(filePath: string): Promise<string[][]> {
  const fullPath = path.join(process.cwd(), filePath)
  const csvText = await fs.readFile(fullPath, 'utf-8')
  return parseCSVString(csvText)
}

// Helper: parse CSV string to array
export function parseCSVString(csvText: string): string[][] {
  const rows = csvText.split('\n')
  return rows.map((row) => {
    const values: string[] = []
    let inQuotes = false
    let currentValue = ''
    for (let i = 0; i < row.length; i++) {
      const char = row[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue)
        currentValue = ''
      } else {
        currentValue += char
      }
    }
    values.push(currentValue)
    return values
  })
}

// Function to transform CSV data to ScoreCardData
export function transformCSVToScoreCardData(csvData: string[][]): ScoreCardData {
  const headers = csvData[0]
  const dataRows = csvData.slice(1).filter((row) => row.length > 1) // Skip empty rows

  const pillarsMap = new Map<string, Pillar>()
  const categoriesMap = new Map<string, Category>()
  const goalsMap = new Map<string, StrategicGoal>()

  // Build lookup maps for category and goal by ID
  const catHeader = csvData[1]
  const catIdIdx = catHeader.indexOf('CategoryID')
  const catPillarIdIdx = catHeader.indexOf('StrategicPillarID')
  const catNameIdx = catHeader.indexOf('Category')
  const catStatusIdx = catHeader.indexOf('Status')
  const catCommentsIdx = catHeader.indexOf('Comments')
  const catMap = new Map<string, { id?: string, pillarId?: string, status?: string, comments?: string, name?: string }>()
  for (let i = 1; i < csvData[1].length; i++) {
    const row = csvData[1][i]
    if (!row[catIdIdx]) continue
    catMap.set(row[catNameIdx], {
      id: row[catIdIdx],
      pillarId: row[catPillarIdIdx],
      status: row[catStatusIdx],
      comments: row[catCommentsIdx],
      name: row[catNameIdx],
    })
  }

  const goalHeader = csvData[2]
  const goalIdIdx = goalHeader.indexOf('StrategicGoalID')
  const goalCatIdIdx = goalHeader.indexOf('CategoryID')
  const goalPillarIdIdx = goalHeader.indexOf('StrategicPillarID')
  const goalNameIdx = goalHeader.indexOf('Strategic Goal')
  const goalStatusIdx = goalHeader.indexOf('Status')
  const goalCommentsIdx = goalHeader.indexOf('Comments')
  const goalMap = new Map<string, { id?: string, catId?: string, pillarId?: string, status?: string, comments?: string }>()
  for (let i = 1; i < csvData[2].length; i++) {
    const row = csvData[2][i]
    if (!row[goalIdIdx]) continue
    goalMap.set(row[goalNameIdx], {
      id: row[goalIdIdx],
      catId: row[goalCatIdIdx],
      pillarId: row[goalPillarIdIdx],
      status: row[goalStatusIdx],
      comments: row[goalCommentsIdx],
    })
  }

  // Prepare main header and indices
  const mainHeader = dataRows[0].map(h => h.replace(/^\uFEFF/, '').replace(/\r/g, '').trim())
  const progGoalIdIdx = mainHeader.indexOf('StrategicGoalID')
  const progCatIdIdx = mainHeader.indexOf('CategoryID')
  const progPillarIdIdx = mainHeader.indexOf('StrategicPillarID')
  const progIdIdx = mainHeader.indexOf('StrategicProgramID')
  const progTextIdx = mainHeader.indexOf('Strategic Program')
  const progQ1ObjIdx = mainHeader.indexOf('Q1 Objective')
  const progQ2ObjIdx = mainHeader.indexOf('Q2 Objective')
  const progQ3ObjIdx = mainHeader.indexOf('Q3 Objective')
  const progQ4ObjIdx = mainHeader.indexOf('Q4 Objective')
  const progOrdLtIdx = mainHeader.indexOf('ORD LT Sponsor(s)')
  const progSponsorsIdx = mainHeader.indexOf('Sponsor(s)/Lead(s)')
  const progOwnersIdx = mainHeader.indexOf('Reporting owner(s)')
  const progQ1StatusIdx = mainHeader.indexOf('Q1 Status')
  const progQ2StatusIdx = mainHeader.indexOf('Q2 Status')
  const progQ3StatusIdx = mainHeader.indexOf('Q3 Status')
  const progQ4StatusIdx = mainHeader.indexOf('Q4 Status')
  const progQ1CommentsIdx = mainHeader.indexOf('Q1 Comments')
  const progQ2CommentsIdx = mainHeader.indexOf('Q2 Comments')
  const progQ3CommentsIdx = mainHeader.indexOf('Q3 Comments')
  const progQ4CommentsIdx = mainHeader.indexOf('Q4 Comments')

  let debugCount = 0;
  dataRows.forEach((row) => {
    const rowData = headers.reduce(
      (obj, header, index) => {
        obj[header] = row[index] || null
        return obj
      },
      {} as Record<string, string | null>,
    )

    const pillarName = rowData["Strategic Pillar"] || "Unknown Pillar"
    const categoryName = rowData["Category"] || "Unknown Category"
    const goalText = rowData["Strategic Goal"] || "Unknown Goal"
    const programText = rowData["Strategic Program"] || "Unknown Program"

    // Get IDs from the data
    const pillarId = rowData["StrategicPillarID"] || "Unknown"
    const categoryId = rowData["CategoryID"] || "Unknown"
    const goalId = rowData["StrategicGoalID"] || "Unknown"
    const programId = rowData["StrategicProgramID"] || "Unknown"

    // Create program
    const program: StrategicProgram = {
      id: programId,
      text: programText || `Program ${programId}`,
      strategicGoalId: goalId,
      categoryId: categoryId,
      strategicPillarId: pillarId,
      q1Objective: rowData["Q1 Objective"] || undefined,
      q2Objective: rowData["Q2 Objective"] || undefined,
      q3Objective: rowData["Q3 Objective"] || undefined,
      q4Objective: rowData["Q4 Objective"] || undefined,
      q1Status: mapStatus(rowData["Q1 Status"]),
      q2Status: mapStatus(rowData["Q2 Status"]),
      q3Status: mapStatus(rowData["Q3 Status"]),
      q4Status: mapStatus(rowData["Q4 Status"]),
      q1Comments: rowData["Q1 Comments"] || undefined,
      q2Comments: rowData["Q2 Comments"] || undefined,
      q3Comments: rowData["Q3 Comments"] || undefined,
      q4Comments: rowData["Q4 Comments"] || undefined,
      ordLtSponsors: rowData["ORD LT Sponsor(s)"] || undefined,
      sponsorsLeads: rowData["Sponsor(s)/Lead(s)"] || undefined,
      reportingOwners: rowData["Reporting owner(s)"] || undefined,
    }

    // Get or create pillar
    let pillar = pillarsMap.get(pillarId)
    if (!pillar) {
      pillar = {
        id: pillarId,
        name: pillarName,
        categories: [],
      }
      pillarsMap.set(pillarId, pillar)
    }

    // Get or create category
    let category = categoriesMap.get(categoryId)
    if (!category) {
      const catInfo = catMap.get(categoryName) || {}
      category = {
        id: categoryId,
        name: categoryName,
        status: mapStatus(catInfo.status || null),
        comments: catInfo.comments,
        goals: [],
        strategicPillarId: pillarId
      }
      categoriesMap.set(categoryId, category)
      pillar.categories.push(category)
    }

    // Get or create goal
    let goal = goalsMap.get(goalId)
    if (!goal) {
      const goalInfo = goalMap.get(goalText) || {}
      goal = {
        id: goalId,
        text: goalText,
        status: mapStatus(goalInfo.status || null),
        comments: goalInfo.comments,
        programs: [],
        categoryId: categoryId,
        strategicPillarId: pillarId
      }
      goalsMap.set(goalId, goal)
      category.goals.push(goal)
    }

    // Add program to goal
    if (!goal.programs) {
      goal.programs = []
    }
    if (debugCount < 5) {
      console.log('BACKEND DEBUG - Program object:', program);
      debugCount++;
    }
    goal.programs.push(program)
  })

  return {
    pillars: Array.from(pillarsMap.values()),
  }
}

// Function to load and merge data from all CSV files
export async function loadAndMergeScorecardCSVs(): Promise<ScoreCardData> {
  console.log('CSV PARSER: loadAndMergeScorecardCSVs called');
  try {
    const [dummyData, strategicGoals, categoryStatus, strategicPillars] = await Promise.all([
      parseCSV('data/DummyData.csv'),
      parseCSV('data/Strategic-Goals.csv'),
      parseCSV('data/Category-status-comments.csv'),
      parseCSV('data/StrategicPillars.csv')
    ]);

    // --- Pillar Names Map ---
    const pillarHeaders = dummyData[0].map(h => h.trim());
    const pillarHeadersSP = strategicPillars[0].map(h => h.trim());
    const pillarData = strategicPillars.slice(1);
    const pillarNameMap = new Map<string, string>();
    pillarData.forEach(row => {
      const id = norm(row[colIdx(pillarHeadersSP, 'StrategicPillarID')]);
      const name = trimText(row[colIdx(pillarHeadersSP, 'Strategic Pillar')]);
      if (id && name) pillarNameMap.set(id, name);
    });

    // --- Strategic Goals Map ---
    const goalHeaders = strategicGoals[0].map(h => h.trim());
    const goalData = strategicGoals.slice(1);
    const goalMap = new Map<string, any>();
    goalData.forEach(row => {
      const goalId = norm(row[colIdx(goalHeaders, 'StrategicGoalID')]);
      if (!goalId) return;
      goalMap.set(goalId, {
        id: goalId,
        text: trimText(row[colIdx(goalHeaders, 'Strategic Goal')]),
        status: mapStatus(row[colIdx(goalHeaders, 'Status')]),
        comments: trimText(row[colIdx(goalHeaders, 'Comments')]),
        categoryId: norm(row[colIdx(goalHeaders, 'CategoryID')]),
        strategicPillarId: norm(row[colIdx(goalHeaders, 'StrategicPillarID')])
      });
    });

    // --- Category Map ---
    const catHeaders = categoryStatus[0].map(h => h.trim());
    const catData = categoryStatus.slice(1);
    const catMap = new Map<string, any>();
    catData.forEach(row => {
      const catId = norm(row[colIdx(catHeaders, 'CategoryID')]);
      if (!catId) return;
      catMap.set(catId, {
        id: catId,
        name: trimText(row[colIdx(catHeaders, 'Category')]),
        status: mapStatus(row[colIdx(catHeaders, 'Status')]),
        comments: trimText(row[colIdx(catHeaders, 'Comments')]),
        strategicPillarId: norm(row[colIdx(catHeaders, 'StrategicPillarID')])
      });
    });

    // --- DummyData to build hierarchy ---
    const dummyHeaders = dummyData[0].map(h => h.trim());
    const dummyRows = dummyData.slice(1);
    const pillarsMap = new Map<string, Pillar>();
    const categoriesMap = new Map<string, Category>();
    const goalsMap = new Map<string, StrategicGoal>();
    const headers = dummyRows[0];
    const dataRows = dummyRows.slice(1);
    dataRows.forEach(row => {
      const pillarId = norm(row[colIdx(dummyHeaders, 'StrategicPillarID')]);
      const categoryId = norm(row[colIdx(dummyHeaders, 'CategoryID')]);
      const goalId = norm(row[colIdx(dummyHeaders, 'StrategicGoalID')]);
      const programId = norm(row[colIdx(dummyHeaders, 'StrategicProgramID')]);
      const programText = trimText(row[colIdx(dummyHeaders, 'Strategic Program')]);
      const q1Objective = trimText(row[colIdx(dummyHeaders, 'Q1 Objective')]);
      const q2Objective = trimText(row[colIdx(dummyHeaders, 'Q2 Objective')]);
      const q3Objective = trimText(row[colIdx(dummyHeaders, 'Q3 Objective')]);
      const q4Objective = trimText(row[colIdx(dummyHeaders, 'Q4 Objective')]);
      if (!pillarId || !categoryId || !goalId || !programId) return;

      // --- Pillar ---
      let pillar = pillarsMap.get(pillarId);
      if (!pillar) {
        const pillarName = pillarNameMap.get(pillarId);
        pillar = {
          id: pillarId,
          name: trimText(pillarName) || `Pillar ${pillarId}`,
          categories: []
        };
        pillarsMap.set(pillarId, pillar);
      }

      // --- Category ---
      let category = categoriesMap.get(categoryId);
      if (!category) {
        const catInfo = catMap.get(categoryId) || {};
        category = {
          id: categoryId,
          name: trimText(catInfo.name) || `Category ${categoryId}`,
          status: catInfo.status,
          comments: trimText(catInfo.comments),
          goals: [],
          strategicPillarId: pillarId
        };
        categoriesMap.set(categoryId, category);
        pillar.categories.push(category);
      }

      // --- Goal ---
      let goal = goalsMap.get(goalId);
      if (!goal) {
        const goalInfo = goalMap.get(goalId) || {};
        goal = {
          id: goalId,
          text: trimText(goalInfo.text) || `Goal ${goalId}`,
          status: goalInfo.status,
          comments: trimText(goalInfo.comments),
          programs: [],
          categoryId: categoryId,
          strategicPillarId: pillarId
        };
        goalsMap.set(goalId, goal);
        category.goals.push(goal);
      }

      // --- Program ---
      const program: StrategicProgram = {
        id: programId,
        text: programText || `Program ${programId}`,
        strategicGoalId: goalId,
        categoryId: categoryId,
        strategicPillarId: pillarId,
        q1Objective,
        q2Objective,
        q3Objective,
        q4Objective,
        q1Status: mapStatus(row[dummyHeaders.indexOf('Q1 Status')]),
        q2Status: mapStatus(row[dummyHeaders.indexOf('Q2 Status')]),
        q3Status: mapStatus(row[dummyHeaders.indexOf('Q3 Status')]),
        q4Status: mapStatus(row[dummyHeaders.indexOf('Q4 Status')]),
        q1Comments: trimText(row[dummyHeaders.indexOf('Q1 Comments')]),
        q2Comments: trimText(row[dummyHeaders.indexOf('Q2 Comments')]),
        q3Comments: trimText(row[dummyHeaders.indexOf('Q3 Comments')]),
        q4Comments: trimText(row[dummyHeaders.indexOf('Q4 Comments')]),
        ordLtSponsors: trimText(row[dummyHeaders.indexOf('ORD LT Sponsor(s)')]),
        sponsorsLeads: trimText(row[dummyHeaders.indexOf('Sponsor(s)/Lead(s)')]),
        reportingOwners: trimText(row[dummyHeaders.indexOf('Reporting owner(s)')]),
      };
      if (!goal.programs) goal.programs = [];
      goal.programs.push(program);
    });

    return {
      pillars: Array.from(pillarsMap.values())
    };
  } catch (error) {
    console.error('Error loading and merging CSV files:', error);
    throw error;
  }
}

```

