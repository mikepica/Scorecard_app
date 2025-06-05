import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { transformCSVToScoreCardData } from "@/utils/csv-parser"

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
    const { fieldPath, newValue } = await request.json()
    const [programId, quarter, fieldType] = fieldPath

    // Read the CSV file
    const csvContent = await fs.readFile(CSV_FILE_PATH, "utf-8")
    const rows = parseCSVSync(csvContent)

    // Find the index of the StrategicProgramID column
    const idColumnIndex = rows[0].findIndex(header => header.trim().toLowerCase() === "strategicprogramid")
    if (idColumnIndex === -1) {
      console.error("StrategicProgramID column not found in CSV header.", rows[0])
      return NextResponse.json({ error: "StrategicProgramID column not found" }, { status: 404 })
    }

    // Find the program row by StrategicProgramID
    const programIndex = rows.findIndex((row, idx) => idx !== 0 && row[idColumnIndex]?.trim() === programId.trim())
    if (programIndex === -1) {
      console.error("Program not found. programId:", programId, "Available IDs:", rows.map(r => r[idColumnIndex]))
      return NextResponse.json({ error: "Program not found" }, { status: 404 })
    }

    // Update the status
    const statusColumnIndex = rows[0].findIndex(header => header.trim() === `${quarter.toUpperCase()} Status`)
    if (statusColumnIndex === -1) {
      console.error("Status column not found. Looking for:", `${quarter.toUpperCase()} Status`, "Available headers:", rows[0])
      return NextResponse.json({ error: "Status column not found" }, { status: 404 })
    }

    rows[programIndex][statusColumnIndex] = newValue || ""

    // Write back to CSV
    const newCsvContent = rows.map(row => row.join(",")).join("\n")
    await fs.writeFile(CSV_FILE_PATH, newCsvContent)

    // Transform and return updated data
    const transformedData = transformCSVToScoreCardData(rows)
    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("Error updating status:", error)
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
} 