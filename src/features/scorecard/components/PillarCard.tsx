import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { PillarIcon } from "./PillarIcon";
import { StatusIndicator } from "./StatusIndicator";

interface Goal {
  id: string;
  title: string;
  status: "on-track" | "delayed" | "missed" | "exceeded";
  programs: string[];
}

interface Category {
  id: string;
  title: string;
  goals: Goal[];
}

interface PillarCardProps {
  title: string;
  description: string;
  pillarType: "magenta" | "light-blue" | "lime" | "gold";
  categories: Category[];
  className?: string;
}

const pillarStyles = {
  magenta: {
    bg: "bg-pillar-magenta/10",
    border: "border-pillar-magenta",
    text: "text-pillar-magenta",
  },
  "light-blue": {
    bg: "bg-pillar-light-blue/10",
    border: "border-pillar-light-blue",
    text: "text-pillar-light-blue",
  },
  lime: {
    bg: "bg-pillar-lime/10",
    border: "border-pillar-lime",
    text: "text-pillar-lime",
  },
  gold: {
    bg: "bg-pillar-gold/10",
    border: "border-pillar-gold",
    text: "text-pillar-gold",
  },
};

const PillarCard: React.FC<PillarCardProps> = ({
  title,
  description,
  pillarType,
  categories,
  className,
}) => {
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  const toggleGoal = (goalId: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  const styles = pillarStyles[pillarType];

  return (
    <div
      className={cn(
        "rounded-lg shadow-md overflow-hidden h-full flex flex-col",
        styles.bg,
        styles.border,
        "border-2",
        className
      )}
    >
      <div className="p-6 flex items-start gap-4">
        <PillarIcon type={pillarType} className="w-12 h-12" />
        <div className="flex-1">
          <h3 className={cn("text-xl font-bold mb-2", styles.text)}>{title}</h3>
          <p className="text-gray-700">{description}</p>
        </div>
      </div>

      <div className="px-6 pb-6 flex-1">
        {categories.map((category) => (
          <div key={category.id} className="mb-4">
            <h4 className="font-semibold text-gray-800 mb-2">{category.title}</h4>
            <div className="space-y-2">
              {category.goals.map((goal) => (
                <div key={goal.id} className="bg-white rounded-md shadow-sm">
                  <button
                    onClick={() => toggleGoal(goal.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <StatusIndicator status={goal.status} />
                      <span className="font-medium">{goal.title}</span>
                    </div>
                    {expandedGoals.has(goal.id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {expandedGoals.has(goal.id) && (
                    <div className="px-4 py-3 bg-gray-50 border-t">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Programs</h5>
                      <ul className="space-y-1">
                        {goal.programs.map((program, index) => (
                          <li key={index} className="text-sm text-gray-600">
                            {program}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PillarCard;
