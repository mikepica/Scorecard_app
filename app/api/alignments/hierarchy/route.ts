import { NextResponse } from "next/server"
import { DatabaseService } from '@/lib/database'
import type { ScoreCardData, Pillar, Category, StrategicGoal, StrategicProgram } from '@/types/scorecard'

interface HierarchicalItem {
  id: string
  name: string
  type: 'root' | 'pillar' | 'category' | 'goal' | 'program'
  children?: HierarchicalItem[]
  source?: 'ord' | 'functional'
  functionArea?: string
}

interface HierarchicalData {
  combined: HierarchicalItem[]
}

export async function GET() {
  try {
    console.log('API: Fetching hierarchical data for alignments')
    
    // Fetch ORD data and distinct functions
    const [ordData, distinctFunctions] = await Promise.all([
      DatabaseService.getScoreCardData(),
      DatabaseService.getDistinctFunctions()
    ])
    
    console.log('API: Fetched ORD pillars:', ordData.pillars?.length || 0, 'Distinct functions:', distinctFunctions)
    
    // Convert scorecard data to hierarchical structure with source tracking
    const convertToHierarchy = (data: ScoreCardData, source: 'ord' | 'functional', functionArea?: string): HierarchicalItem[] => {
      if (!data.pillars || !Array.isArray(data.pillars)) {
        return []
      }

      const functionSlug = functionArea ? functionArea.toLowerCase().replace(/[^a-z0-9]/g, '-') : ''
      const idPrefix = source === 'ord' ? 'ord' : `functional-${functionSlug}`

      return data.pillars.map((pillar: Pillar) => ({
        id: `${idPrefix}-${pillar.id}`,
        name: pillar.name,
        type: 'pillar' as const,
        source,
        functionArea,
        children: (pillar.categories || []).map((category: Category) => ({
          id: `${idPrefix}-${category.id}`,
          name: category.name,
          type: 'category' as const,
          source,
          functionArea,
          children: (category.goals || []).map((goal: StrategicGoal) => ({
            id: `${idPrefix}-${goal.id}`,
            name: goal.text,
            type: 'goal' as const,
            source,
            functionArea,
            children: (goal.programs || []).map((program: StrategicProgram) => ({
              id: `${idPrefix}-${program.id}`,
              name: program.text,
              type: 'program' as const,
              source,
              functionArea
            }))
          }))
        }))
      }))
    }
    
    // Create function-specific hierarchies
    const functionHierarchies = await Promise.all(
      distinctFunctions.map(async (functionName: string) => {
        const functionalData = await DatabaseService.getFunctionalScoreCardDataByFunction(functionName)
        const functionSlug = functionName.toLowerCase().replace(/[^a-z0-9]/g, '-')
        
        return {
          id: `functional-${functionSlug}`,
          name: functionName,
          type: 'root' as const,
          source: 'functional' as const,
          functionArea: functionName,
          children: convertToHierarchy(functionalData, 'functional', functionName)
        }
      })
    )

    // Create combined hierarchy with ORD and dynamic function-based top-level items
    const hierarchicalData: HierarchicalData = {
      combined: [
        {
          id: 'ord-root',
          name: 'ORD',
          type: 'root' as const,
          source: 'ord' as const,
          children: convertToHierarchy(ordData, 'ord')
        },
        ...functionHierarchies
      ]
    }
    
    console.log('API: Converted to combined hierarchy with', hierarchicalData.combined.length, 'top-level items (1 ORD + ' + distinctFunctions.length + ' functions)')
    
    return NextResponse.json(hierarchicalData)
  } catch (error) {
    console.error('Hierarchy GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hierarchical data' },
      { status: 500 }
    )
  }
}