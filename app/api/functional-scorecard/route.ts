import { NextResponse } from "next/server"
import { DatabaseService } from '@/lib/database'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const selectedFunction = searchParams.get('function')
    
    console.log('🗄️  Loading functional scorecard data from database', selectedFunction ? `for function: ${selectedFunction}` : '')
    
    const functionalData = selectedFunction 
      ? await DatabaseService.getFunctionalScoreCardDataByFunction(selectedFunction)
      : await DatabaseService.getFunctionalScoreCardData()
      
    return NextResponse.json(functionalData)
  } catch (error) {
    console.error('Functional Scorecard API error:', error)
    return NextResponse.json(
      { error: 'Failed to read functional database' },
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
    console.error('Functional POST error:', error)
    return NextResponse.json({ error: "Invalid functional data format" }, { status: 400 })
  }
}