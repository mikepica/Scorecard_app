import { NextResponse } from "next/server"
import { DatabaseService } from '@/lib/database'

export async function GET() {
  try {
    console.log('🗄️  Loading distinct functions from functional_programs table')
    const functions = await DatabaseService.getDistinctFunctions()
    return NextResponse.json(functions)
  } catch (error) {
    console.error('Functions API error:', error)
    return NextResponse.json(
      { error: 'Failed to load function list' },
      { status: 500 }
    )
  }
}