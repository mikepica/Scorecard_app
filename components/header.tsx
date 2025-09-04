"use client"

import { useState } from "react"
import { Menu, BarChart2, Camera, Info, X, Users } from "lucide-react"
import { AIChat } from "./ai-chat"
import BragStatusTable from "./brag-status-table"
import Link from "next/link"

export function Header({
  title = "ORD Scorecard",
  onCaptureScreen,
}: {
  title?: string
  onCaptureScreen?: () => void
}) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)

  return (
    <header className="relative py-2 bg-gray-200 flex justify-between items-center px-4">
      <h1 className="text-2xl font-bold text-black">{title}</h1>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowStatusModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 transition-colors"
          title="View BRAG Status Legend"
          aria-label="View BRAG Status Legend"
        >
          <Info size={20} />
        </button>
        <Link
          href="/functional"
          className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
        >
          <Users size={20} />
          <span className="whitespace-nowrap">Functional View</span>
        </Link>
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

      {/* BRAG Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">BRAG Status Legend</h2>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <BragStatusTable />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
