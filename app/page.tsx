"use client"

import { useEffect, useState, useRef } from "react"
import { Scorecard } from "@/components/scorecard"
// Database-only mode - load data from API
import type { ScoreCardData } from "@/types/scorecard"
import { Camera, BarChart2, Menu, FileText, Bot } from "lucide-react"
import Link from "next/link"
import { Toast } from "@/components/toast"
import { AIChat } from "@/components/ai-chat"
import { Dropdown } from "@/components/dropdown"
import { AIFlowsModal } from "@/components/ai-flows-modal"

export default function Home() {
  const [data, setData] = useState<ScoreCardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedQuarter, setSelectedQuarter] = useState("q1")
  // const [isAIFlowsDropdownOpen, setIsAIFlowsDropdownOpen] = useState(false)
  const [isAIFlowsModalOpen, setIsAIFlowsModalOpen] = useState(false)
  const [aiFlowType] = useState<"goal-comparison" | "learnings-best-practices">("goal-comparison")
  const aiFlowsDropdownRef = useRef<HTMLDivElement>(null)

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
        const response = await fetch('/api/scorecard')
        if (!response.ok) {
          throw new Error('Failed to load scorecard data')
        }
        const loadedData = await response.json()
        setData(loadedData)
      } catch (error) {
        console.error('Error loading scorecard data:', error)
        setToast({
          message: "Failed to load scorecard data",
          type: "error"
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (aiFlowsDropdownRef.current && !aiFlowsDropdownRef.current.contains(event.target as Node)) {
        setIsAIFlowsDropdownOpen(false)
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
      console.error('Screen capture error:', error)
      setToast({ message: "Failed to capture screen", type: "error" })
    }
  }

  // const handleAIFlowSelection = (flowType: "goal-comparison" | "learnings-best-practices") => {
  //   setAIFlowType(flowType)
  //   setIsAIFlowsDropdownOpen(false)
  //   setIsAIFlowsModalOpen(true)
  // }

  const handleAIFlowsGenerate = async (prompt: string, files: File[], flowType: "goal-comparison" | "learnings-best-practices", selections: { pillars: number[], categories: number[], goals: number[], programs: number[] }) => {
    try {
      setToast({ message: 'Analyzing selected data...', type: 'info' })
      
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
        setToast({ message: 'Failed to analyze data', type: 'error' })
      }
    } catch (error) {
      console.error('Error in AI Flows:', error)
      setToast({ message: 'Error analyzing data', type: 'error' })
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="relative py-2 bg-gray-200 flex justify-between items-center px-4">
        <h1 className="text-2xl font-bold text-black">ORD Scorecard</h1>

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
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
          >
            <Camera size={20} />
            <span className="whitespace-nowrap">Capture Screen</span>
          </button>

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

          <Link
            href="/details"
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
          >
            <BarChart2 size={20} />
            <span className="whitespace-nowrap">Program View</span>
          </Link>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
          >
            <Menu size={20} />
            <span className="whitespace-nowrap">AI Chat</span>
          </button>
        </div>

        <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} context={data || { pillars: [] }} />
      </div>

      <div className="container mx-auto px-4 pt-4 flex-1 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading scorecard data...</p>
            </div>
          </div>
        ) : data ? (
          <div className="flex-1 flex flex-col">
            <Scorecard data={data} onDataUpdate={handleDataUpdate} selectedQuarter={selectedQuarter} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-600">No scorecard data available</p>
            </div>
          </div>
        )}
      </div>
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

      {/* Toast notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </main>
  )
}
