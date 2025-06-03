"use client"

import { useEffect, useState } from "react"
import Scorecard from "@/features/scorecard/components/Scorecard"
import { scorecardData, loadScorecardData } from "@/core/domain/models/scorecard-data"
import type { ScoreCardData } from "@/features/scorecard/types"
import { Camera, BarChart2, Menu } from "lucide-react"
import Link from "next/link"
import { Toast } from "@/shared/components/common/Toast"
import { AIChat } from "@/features/ai-chat/components/AIChat"

export default function Home() {
  const [data, setData] = useState<ScoreCardData>(scorecardData)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

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
      console.error("Error capturing screen:", error)
      setToast({ message: "Failed to capture screen", type: "error" })
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-pillar-lime/20 border-b border-pillar-lime/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">ORD 2024 Scorecard</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={captureScreen}
                className="inline-flex items-center px-4 py-2 bg-pillar-lime text-gray-900 rounded-md hover:bg-pillar-lime/90 transition-colors"
              >
                <Camera className="w-5 h-5 mr-2" />
                Capture Screen
              </button>

              <Link
                href="/details"
                className="inline-flex items-center px-4 py-2 bg-pillar-magenta text-white rounded-md hover:bg-pillar-magenta/90 transition-colors"
              >
                <BarChart2 className="w-5 h-5 mr-2" />
                Program View
              </Link>

              <button
                onClick={() => setIsChatOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-pillar-magenta text-white rounded-md hover:bg-pillar-magenta/90 transition-colors"
              >
                <Menu className="w-5 h-5 mr-2" />
                AI Assistant
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pillar-magenta mx-auto mb-4"></div>
              <p className="text-gray-600">Loading scorecard data...</p>
            </div>
          </div>
        ) : (
          <Scorecard data={data} />
        )}
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
    </main>
  );
}
