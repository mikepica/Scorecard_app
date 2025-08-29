import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const { fieldPath, newValue, type, quarter, field }: { 
      fieldPath: string[], 
      newValue: string, 
      type: string, 
      quarter?: 'q1' | 'q2' | 'q3' | 'q4',
      field?: string 
    } = await request.json()
    // type: 'program' | 'category' | 'goal' | 'program-text' | 'program-objective' | 'program-progress' | 'program-quarter-progress' | 'goal-text' | 'category-name'
    // fieldPath: [pillarId, categoryId, goalId, programId] for program, [pillarId, categoryId] for category, [pillarId, categoryId, goalId] for goal

    console.log('🗄️  Processing database update operation:', type)
    try {
      const updatedData = await DatabaseService.performUpdate(type, fieldPath, newValue, quarter, field)
      return NextResponse.json(updatedData)
    } catch (dbError) {
      console.error('Database update error:', dbError)
      return NextResponse.json(
        { error: `Database update failed: ${dbError.message}` },
        { status: 500 }
      )
    }

  } catch (error) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
} 