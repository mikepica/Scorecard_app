import { NextResponse } from "next/server"
import { scorecardData } from "@/data/scorecard-data"
import { promises as fs } from 'fs'
import { parseCSV, transformCSVToScoreCardData } from '@/utils/csv-parser'

export async function GET() {
  try {
    const csvPath = '/Users/mikepica/AZ_Projects/Scorecard_App/Dummy Data o3 (1).csv'
    const csvText = await fs.readFile(csvPath, 'utf-8')
    const csvData = csvText.split('\n').map(row => {
      const values: string[] = []
      let inQuotes = false
      let currentValue = ""

      for (let i = 0; i < row.length; i++) {
        const char = row[i]

        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          values.push(currentValue)
          currentValue = ""
        } else {
          currentValue += char
        }
      }

      values.push(currentValue)
      return values
    })

    const transformedData = transformCSVToScoreCardData(csvData)
    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error reading CSV file:', error)
    return NextResponse.json(
      { error: 'Failed to read CSV file' },
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