import { Category, StrategicGoal } from "@/features/scorecard/types"
import { GoalItem } from "./GoalItem"

interface CategorySectionProps {
  category: Category
  goals: StrategicGoal[]
}

export function CategorySection({ category, goals }: CategorySectionProps) {
  if (!goals || goals.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
      <div className="space-y-2">
        {goals.map((goal) => (
          <GoalItem key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  )
} 