"use client"
import { StatusIndicator } from "./StatusIndicator"
import { PillarIcon } from "./PillarIcon"
import { CategorySection } from "./CategorySection"
import type { ScoreCardData, Pillar } from "@/features/scorecard/types"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"

export default function Scorecard({ data }: { data: ScoreCardData }) {
  // Check if data and data.pillars exist before mapping
  if (!data || !data.pillars || !Array.isArray(data.pillars)) {
    return <div className="w-full p-4 text-center">No scorecard data available</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full h-full flex-1 mt-6">
      {data.pillars.map((pillar) => (
        <PillarCard key={pillar.id} pillar={pillar} />
      ))}
    </div>
  )
}

function PillarCard({ pillar }: { pillar: Pillar }) {
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
            <CategorySection key={category.id} category={category} goals={category.goals} />
          ))}
      </div>
      {/* Bottom line positioned slightly above the bottom */}
      <div className={`h-1 w-full ${getLineColor(pillar.name)} absolute bottom-1`}></div>
    </div>
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