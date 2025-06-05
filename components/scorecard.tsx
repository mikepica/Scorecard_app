"use client"
import { StatusIndicator } from "@/components/status-indicator"
import { PillarIcon } from "@/components/pillar-icon"
import type { ScoreCardData, Pillar, Category, StrategicGoal } from "@/types/scorecard"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"
import { EditableField } from "@/components/ui/editable-field"
import { useEditableField } from "@/hooks/use-editable-field"

export function Scorecard({ data, onDataUpdate }: { data: ScoreCardData; onDataUpdate: (newData: ScoreCardData) => void }) {
  // Check if data and data.pillars exist before mapping
  if (!data || !data.pillars || !Array.isArray(data.pillars)) {
    return <div className="w-full p-4 text-center">No scorecard data available</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full h-full flex-1 mt-6">
      {data.pillars.map((pillar) => (
        <PillarCard key={pillar.id} pillar={pillar} onDataUpdate={onDataUpdate} />
      ))}
    </div>
  )
}

function PillarCard({ pillar, onDataUpdate }: { pillar: Pillar; onDataUpdate: (newData: ScoreCardData) => void }) {
  const getBgColor = (name: string) => {
    switch (name.toLowerCase()) {
      case "science & innovation":
        return "bg-cyan-200"
      case "growth & ta leadership":
        return "bg-pink-500 text-white"
      case "people & sustainability":
        return "bg-pillar-lime"
      case "precision medicine":
        return "bg-pillar-light-blue"
      case "pipeline acceleration":
        return "bg-pillar-magenta text-white"
      case "patient engagement":
        return "bg-pillar-lime"
      default:
        return "bg-gray-200"
    }
  }

  const getLineColor = (name: string) => {
    switch (name.toLowerCase()) {
      case "science & innovation":
        return "bg-cyan-500"
      case "growth & ta leadership":
        return "bg-pink-600"
      case "people & sustainability":
        return "bg-pillar-lime"
      case "precision medicine":
        return "bg-pillar-light-blue"
      case "pipeline acceleration":
        return "bg-pillar-magenta"
      case "patient engagement":
        return "bg-pillar-lime"
      default:
        return "bg-gray-400"
    }
  }

  return (
    <div className="border rounded-md overflow-hidden h-full flex flex-col relative">
      <div className={`p-3 ${getBgColor(pillar.name)}`}>
        <div className="flex items-center gap-2">
          <PillarIcon name={pillar.name} />
          <h2 className="text-xl font-bold">{pillar.name}</h2>
        </div>
      </div>
      <div className="p-3 overflow-auto flex-1">
        {pillar.categories &&
          pillar.categories.map((category) => (
            <CategorySection key={category.id} category={category} pillarName={pillar.name} onDataUpdate={onDataUpdate} />
          ))}
      </div>
      {/* Bottom line positioned slightly above the bottom */}
      <div className={`h-1 w-full ${getLineColor(pillar.name)} absolute bottom-1`}></div>
    </div>
  )
}

function CategorySection({ category, pillarName, onDataUpdate }: { category: Category; pillarName: string; onDataUpdate: (newData: ScoreCardData) => void }) {
  return (
    <div className="mb-4 last:mb-0">
      <h3 className={`text-base font-medium mb-2 ${getCategoryColor(pillarName)}`}>{category.name}</h3>
      <ul className="space-y-2">
        {category.goals && category.goals.map((goal) => (
          <GoalItem key={goal.id} goal={goal} pillarName={pillarName} categoryName={category.name} onDataUpdate={onDataUpdate} />
        ))}
      </ul>
    </div>
  )
}

function GoalItem({ goal, pillarName, categoryName, onDataUpdate }: { goal: StrategicGoal; pillarName: string; categoryName: string; onDataUpdate: (newData: ScoreCardData) => void }) {
  const [expanded, setExpanded] = useState(false)
  const hasPrograms = goal.programs && goal.programs.length > 0

  // Use Q4 status for display, fallback to other quarters if not available
  const displayStatus = goal.q4Status || goal.q3Status || goal.q2Status || goal.q1Status

  const { handleSave } = useEditableField({
    fieldPath: [pillarName, categoryName, goal.text, "", "Strategic Goal"],
    onDataUpdate,
  })

  // Local handler for program editing
  const handleProgramSave = async (programText: string, newValue: string) => {
    const response = await fetch('/api/scorecard/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: [pillarName, categoryName, goal.text, programText, "Strategic Program"],
        newValue,
      }),
    })
    if (!response.ok) throw new Error('Failed to update field');
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
            onSave={handleSave}
            className="text-base"
          />
        </div>
        <StatusIndicator status={displayStatus} />
      </div>

      {expanded && hasPrograms && (
        <ul className={`pl-6 mt-2 space-y-2 border-l-2 ${getProgramBorderColor(pillarName)}`}>
          {goal.programs?.map((program) => (
            <li key={program.id} className="flex items-start justify-between gap-2">
              <EditableField
                value={program.text}
                onSave={async (newValue) => handleProgramSave(program.text, newValue)}
                className="text-sm"
              />
              <StatusIndicator
                status={program.q4Status || program.q3Status || program.q2Status || program.q1Status}
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function getCategoryColor(pillarName: string) {
  if (!pillarName) return "text-gray-500"

  switch (pillarName.toLowerCase()) {
    case "science & innovation":
      return "text-cyan-500"
    case "growth & ta leadership":
      return "text-pink-500"
    case "people & sustainability":
      return "text-pillar-lime"
    case "precision medicine":
      return "text-pillar-light-blue"
    case "pipeline acceleration":
      return "text-pillar-magenta"
    case "patient engagement":
      return "text-pillar-lime"
    default:
      return "text-gray-500"
  }
}
