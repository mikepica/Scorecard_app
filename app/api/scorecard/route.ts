import { NextResponse } from "next/server"
import { scorecardData } from "@/data/scorecard-data"
import { promises as fs } from 'fs'
import { parseCSV, transformCSVToScoreCardData, loadAndMergeScorecardCSVs } from '@/utils/csv-parser'
import { config } from '@/config'

export async function GET() {
  try {
    const mergedData = await loadAndMergeScorecardCSVs()
    return NextResponse.json(mergedData)
  } catch (error) {
    console.error('Error reading CSV files:', error)
    return NextResponse.json(
      { error: 'Failed to read CSV files' },
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