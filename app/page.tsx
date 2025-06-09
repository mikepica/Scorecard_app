"use client"

import { useEffect, useState } from "react"
import { Scorecard } from "@/components/scorecard"
import { scorecardData, loadScorecardData } from "@/data/scorecard-data"
import type { ScoreCardData } from "@/types/scorecard"
import { Camera, BarChart2, Menu, FileText } from "lucide-react"
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
            href="/instructions"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
          >
            <FileText size={20} />
            <span className="whitespace-nowrap">Instructions</span>
          </Link>

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
