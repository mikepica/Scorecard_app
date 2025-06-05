import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { transformCSVToScoreCardData, loadAndMergeScorecardCSVs, parseCSVString } from "@/utils/csv-parser"

// For best practice, consider using an environment variable for this path in production
const CSV_FILE_PATH = path.join(process.cwd(), "data", "DummyData.csv")

// Synchronous CSV parser for local string content (handles quoted fields)
function parseCSVSync(csvText: string): string[][] {
  const rows = csvText.split("\n")
  return rows.map((row) => {
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
}

export async function POST(request: Request) {
  try {
    const { fieldPath, newValue, type } = await request.json()
    // type: 'program' | 'category' | 'goal'
    // fieldPath: [pillarId, categoryId, goalId, programId] for program, [pillarId, categoryId] for category, [pillarId, categoryId, goalId] for goal

    let csvPath: string, idColumn: string, statusColumn: string, idValue: string, isProgram = false
    let updateRowFn: (row: string[], header: string[]) => void
    if (type === 'program') {
      // Program status update (DummyData.csv)
      csvPath = path.join(process.cwd(), 'data', 'DummyData.csv')
      idColumn = 'StrategicProgramID'
      isProgram = true
      const [pillarId, categoryId, goalId, programId] = fieldPath
      statusColumn = 'Q4 Status' // Default to Q4 for now
      idValue = programId
      updateRowFn = (row: string[], header: string[]) => {
        const statusIdx = header.indexOf(statusColumn)
        if (statusIdx !== -1) row[statusIdx] = newValue || ''
      }
    } else if (type === 'category') {
      // Category status update (Category-status-comments.csv)
      csvPath = path.join(process.cwd(), 'data', 'Category-status-comments.csv')
      idColumn = 'CategoryID'
      const [pillarId, categoryId] = fieldPath
      idValue = categoryId
      statusColumn = 'Status'
      updateRowFn = (row: string[], header: string[]) => {
        const statusIdx = header.indexOf(statusColumn)
        if (statusIdx !== -1) row[statusIdx] = newValue || ''
      }
    } else if (type === 'goal') {
      // Goal status update (Strategic-Goals.csv)
      csvPath = path.join(process.cwd(), 'data', 'Strategic-Goals.csv')
      idColumn = 'StrategicGoalID'
      const [pillarId, categoryId, goalId] = fieldPath
      idValue = goalId
      statusColumn = 'Status'
      updateRowFn = (row: string[], header: string[]) => {
        const statusIdx = header.indexOf(statusColumn)
        if (statusIdx !== -1) row[statusIdx] = newValue || ''
      }
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // Read and parse the CSV
    const csvContent = await fs.readFile(csvPath, 'utf-8')
    const rows = parseCSVString(csvContent)
    const header = rows[0]
    console.log('CSV header row:', header)
    // Normalize header values (remove BOM, whitespace, carriage returns)
    const normalizedHeader = header.map(h => h.replace(/^\uFEFF/, '').replace(/\r/g, '').trim())
    const idIdx = normalizedHeader.indexOf(idColumn)
    if (idIdx === -1) {
      return NextResponse.json({ error: `${idColumn} column not found`, header: normalizedHeader }, { status: 404 })
    }
    // Find the row by ID
    const allIds = rows.slice(1).map(row => row[idIdx])
    console.log(`Update type: ${type}, Looking for ID: ${idValue}, All IDs:`, allIds)
    const rowIdx = rows.findIndex((row, idx) => idx !== 0 && row[idIdx]?.trim() === idValue.trim())
    if (rowIdx === -1) {
      return NextResponse.json({ error: `${type} not found`, allIds, idValue }, { status: 404 })
    }
    // Update the status
    updateRowFn(rows[rowIdx], header)
    // Write back to CSV
    const newCsvContent = rows.map(row => row.join(",")).join("\n")
    await fs.writeFile(csvPath, newCsvContent)

    // Return the updated merged hierarchy
    const mergedData = await loadAndMergeScorecardCSVs()
    return NextResponse.json(mergedData)
  } catch (error) {
    console.error("Error updating status:", error)
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
} 