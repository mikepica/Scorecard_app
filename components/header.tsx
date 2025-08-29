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
    <header className="relative py-2 bg-gray-200 flex justify-between items-center px-4">
      <h1 className="text-2xl font-bold text-black">{title}</h1>

      <div className="flex items-center gap-4">
        <Link
          href="/details"
          className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
        >
          <BarChart2 size={20} />
          <span className="whitespace-nowrap">Program View</span>
        </Link>

        {onCaptureScreen && (
          <button
            onClick={onCaptureScreen}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
          >
            <Camera size={20} />
            <span className="whitespace-nowrap">Capture Screen</span>
          </button>
        )}

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
        >
          <Menu size={20} />
          <span className="whitespace-nowrap">AI Chat</span>
        </button>
      </div>

      <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </header>
  )
}
