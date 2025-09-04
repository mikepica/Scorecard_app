"use client"

import { useState } from "react"
import { Menu, BarChart2, Camera, Info, X, Users, Filter, FileText, Bot } from "lucide-react"
import BragStatusTable from "./brag-status-table"
import { Dropdown } from "./dropdown"
import { FunctionDropdown } from "./function-dropdown"
import Link from "next/link"

export function Header({
  title = "ORD Scorecard",
  onCaptureScreen,
  onToggleSidebar,
  onOpenFilter,
  quarterOptions,
  selectedQuarter,
  onQuarterChange,
  isFunctionalView = false,
  onToggleChat,
}: {
  title?: string
  onCaptureScreen?: () => void
  onToggleSidebar?: () => void
  onOpenFilter?: () => void
  quarterOptions?: { value: string; label: string }[]
  selectedQuarter?: string
  onQuarterChange?: (value: string) => void
  isFunctionalView?: boolean
  onToggleChat?: () => void
}) {
  const [showStatusModal, setShowStatusModal] = useState(false)

  return (
    <>
      <header className="relative py-2 bg-gray-200 flex justify-between items-center px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-black">{title}</h1>
          
          {/* Hamburger and Filter buttons */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="bg-gray-600 hover:bg-gray-700 text-white rounded-full p-2 transition-colors"
              title="Toggle Sidebar"
              aria-label="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>
          )}
          
          {onOpenFilter && (
            <button
              onClick={onOpenFilter}
              className="bg-gray-600 hover:bg-gray-700 text-white rounded-full p-2 transition-colors"
              title="Open Filters"
              aria-label="Open Filters"
            >
              <Filter size={20} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowStatusModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 transition-colors"
            title="View BRAG Status Legend"
            aria-label="View BRAG Status Legend"
          >
            <Info size={20} />
          </button>
          
          {/* Quarter Dropdown */}
          {quarterOptions && selectedQuarter && onQuarterChange && (
            <Dropdown
              options={quarterOptions}
              value={selectedQuarter}
              onChange={onQuarterChange}
              label="Quarter:"
              labelWidth="w-24"
            />
          )}

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

          <FunctionDropdown />

          {isFunctionalView && (
            <Link
              href="/"
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
            >
              <Users size={20} />
              <span className="whitespace-nowrap">ORD View</span>
            </Link>
          )}

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

          {onToggleChat && (
            <button
              onClick={onToggleChat}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
            >
              <Menu size={20} />
              <span className="whitespace-nowrap">AI Chat</span>
            </button>
          )}
        </div>
      </header>

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
    </>
  )
}
