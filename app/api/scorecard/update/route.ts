import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { transformSpreadsheetToScoreCardData, loadAndMergeScorecardXLSXs, parseXLSXString } from "@/utils/csv-parser"
import * as XLSX from 'xlsx'

// For best practice, consider using an environment variable for this path in production
const XLSX_FILE_PATH = path.join(process.cwd(), "data", "DummyData.xlsx")

// Synchronous XLSX parser for local buffer content
function parseXLSXSync(buffer: Buffer): string[][] {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false })
}

export async function POST(request: Request) {
  try {
    const { fieldPath, newValue, type, quarter, field }: { 
      fieldPath: string[], 
      newValue: string, 
      type: string, 
      quarter?: 'q1' | 'q2' | 'q3' | 'q4',
      field?: string 
    } = await request.json()
    // type: 'program' | 'category' | 'goal' | 'program-text' | 'program-objective' | 'program-progress' | 'goal-text' | 'category-name'
    // fieldPath: [pillarId, categoryId, goalId, programId] for program, [pillarId, categoryId] for category, [pillarId, categoryId, goalId] for goal

    let xlsxPath: string, idColumn: string, statusColumn: string, idValue: string, isProgram = false
    let updateRowFn: (row: string[], header: string[], normalizedHeader: string[]) => void
    
    if (type === 'program') {
      // Program status update (DummyData.xlsx)
      xlsxPath = path.join(process.cwd(), 'data', 'DummyData.xlsx')
      idColumn = 'StrategicProgramID'
      isProgram = true
      const [pillarId, categoryId, goalId, programId] = fieldPath
      // Use the quarter parameter to determine which status column to update
      const quarterToStatusColumn = {
        q1: 'Q1 Status',
        q2: 'Q2 Status',
        q3: 'Q3 Status',
        q4: 'Q4 Status',
      }
      statusColumn = quarter && quarterToStatusColumn[quarter] ? quarterToStatusColumn[quarter] : 'Q4 Status'
      idValue = programId
      updateRowFn = (row: string[], header: string[], normalizedHeader: string[]) => {
        const statusIdx = normalizedHeader.indexOf(statusColumn)
        if (statusIdx !== -1) row[statusIdx] = newValue || ''
      }
    } else if (type === 'program-text') {
      // Program text update (DummyData.xlsx)
      xlsxPath = path.join(process.cwd(), 'data', 'DummyData.xlsx')
      idColumn = 'StrategicProgramID'
      const [pillarId, categoryId, goalId, programId] = fieldPath
      idValue = programId
      updateRowFn = (row: string[], header: string[], normalizedHeader: string[]) => {
        const textIdx = normalizedHeader.indexOf('StrategicProgram')
        if (textIdx !== -1) row[textIdx] = newValue || ''
      }
    } else if (type === 'program-objective') {
      // Program quarterly objective update (DummyData.xlsx)
      xlsxPath = path.join(process.cwd(), 'data', 'DummyData.xlsx')
      idColumn = 'StrategicProgramID'
      const [pillarId, categoryId, goalId, programId] = fieldPath
      idValue = programId
      const quarterToObjectiveColumn = {
        q1: 'Q1 Objective',
        q2: 'Q2 Objective',
        q3: 'Q3 Objective',
        q4: 'Q4 Objective',
      }
      const objectiveColumn = quarter && quarterToObjectiveColumn[quarter] ? quarterToObjectiveColumn[quarter] : 'Q4 Objective'
      updateRowFn = (row: string[], header: string[], normalizedHeader: string[]) => {
        const objIdx = normalizedHeader.indexOf(objectiveColumn)
        if (objIdx !== -1) row[objIdx] = newValue || ''
      }
    } else if (type === 'program-progress') {
      // Program progress updates (DummyData.xlsx)
      xlsxPath = path.join(process.cwd(), 'data', 'DummyData.xlsx')
      idColumn = 'StrategicProgramID'
      const [pillarId, categoryId, goalId, programId] = fieldPath
      idValue = programId
      updateRowFn = (row: string[], header: string[], normalizedHeader: string[]) => {
        const progressIdx = normalizedHeader.indexOf('Progress Updates')
        if (progressIdx !== -1) row[progressIdx] = newValue || ''
      }
    } else if (type === 'category') {
      // Category status update (Category-status-comments.xlsx)
      xlsxPath = path.join(process.cwd(), 'data', 'Category-status-comments.xlsx')
      idColumn = 'CategoryID'
      const [pillarId, categoryId] = fieldPath
      idValue = categoryId
      statusColumn = 'Status'
      updateRowFn = (row: string[], header: string[], normalizedHeader: string[]) => {
        const statusIdx = normalizedHeader.indexOf(statusColumn)
        if (statusIdx !== -1) row[statusIdx] = newValue || ''
      }
    } else if (type === 'category-name') {
      // Category name update (Category-status-comments.xlsx)
      xlsxPath = path.join(process.cwd(), 'data', 'Category-status-comments.xlsx')
      idColumn = 'CategoryID'
      const [pillarId, categoryId] = fieldPath
      idValue = categoryId
      updateRowFn = (row: string[], header: string[], normalizedHeader: string[]) => {
        const nameIdx = normalizedHeader.indexOf('Category')
        if (nameIdx !== -1) row[nameIdx] = newValue || ''
      }
    } else if (type === 'goal') {
      // Goal status update (Strategic-Goals.xlsx)
      xlsxPath = path.join(process.cwd(), 'data', 'Strategic-Goals.xlsx')
      idColumn = 'StrategicGoalID'
      const [pillarId, categoryId, goalId] = fieldPath
      idValue = goalId
      statusColumn = 'Status'
      updateRowFn = (row: string[], header: string[], normalizedHeader: string[]) => {
        const statusIdx = normalizedHeader.indexOf(statusColumn)
        if (statusIdx !== -1) row[statusIdx] = newValue || ''
      }
    } else if (type === 'goal-text') {
      // Goal text update (Strategic-Goals.xlsx)
      xlsxPath = path.join(process.cwd(), 'data', 'Strategic-Goals.xlsx')
      idColumn = 'StrategicGoalID'
      const [pillarId, categoryId, goalId] = fieldPath
      idValue = goalId
      updateRowFn = (row: string[], header: string[], normalizedHeader: string[]) => {
        const textIdx = normalizedHeader.indexOf('StrategicGoal')
        if (textIdx !== -1) row[textIdx] = newValue || ''
      }
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // Read and parse the XLSX
    const xlsxBuffer = await fs.readFile(xlsxPath)
    const rows = parseXLSXSync(xlsxBuffer)
    const header = rows[0]
    const normalizedHeader = header.map(h => h.replace(/^\uFEFF/, '').replace(/\r/g, '').trim())
    const idIdx = normalizedHeader.indexOf(idColumn)
    if (idIdx === -1) {
      return NextResponse.json({ error: `${idColumn} column not found`, header: normalizedHeader }, { status: 404 })
    }
    // Find the row by ID (case-insensitive comparison)
    const allIds = rows.slice(1).map(row => row[idIdx])
    const rowIdx = rows.findIndex((row, idx) => idx !== 0 && row[idIdx]?.trim().toLowerCase() === idValue.trim().toLowerCase())
    if (rowIdx === -1) {
      console.log(`DEBUG: ${type} not found. Looking for idValue: "${idValue}", available IDs:`, allIds, 'idColumn:', idColumn, 'xlsxPath:', xlsxPath)
      return NextResponse.json({ error: `${type} not found`, allIds, idValue, idColumn, xlsxPath }, { status: 404 })
    }
    // Update the status
    updateRowFn(rows[rowIdx], header, normalizedHeader)
    // Write back to XLSX
    const worksheet = XLSX.utils.aoa_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    try {
      await fs.writeFile(xlsxPath, buffer)
    } catch (writeError) {
      return NextResponse.json({ error: 'Failed to write XLSX file' }, { status: 500 })
    }

    // Return the updated merged hierarchy
    const mergedData = await loadAndMergeScorecardXLSXs()
    return NextResponse.json(mergedData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
} 