import { NextResponse } from "next/server"
import { DatabaseService } from '@/lib/database'
import type { ScoreCardData, Pillar, Category, StrategicGoal, StrategicProgram } from '@/types/scorecard'

interface HierarchicalItem {
  id: string
  name: string
  type: 'pillar' | 'category' | 'goal' | 'program'
  children?: HierarchicalItem[]
}

interface HierarchicalData {
  functional: HierarchicalItem[]
  ord: HierarchicalItem[]
}

export async function GET() {
  try {
    console.log('API: Fetching hierarchical data for alignments')
    
    // Fetch both ORD and Functional scorecard data
    const [ordData, functionalData] = await Promise.all([
      DatabaseService.getScoreCardData(),
      DatabaseService.getFunctionalScoreCardData()
    ])
    
    console.log('API: Fetched data - ORD pillars:', ordData.pillars?.length || 0, 'Functional pillars:', functionalData.pillars?.length || 0)
    
    // Convert scorecard data to hierarchical structure
    const convertToHierarchy = (data: ScoreCardData): HierarchicalItem[] => {
      if (!data.pillars || !Array.isArray(data.pillars)) {
        return []
      }

      return data.pillars.map((pillar: Pillar) => ({
        id: pillar.id,
        name: pillar.name,
        type: 'pillar' as const,
        children: (pillar.categories || []).map((category: Category) => ({
          id: category.id,
          name: category.name,
          type: 'category' as const,
          children: (category.goals || []).map((goal: StrategicGoal) => ({
            id: goal.id,
            name: goal.text,
            type: 'goal' as const,
            children: (goal.programs || []).map((program: StrategicProgram) => ({
              id: program.id,
              name: program.text,
              type: 'program' as const
            }))
          }))
        }))
      }))
    }
    
    const hierarchicalData: HierarchicalData = {
      ord: convertToHierarchy(ordData),
      functional: convertToHierarchy(functionalData)
    }
    
    console.log('API: Converted to hierarchy - ORD items:', hierarchicalData.ord.length, 'Functional items:', hierarchicalData.functional.length)
    
    return NextResponse.json(hierarchicalData)
  } catch (error) {
    console.error('Hierarchy GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hierarchical data' },
      { status: 500 }
    )
  }
}