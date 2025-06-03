import { StrategicGoal } from "@/features/scorecard/types"
import { StatusIndicator } from "./StatusIndicator"

interface GoalItemProps {
  goal: StrategicGoal
}

export function GoalItem({ goal }: GoalItemProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">{goal.text}</h4>
          <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
        </div>
        <StatusIndicator status={goal.q1Status} />
      </div>
    </div>
  )
} 