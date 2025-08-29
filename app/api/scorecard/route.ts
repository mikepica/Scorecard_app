import { NextResponse } from "next/server"
import { DatabaseService } from '@/lib/database'

export async function GET() {
  try {
    console.log('🗄️  Loading scorecard data from database')
    const mergedData = await DatabaseService.getScoreCardData()
    return NextResponse.json(mergedData)
  } catch (error) {
    console.error('Scorecard API error:', error)
    return NextResponse.json(
      { error: 'Failed to read database' },
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
    console.error('POST error:', error)
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
  }
}