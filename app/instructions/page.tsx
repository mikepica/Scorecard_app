"use client"

import BragStatusTable from "@/components/brag-status-table"
import { Header } from "@/components/header"

export default function InstructionsPage() {

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="ORD Scorecard: Instructions"
      />
      
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

              <h2 className="text-2xl font-bold mb-6">Table View (Details)</h2>
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
                Click on pencil icon on the current quarter&apos;s progress updates to edit
              </h3>
              <p className="mb-6 text-gray-600">
                Select dropdowns on previous quarter and which quarter the objectives begin to view
              </p>
              
              <BragStatusTable className="mt-6" />
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}