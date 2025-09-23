import type { Pillar, Category, StrategicGoal } from '@/types/scorecard'

export function getFunctionsForPillar(pillar: Pillar): string[] {
  const functions = new Set<string>()

  pillar.categories?.forEach(category => {
    category.goals?.forEach(goal => {
      goal.programs?.forEach(program => {
        if (program.functionArea) {
          functions.add(program.functionArea)
        }
      })
    })
  })

  return Array.from(functions).sort()
}

export function getFunctionsForCategory(category: Category): string[] {
  const functions = new Set<string>()

  category.goals?.forEach(goal => {
    goal.programs?.forEach(program => {
      if (program.functionArea) {
        functions.add(program.functionArea)
      }
    })
  })

  return Array.from(functions).sort()
}

export function getFunctionsForGoal(goal: StrategicGoal): string[] {
  const functions = new Set<string>()

  goal.programs?.forEach(program => {
    if (program.functionArea) {
      functions.add(program.functionArea)
    }
  })

  return Array.from(functions).sort()
}