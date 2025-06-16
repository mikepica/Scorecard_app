"use client"

import { useState } from "react"
import { Menu, BarChart2, Camera } from "lucide-react"
import { AIChat } from "./ai-chat"
import Link from "next/link"

export function Header({
  title = "ORD Scorecard",
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
