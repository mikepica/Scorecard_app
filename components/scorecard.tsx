"use client"
// import { StatusIndicator } from "@/components/status-indicator"
import { PillarIcon } from "@/components/pillar-icon"
import type { ScoreCardData, Pillar, Category, StrategicGoal, StrategicProgram } from "@/types/scorecard"
import { ChevronDown, ChevronRight, Eye } from "lucide-react"
import { useState } from "react"
import { EditableField } from "@/components/ui/editable-field"
// import { useEditableField } from "@/hooks/use-editable-field"
// import { Dropdown } from "@/components/dropdown"
import { StatusCircle } from "@/components/status-circle"
import { getPillarColorWithText, getPillarColor } from "@/lib/pillar-utils"
import { getPillarConfig } from "@/config/pillar-config"
import { StrategicProgramTooltip } from "@/components/strategic-program-tooltip"
import { filterVisibleItems } from "@/lib/quarter-visibility"
import { AlignmentIndicator } from "@/components/alignment-indicator"
import { AlignmentFloatingCard } from "@/components/alignment-floating-card"

// const STATUS_OPTIONS = [
//   { value: "exceeded", label: "Exceeded" },
//   { value: "on-track", label: "On Track" },
//   { value: "delayed", label: "Delayed" },
//   { value: "missed", label: "Missed" },
// ]

export function Scorecard({ 
  data, 
  onDataUpdate, 
  selectedQuarter = "q3_2025", 
  onProgramSelect,
  isFunctionalView = false
}: { 
  data: ScoreCardData; 
  onDataUpdate: (newData: ScoreCardData) => void; 
  selectedQuarter?: string;
  onProgramSelect?: (program: StrategicProgram & {
    goalText?: string
    categoryName?: string
    pillarName?: string
  }) => void;
  isFunctionalView?: boolean;
}) {
  // Alignment state management
  const [alignmentCard, setAlignmentCard] = useState<{
    isOpen: boolean
    itemType: 'pillar' | 'category' | 'goal' | 'program'
    itemId: string
    itemName: string
    position: { x: number; y: number }
  } | null>(null)

  const handleAlignmentClick = (
    itemType: 'pillar' | 'category' | 'goal' | 'program',
    itemId: string,
    itemName: string,
    event: React.MouseEvent
  ) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    setAlignmentCard({
      isOpen: true,
      itemType,
      itemId,
      itemName,
      position: {
        x: rect.right + 10,
        y: rect.top
      }
    })
  }

  const closeAlignmentCard = () => {
    setAlignmentCard(null)
  }

  const handleAlignmentChange = () => {
    // Optionally trigger a data refresh or show a toast
    // For now, we'll just close the card to refresh alignment counts
    setAlignmentCard(null)
  }
  // Check if data and data.pillars exist before mapping
  if (!data || !data.pillars || !Array.isArray(data.pillars)) {
    return <div className="w-full p-4 text-center">No scorecard data available</div>
  }

  // Filter pillars based on quarter visibility
  const visiblePillars = filterVisibleItems(data.pillars, selectedQuarter)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full h-full flex-1 mt-6">
        {visiblePillars.map((pillar) => (
          <PillarCard 
            key={pillar.id} 
            pillar={pillar} 
            onDataUpdate={onDataUpdate} 
            selectedQuarter={selectedQuarter}
            onProgramSelect={onProgramSelect}
            isFunctionalView={isFunctionalView}
            onAlignmentClick={handleAlignmentClick}
          />
        ))}
      </div>
      
      {/* Alignment Floating Card */}
      {alignmentCard && (
        <AlignmentFloatingCard
          itemType={alignmentCard.itemType}
          itemId={alignmentCard.itemId}
          itemName={alignmentCard.itemName}
          isOpen={alignmentCard.isOpen}
          onClose={closeAlignmentCard}
          position={alignmentCard.position}
          onAlignmentChange={handleAlignmentChange}
        />
      )}
    </>
  )
}

function PillarCard({ 
  pillar, 
  onDataUpdate, 
  selectedQuarter, 
  onProgramSelect,
  isFunctionalView = false,
  onAlignmentClick
}: { 
  pillar: Pillar; 
  onDataUpdate: (newData: ScoreCardData) => void; 
  selectedQuarter: string;
  onProgramSelect?: (program: StrategicProgram & {
    goalText?: string
    categoryName?: string
    pillarName?: string
  }) => void;
  isFunctionalView?: boolean;
  onAlignmentClick: (
    itemType: 'pillar' | 'category' | 'goal' | 'program',
    itemId: string,
    itemName: string,
    event: React.MouseEvent
  ) => void;
}) {

  return (
    <div className="border rounded-md overflow-hidden h-full flex flex-col relative">
      <div className={`p-3 ${getPillarColorWithText(pillar)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PillarIcon pillar={pillar} />
            <h2 className="text-xl font-bold">{pillar.name}</h2>
          </div>
          <AlignmentIndicator
            itemType="pillar"
            itemId={pillar.id}
            onClick={(e) => onAlignmentClick('pillar', pillar.id, pillar.name, e)}
            className="text-white/80 hover:text-white"
          />
        </div>
      </div>
      <div className="p-3 overflow-auto flex-1">
        {pillar.categories &&
          filterVisibleItems(pillar.categories, selectedQuarter).map((category) => (
            <CategorySection 
              key={category.id} 
              category={category} 
              pillar={pillar} 
              onDataUpdate={onDataUpdate} 
              selectedQuarter={selectedQuarter}
              onProgramSelect={onProgramSelect}
              isFunctionalView={isFunctionalView}
              onAlignmentClick={onAlignmentClick}
            />
          ))}
      </div>
      {/* Bottom line positioned slightly above the bottom */}
      <div className={`h-1 w-full ${getPillarColor(pillar)} absolute bottom-1`}></div>
    </div>
  )
}

function CategorySection({ 
  category, 
  pillar, 
  onDataUpdate, 
  selectedQuarter, 
  onProgramSelect,
  isFunctionalView = false,
  onAlignmentClick
}: { 
  category: Category; 
  pillar: Pillar; 
  onDataUpdate: (newData: ScoreCardData) => void; 
  selectedQuarter: string;
  onProgramSelect?: (program: StrategicProgram & {
    goalText?: string
    categoryName?: string
    pillarName?: string
  }) => void;
  isFunctionalView?: boolean;
  onAlignmentClick: (
    itemType: 'pillar' | 'category' | 'goal' | 'program',
    itemId: string,
    itemName: string,
    event: React.MouseEvent
  ) => void;
}) {

  // Handler for category name update
  const handleCategoryNameSave = async (newName: string) => {
    const apiEndpoint = isFunctionalView ? '/api/functional-scorecard/update' : '/api/scorecard/update'
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: [pillar.id, category.id],
        newValue: newName,
        type: 'category-name',
      }),
    })
    if (!response.ok) throw new Error('Failed to update category name');
    const updatedData = await response.json();
    onDataUpdate(updatedData);
  }

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-2 gap-2">
        <EditableField
          value={category.name}
          onSave={handleCategoryNameSave}
          className={`text-base font-medium ${getCategoryColor(pillar)}`}
        />
        <AlignmentIndicator
          itemType="category"
          itemId={category.id}
          onClick={(e) => onAlignmentClick('category', category.id, category.name, e)}
          className="flex-shrink-0"
        />
      </div>
      <ul className="space-y-2">
        {category.goals && filterVisibleItems(category.goals, selectedQuarter).map((goal) => (
          <GoalItem 
            key={goal.id} 
            goal={goal} 
            pillar={pillar} 
            category={category} 
            onDataUpdate={onDataUpdate} 
            selectedQuarter={selectedQuarter}
            onProgramSelect={onProgramSelect}
            isFunctionalView={isFunctionalView}
            onAlignmentClick={onAlignmentClick}
          />
        ))}
      </ul>
    </div>
  )
}

function GoalItem({ 
  goal, 
  pillar, 
  category, 
  onDataUpdate, 
  selectedQuarter, 
  onProgramSelect,
  isFunctionalView = false,
  onAlignmentClick
}: { 
  goal: StrategicGoal; 
  pillar: Pillar; 
  category: Category; 
  onDataUpdate: (newData: ScoreCardData) => void; 
  selectedQuarter: string;
  onProgramSelect?: (program: StrategicProgram & {
    goalText?: string
    categoryName?: string
    pillarName?: string
  }) => void;
  isFunctionalView?: boolean;
  onAlignmentClick: (
    itemType: 'pillar' | 'category' | 'goal' | 'program',
    itemId: string,
    itemName: string,
    event: React.MouseEvent
  ) => void;
}) {
  const [expanded, setExpanded] = useState(false)
  const [hoveredProgram, setHoveredProgram] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const visiblePrograms = goal.programs ? filterVisibleItems(goal.programs, selectedQuarter) : []
  const hasPrograms = visiblePrograms.length > 0

  // Get the status for the selected quarter
  const getGoalStatus = (selectedQuarter: string) => {
    switch (selectedQuarter) {
      case "q1_2025": return goal.q1_2025_status;
      case "q2_2025": return goal.q2_2025_status;
      case "q3_2025": return goal.q3_2025_status;
      case "q4_2025": return goal.q4_2025_status;
      case "q1_2026": return goal.q1_2026_status;
      case "q2_2026": return goal.q2_2026_status;
      case "q3_2026": return goal.q3_2026_status;
      case "q4_2026": return goal.q4_2026_status;
      default: return goal.q3_2025_status; // Default to current quarter
    }
  }
  
  const displayStatus = getGoalStatus(selectedQuarter)

  // Handler for goal status update
  const handleGoalStatusChange = async (newStatus: string | undefined) => {
    const apiEndpoint = isFunctionalView ? '/api/functional-scorecard/update' : '/api/scorecard/update'
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: [pillar.id, category.id, goal.id],
        newValue: newStatus,
        type: 'goal-quarter',
        quarter: selectedQuarter,
      }),
    })
    if (!response.ok) throw new Error('Failed to update goal status');
    const updatedData = await response.json();
    onDataUpdate(updatedData);
  }

  // Handler for goal text update
  const handleGoalTextSave = async (newText: string) => {
    const apiEndpoint = isFunctionalView ? '/api/functional-scorecard/update' : '/api/scorecard/update'
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: [pillar.id, category.id, goal.id],
        newValue: newText,
        type: 'goal-text',
      }),
    })
    if (!response.ok) throw new Error('Failed to update goal text');
    const updatedData = await response.json();
    onDataUpdate(updatedData);
  }

  // Local handler for program text editing
  const handleProgramTextSave = async (programId: string, newValue: string) => {
    const apiEndpoint = isFunctionalView ? '/api/functional-scorecard/update' : '/api/scorecard/update'
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: [pillar.id, category.id, goal.id, programId],
        newValue,
        type: isFunctionalView ? 'functional-program-text' : 'program-text',
      }),
    })
    if (!response.ok) throw new Error('Failed to update program text');
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
  const getProgramStatus = (program: StrategicProgram) => {
    switch (selectedQuarter) {
      case "q1_2025": return program.q1_2025_status;
      case "q2_2025": return program.q2_2025_status;
      case "q3_2025": return program.q3_2025_status;
      case "q4_2025": return program.q4_2025_status;
      case "q1_2026": return program.q1_2026_status;
      case "q2_2026": return program.q2_2026_status;
      case "q3_2026": return program.q3_2026_status;
      case "q4_2026": return program.q4_2026_status;
      default: return program.q3_2025_status; // Default to current quarter
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
            onSave={handleGoalTextSave}
            className="text-base"
          />
        </div>
        <div className="flex items-center gap-2">
          <AlignmentIndicator
            itemType="goal"
            itemId={goal.id}
            onClick={(e) => onAlignmentClick('goal', goal.id, goal.text, e)}
          />
          <StatusCircle
            status={displayStatus}
            onStatusChange={handleGoalStatusChange}
          />
        </div>
      </div>

      {expanded && hasPrograms && (
        <ul className={`pl-6 mt-2 space-y-2 border-l-2 ${getProgramBorderColor(pillar.name)}`}>
          {visiblePrograms.map((program) => (
            <li key={program.id} className="flex items-start justify-between gap-2 group">
              <div className="flex-1 flex items-start gap-2">
                <div 
                  className="flex-1"
                  onMouseEnter={(e) => {
                    setHoveredProgram(program.id)
                    setTooltipPosition({ x: e.clientX, y: e.clientY })
                  }}
                  onMouseMove={(e) => {
                    if (hoveredProgram === program.id) {
                      setTooltipPosition({ x: e.clientX, y: e.clientY })
                    }
                  }}
                  onMouseLeave={() => setHoveredProgram(null)}
                >
                  <EditableField
                    value={program.text}
                    onSave={async (newValue) => handleProgramTextSave(program.id, newValue)}
                    className="text-sm"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <AlignmentIndicator
                    itemType="program"
                    itemId={program.id}
                    onClick={(e) => onAlignmentClick('program', program.id, program.text, e)}
                    className="opacity-60 hover:opacity-100"
                  />
                  <button
                    onClick={() => {
                      if (onProgramSelect) {
                        onProgramSelect({
                          ...program,
                          goalText: goal.text,
                          categoryName: category.name,
                          pillarName: pillar.name
                        })
                      }
                    }}
                    className="opacity-30 hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 group-hover:opacity-60"
                    title="View program details"
                  >
                    <Eye size={14} className="text-gray-600" />
                  </button>
                </div>
              </div>
              <StatusCircle
                status={getProgramStatus(program)}
                onStatusChange={async (newStatus) => {
                  const apiEndpoint = isFunctionalView ? '/api/functional-scorecard/update' : '/api/scorecard/update'
                  const response = await fetch(apiEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      fieldPath: [program.strategicPillarId, program.categoryId, program.strategicGoalId, program.id],
                      newValue: newStatus,
                      type: isFunctionalView ? 'functional-program' : 'program',
                      quarter: selectedQuarter,
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

      {/* Strategic Program Tooltip */}
      {hoveredProgram && goal.programs && (
        <StrategicProgramTooltip
          program={{
            ...goal.programs.find(p => p.id === hoveredProgram)!,
            goalText: goal.text,
            categoryName: category.name,
            pillarName: pillar.name
          }}
          isVisible={hoveredProgram !== null}
          position={tooltipPosition}
        />
      )}
    </li>
  )
}

function getCategoryColor(pillar: Pillar) {
  const config = getPillarConfig(pillar)
  return config ? config.textClass : "text-gray-500"
}
