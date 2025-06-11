import { NextResponse } from "next/server"
import { loadAndMergeScorecardCSVs } from '@/utils/csv-parser'
import { DatabaseService } from '@/lib/database'

export async function GET() {
  try {
    // Feature flag to switch between file and database mode
    const useDatabaseMode = process.env.FEATURE_FLAG_USE_DATABASE === 'true'
    
    let mergedData
    
    if (useDatabaseMode) {
      console.log('🗄️  Using database mode for scorecard data')
      mergedData = await DatabaseService.getScoreCardData()
    } else {
      console.log('📁 Using file mode for scorecard data')
      mergedData = await loadAndMergeScorecardCSVs()
    }
    
    return NextResponse.json(mergedData)
  } catch (error) {
    console.error('Scorecard API error:', error)
    const errorMessage = process.env.FEATURE_FLAG_USE_DATABASE === 'true' 
      ? 'Failed to read database' 
      : 'Failed to read CSV files'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Here you would typically validate the data structure
    // and save it to a database

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
  }
}