"use client"
// import { StatusIndicator } from "@/components/status-indicator"
import { PillarIcon } from "@/components/pillar-icon"
import type { ScoreCardData, Pillar, Category, StrategicGoal, StrategicProgram } from "@/types/scorecard"
import { ChevronDown, ChevronRight, Eye } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import { EditableField } from "@/components/ui/editable-field"
// import { useEditableField } from "@/hooks/use-editable-field"
// import { Dropdown } from "@/components/dropdown"
import { StatusCircle } from "@/components/status-circle"
import { getPillarColorWithText, getPillarColor } from "@/lib/pillar-utils"
import { getPillarConfig } from "@/config/pillar-config"
import { StrategicProgramTooltip } from "@/components/strategic-program-tooltip"
import { ItemFunctionTooltip } from "@/components/item-function-tooltip"
import { filterVisibleItems } from "@/lib/quarter-visibility"
import { AlignmentIndicator } from "@/components/alignment-indicator"
import { getCurrentQuarter } from "@/lib/quarter-utils"
import { getFunctionsForPillar, getFunctionsForCategory, getFunctionsForGoal } from "@/lib/function-utils"

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
  isFunctionalView = false,
  onAlignmentClick,
  selectionMode = false,
  selectionDraft,
  onSelectionDraftChange,
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
  onAlignmentClick?: (itemType: 'pillar' | 'category' | 'goal' | 'program', itemId: string, itemName: string, itemPath: string) => void;
  selectionMode?: boolean;
  selectionDraft?: { pillars: Set<string>; categories: Set<string>; goals: Set<string>; programs: Set<string> } | null;
  onSelectionDraftChange?: (s: { pillars: Set<string>; categories: Set<string>; goals: Set<string>; programs: Set<string> } | null) => void;
}) {
  // Check if data and data.pillars exist before mapping
  if (!data || !data.pillars || !Array.isArray(data.pillars)) {
    return <div className="w-full p-4 text-center">No scorecard data available</div>
  }

  // Calculate if selected quarter is the current quarter
  const currentQuarter = getCurrentQuarter()
  const currentQuarterKey = `q${currentQuarter.quarter}_${currentQuarter.year}`
  const isCurrentQuarter = selectedQuarter === currentQuarterKey

  // Filter pillars based on quarter visibility
  const visiblePillars = filterVisibleItems(data.pillars, selectedQuarter)

  // Determine if we need container wrapper (for ORD view or functional view with <= 3 pillars)
  const useContainer = !isFunctionalView || visiblePillars.length <= 3

  const gridContent = (
    <div className={`grid grid-cols-1 ${isFunctionalView && visiblePillars.length > 3 ? 'md:grid-cols-4' : 'md:grid-cols-3'} ${isFunctionalView && visiblePillars.length > 3 ? 'gap-2' : 'gap-4'} w-full h-full flex-1 mt-6`}>
      {visiblePillars.map((pillar) => (
        <PillarCard
          key={pillar.id}
          pillar={pillar}
          onDataUpdate={onDataUpdate}
          selectedQuarter={selectedQuarter}
          isCurrentQuarter={isCurrentQuarter}
          onProgramSelect={onProgramSelect}
          isFunctionalView={isFunctionalView}
          onAlignmentClick={onAlignmentClick}
          selectionMode={selectionMode}
          selectionDraft={selectionDraft}
          onSelectionDraftChange={onSelectionDraftChange}
        />
      ))}
    </div>
  )

  return (
    <>
      {useContainer ? (
        <div className="container mx-auto px-4">
          {gridContent}
        </div>
      ) : (
        gridContent
      )}
    </>
  )
}

function PillarCard({
  pillar,
  onDataUpdate,
  selectedQuarter,
  isCurrentQuarter,
  onProgramSelect,
  isFunctionalView = false,
  onAlignmentClick,
  selectionMode = false,
  selectionDraft,
  onSelectionDraftChange,
}: {
  pillar: Pillar;
  onDataUpdate: (newData: ScoreCardData) => void;
  selectedQuarter: string;
  isCurrentQuarter: boolean;
  onProgramSelect?: (program: StrategicProgram & {
    goalText?: string
    categoryName?: string
    pillarName?: string
  }) => void;
  isFunctionalView?: boolean;
  onAlignmentClick?: (itemType: 'pillar' | 'category' | 'goal' | 'program', itemId: string, itemName: string, itemPath: string) => void;
  selectionMode?: boolean;
  selectionDraft?: { pillars: Set<string>; categories: Set<string>; goals: Set<string>; programs: Set<string> } | null;
  onSelectionDraftChange?: (s: { pillars: Set<string>; categories: Set<string>; goals: Set<string>; programs: Set<string> } | null) => void;
}) {
  const [hoveredItem, setHoveredItem] = useState<{ type: 'pillar'; name: string; functions: string[] } | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const handlePillarMouseEnter = (event: React.MouseEvent) => {
    if (isFunctionalView) {
      const functions = getFunctionsForPillar(pillar)
      setHoveredItem({ type: 'pillar', name: pillar.name, functions })
      setTooltipPosition({ x: event.clientX, y: event.clientY })
    }
  }

  const handlePillarMouseLeave = () => {
    setHoveredItem(null)
  }

  return (
    <>
      <div className="border rounded-md overflow-hidden h-full flex flex-col relative">
        <div
          className={`p-3 ${getPillarColorWithText(pillar)}`}
          onMouseEnter={handlePillarMouseEnter}
          onMouseLeave={handlePillarMouseLeave}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectionMode && selectionDraft && onSelectionDraftChange && (
                <Checkbox
                  checked={selectionDraft.pillars.has(pillar.id)}
                  onCheckedChange={(c) => {
                    const checked = Boolean(c)
                    const next = {
                      pillars: new Set(selectionDraft.pillars),
                      categories: new Set(selectionDraft.categories),
                      goals: new Set(selectionDraft.goals),
                      programs: new Set(selectionDraft.programs),
                    }
                    if (checked) {
                      next.pillars.add(pillar.id)
                      for (const cat of pillar.categories || []) {
                        next.categories.add(cat.id)
                        for (const g of cat.goals || []) {
                          next.goals.add(g.id)
                          for (const pr of g.programs || []) next.programs.add(pr.id)
                        }
                      }
                    } else {
                      next.pillars.delete(pillar.id)
                      for (const cat of pillar.categories || []) {
                        next.categories.delete(cat.id)
                        for (const g of cat.goals || []) {
                          next.goals.delete(g.id)
                          for (const pr of g.programs || []) next.programs.delete(pr.id)
                        }
                      }
                    }
                    onSelectionDraftChange(next)
                  }}
                />
              )}
              <PillarIcon pillar={pillar} />
              <h2 className="text-xl font-bold">{pillar.name}</h2>
            </div>
          <div className="flex items-center gap-2">
            {onAlignmentClick && (
              <AlignmentIndicator
                itemType="pillar"
                itemId={pillar.id}
                onClick={() => onAlignmentClick('pillar', pillar.id, pillar.name, pillar.name)}
                className="text-white hover:text-blue-200"
              />
            )}
          </div>
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
              isCurrentQuarter={isCurrentQuarter}
              onProgramSelect={onProgramSelect}
              isFunctionalView={isFunctionalView}
              onAlignmentClick={onAlignmentClick}
              selectionMode={selectionMode}
              selectionDraft={selectionDraft}
              onSelectionDraftChange={onSelectionDraftChange}
              />
          ))}
      </div>
        {/* Bottom line positioned slightly above the bottom */}
        <div className={`h-1 w-full ${getPillarColor(pillar)} absolute bottom-1`}></div>
      </div>

      {/* Pillar Function Tooltip */}
      {hoveredItem && hoveredItem.type === 'pillar' && (
        <ItemFunctionTooltip
          itemType="pillar"
          itemName={hoveredItem.name}
          functions={hoveredItem.functions}
          isVisible={true}
          position={tooltipPosition}
        />
      )}
    </>
  )
}

function CategorySection({
  category,
  pillar,
  onDataUpdate,
  selectedQuarter,
  isCurrentQuarter,
  onProgramSelect,
  isFunctionalView = false,
  onAlignmentClick,
  selectionMode = false,
  selectionDraft,
  onSelectionDraftChange,
}: {
  category: Category;
  pillar: Pillar;
  onDataUpdate: (newData: ScoreCardData) => void;
  selectedQuarter: string;
  isCurrentQuarter: boolean;
  onProgramSelect?: (program: StrategicProgram & {
    goalText?: string
    categoryName?: string
    pillarName?: string
  }) => void;
  isFunctionalView?: boolean;
  onAlignmentClick?: (itemType: 'pillar' | 'category' | 'goal' | 'program', itemId: string, itemName: string, itemPath: string) => void;
  selectionMode?: boolean;
  selectionDraft?: { pillars: Set<string>; categories: Set<string>; goals: Set<string>; programs: Set<string> } | null;
  onSelectionDraftChange?: (s: { pillars: Set<string>; categories: Set<string>; goals: Set<string>; programs: Set<string> } | null) => void;
}) {
  const [hoveredItem, setHoveredItem] = useState<{ type: 'category'; name: string; functions: string[] } | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const handleCategoryMouseEnter = (event: React.MouseEvent) => {
    if (isFunctionalView) {
      const functions = getFunctionsForCategory(category)
      setHoveredItem({ type: 'category', name: category.name, functions })
      setTooltipPosition({ x: event.clientX, y: event.clientY })
    }
  }

  const handleCategoryMouseLeave = () => {
    setHoveredItem(null)
  }

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
    <>
      <div className="mb-4 last:mb-0">
        <div
          className="flex items-center justify-between mb-2 gap-2"
          onMouseEnter={handleCategoryMouseEnter}
          onMouseLeave={handleCategoryMouseLeave}
        >
          <div className="flex items-center gap-2">
            {selectionMode && selectionDraft && onSelectionDraftChange && (
              <Checkbox
                className="mt-0.5 border-gray-400"
                checked={selectionDraft.categories.has(category.id)}
                onCheckedChange={(c) => {
                  const checked = Boolean(c)
                  const next = {
                    pillars: new Set(selectionDraft.pillars),
                    categories: new Set(selectionDraft.categories),
                    goals: new Set(selectionDraft.goals),
                    programs: new Set(selectionDraft.programs),
                  }
                  if (checked) {
                    next.categories.add(category.id)
                    next.pillars.add(pillar.id)
                    for (const g of category.goals || []) {
                      next.goals.add(g.id)
                      for (const pr of g.programs || []) next.programs.add(pr.id)
                    }
                  } else {
                    next.categories.delete(category.id)
                    for (const g of category.goals || []) {
                      next.goals.delete(g.id)
                      for (const pr of g.programs || []) next.programs.delete(pr.id)
                    }
                    const hasAnySelected = (pillar.categories || []).some(c => next.categories.has(c.id))
                    if (!hasAnySelected) next.pillars.delete(pillar.id)
                  }
                  onSelectionDraftChange(next)
                }}
              />
            )}
            <EditableField
              value={category.name}
              onSave={handleCategoryNameSave}
            className={`text-base font-medium ${getCategoryColor(pillar)}`}
          />
        </div>
        {onAlignmentClick && (
          <AlignmentIndicator
            itemType="category"
            itemId={category.id}
            onClick={() => onAlignmentClick('category', category.id, category.name, `${pillar.name} > ${category.name}`)}
            className="text-gray-500 hover:text-blue-600"
          />
        )}
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
            isCurrentQuarter={isCurrentQuarter}
            onProgramSelect={onProgramSelect}
            isFunctionalView={isFunctionalView}
            onAlignmentClick={onAlignmentClick}
            selectionMode={selectionMode}
            selectionDraft={selectionDraft}
            onSelectionDraftChange={onSelectionDraftChange}
          />
        ))}
      </ul>
      </div>

      {/* Category Function Tooltip */}
      {hoveredItem && hoveredItem.type === 'category' && (
        <ItemFunctionTooltip
          itemType="category"
          itemName={hoveredItem.name}
          functions={hoveredItem.functions}
          isVisible={true}
          position={tooltipPosition}
        />
      )}
    </>
  )
}

function GoalItem({
  goal,
  pillar,
  category,
  onDataUpdate,
  selectedQuarter,
  isCurrentQuarter,
  onProgramSelect,
  isFunctionalView = false,
  onAlignmentClick,
  selectionMode = false,
  selectionDraft,
  onSelectionDraftChange,
}: {
  goal: StrategicGoal;
  pillar: Pillar;
  category: Category;
  onDataUpdate: (newData: ScoreCardData) => void;
  selectedQuarter: string;
  isCurrentQuarter: boolean;
  onProgramSelect?: (program: StrategicProgram & {
    goalText?: string
    categoryName?: string
    pillarName?: string
  }) => void;
  isFunctionalView?: boolean;
  onAlignmentClick?: (itemType: 'pillar' | 'category' | 'goal' | 'program', itemId: string, itemName: string, itemPath: string) => void;
  selectionMode?: boolean;
  selectionDraft?: { pillars: Set<string>; categories: Set<string>; goals: Set<string>; programs: Set<string> } | null;
  onSelectionDraftChange?: (s: { pillars: Set<string>; categories: Set<string>; goals: Set<string>; programs: Set<string> } | null) => void;
}) {
  const [expanded, setExpanded] = useState(false)
  const [hoveredProgram, setHoveredProgram] = useState<string | null>(null)
  const [hoveredGoal, setHoveredGoal] = useState<{ type: 'goal'; name: string; functions: string[] } | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const visiblePrograms = goal.programs ? filterVisibleItems(goal.programs, selectedQuarter) : []
  const hasPrograms = visiblePrograms.length > 0

  const handleGoalMouseEnter = (event: React.MouseEvent) => {
    if (isFunctionalView) {
      const functions = getFunctionsForGoal(goal)
      setHoveredGoal({ type: 'goal', name: goal.text, functions })
      setTooltipPosition({ x: event.clientX, y: event.clientY })
    }
  }

  const handleGoalMouseLeave = () => {
    setHoveredGoal(null)
  }

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
        <div className="flex items-start gap-2">
          {selectionMode && selectionDraft && onSelectionDraftChange && (
            <Checkbox
              className="mt-0.5 border-gray-400"
              checked={selectionDraft.goals.has(goal.id)}
              onCheckedChange={(c) => {
                const checked = Boolean(c)
                const next = {
                  pillars: new Set(selectionDraft.pillars),
                  categories: new Set(selectionDraft.categories),
                  goals: new Set(selectionDraft.goals),
                  programs: new Set(selectionDraft.programs),
                }
                if (checked) {
                  next.goals.add(goal.id)
                  next.categories.add(category.id)
                  next.pillars.add(pillar.id)
                  for (const pr of goal.programs || []) next.programs.add(pr.id)
                } else {
                  next.goals.delete(goal.id)
                  for (const pr of goal.programs || []) next.programs.delete(pr.id)
                  const catHas = (category.goals || []).some(g => next.goals.has(g.id))
                  if (!catHas) {
                    next.categories.delete(category.id)
                    const pilHas = (pillar.categories || []).some(c => next.categories.has(c.id))
                    if (!pilHas) next.pillars.delete(pillar.id)
                  }
                }
                onSelectionDraftChange(next)
              }}
            />
          )}
          {hasPrograms && (
            <button onClick={() => setExpanded(!expanded)} className="mt-0.5 text-gray-500 hover:text-gray-700">
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          <div
            onMouseEnter={handleGoalMouseEnter}
            onMouseLeave={handleGoalMouseLeave}
          >
            <EditableField
              value={goal.text}
              onSave={handleGoalTextSave}
              className="text-base"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onAlignmentClick && (
            <AlignmentIndicator
              itemType="goal"
              itemId={goal.id}
              onClick={() => onAlignmentClick('goal', goal.id, goal.text, `${pillar.name} > ${category.name} > ${goal.text}`)}
              className="text-gray-500 hover:text-blue-600"
            />
          )}
          {!isFunctionalView && (
            <StatusCircle
              status={displayStatus}
              onStatusChange={handleGoalStatusChange}
              isCurrentQuarter={isCurrentQuarter}
            />
          )}
        </div>
      </div>

      {expanded && hasPrograms && (
        <ul className={`pl-6 mt-2 space-y-2 border-l-2 ${getProgramBorderColor(pillar.name)}`}>
          {visiblePrograms.map((program) => (
            <li key={program.id} className="flex items-start justify-between gap-2 group">
              <div className="flex-1 flex items-start gap-2">
                {selectionMode && selectionDraft && onSelectionDraftChange && (
                  <Checkbox
                    className="mt-0.5 border-gray-400"
                    checked={selectionDraft.programs.has(program.id)}
                    onCheckedChange={(c) => {
                      const checked = Boolean(c)
                      const next = {
                        pillars: new Set(selectionDraft.pillars),
                        categories: new Set(selectionDraft.categories),
                        goals: new Set(selectionDraft.goals),
                        programs: new Set(selectionDraft.programs),
                      }
                      if (checked) {
                        next.programs.add(program.id)
                        next.goals.add(goal.id)
                        next.categories.add(category.id)
                        next.pillars.add(pillar.id)
                      } else {
                        next.programs.delete(program.id)
                        const goalHas = (goal.programs || []).some(pr => next.programs.has(pr.id))
                        if (!goalHas) {
                          next.goals.delete(goal.id)
                          const catHas = (category.goals || []).some(g => next.goals.has(g.id))
                          if (!catHas) {
                            next.categories.delete(category.id)
                            const pilHas = (pillar.categories || []).some(c => next.categories.has(c.id))
                            if (!pilHas) next.pillars.delete(pillar.id)
                          }
                        }
                      }
                      onSelectionDraftChange(next)
                    }}
                  />
                )}
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
                  {onAlignmentClick && (
                    <AlignmentIndicator
                      itemType="program"
                      itemId={program.id}
                      onClick={() => onAlignmentClick('program', program.id, program.text, `${pillar.name} > ${category.name} > ${goal.text} > ${program.text}`)}
                      className="opacity-30 hover:opacity-100 transition-opacity group-hover:opacity-60"
                    />
                  )}
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
                isCurrentQuarter={isCurrentQuarter}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Goal Function Tooltip */}
      {hoveredGoal && hoveredGoal.type === 'goal' && (
        <ItemFunctionTooltip
          itemType="goal"
          itemName={hoveredGoal.name}
          functions={hoveredGoal.functions}
          isVisible={true}
          position={tooltipPosition}
        />
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
