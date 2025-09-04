"use client"

import Link from "next/link"
import { BarChart2, Info, X } from "lucide-react"
import BragStatusTable from "@/components/brag-status-table"
import { useState } from "react"

export default function InstructionsPage() {
  const [showStatusModal, setShowStatusModal] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-200 py-2 px-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">ORD Scorecard: Instructions</h1>
        
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
            href="/"
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
          >
            <BarChart2 size={20} />
            <span className="whitespace-nowrap">Goal-level view</span>
          </Link>

          <Link
            href="/details"
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg transition-colors text-base min-h-[48px]"
          >
            <BarChart2 size={20} />
            <span className="whitespace-nowrap">Program View</span>
          </Link>
        </div>
      </header>
      
      <div className="max-w-full mx-auto px-8 pt-8 flex-1">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 h-full min-h-[calc(100vh-200px)]">
          {/* Left Panel - Navigation Overview */}
          <div className="bg-white rounded-lg shadow-lg p-8 overflow-y-auto">
            <div className="prose prose-xl max-w-none">
              <h2 className="text-2xl font-bold mb-6">Main Scorecard (Home)</h2>
              <ul className="list-disc pl-6 mb-8 space-y-2">
                <li>Summary view displaying strategic pillars and their categories</li>
                <li>Quarter Selection dropdown to view different time periods</li>
                <li>Screen Capture functionality for reports and presentations</li>
                <li>AI Chat integration for scorecard analysis and insights</li>
              </ul>

              <h2 className="text-2xl font-bold mb-6">Program View (Details)</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Detailed table view of goals and strategic programs</li>
                <li>Advanced filtering by Pillar, Category, and Strategic Goal</li>
                <li>Editable fields for program updates and modifications</li>
                <li>Bulk operations for efficient data management</li>
              </ul>
            </div>
          </div>

          {/* Right Panel - Status Updates Guide */}
          <div className="bg-white rounded-lg shadow-lg p-8 overflow-y-auto">
            <div className="prose prose-xl max-w-none">
              <h2 className="text-2xl font-bold mb-4">Providing quarterly status updates</h2>
              <h3 className="text-lg font-semibold mb-6 text-gray-700">
                Click on pencil icon on the current quarter's progress updates to edit
              </h3>
              <p className="mb-6 text-gray-600">
                Select dropdowns on previous quarter and which quarter the objectives begin to view
              </p>
              
              <BragStatusTable className="mt-6" />
            </div>
          </div>
        </div>
      </div>

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
    </div>
  )
}