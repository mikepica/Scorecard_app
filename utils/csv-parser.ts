import type { ScoreCardData, Pillar, Category, StrategicGoal, StrategicProgram } from "@/types/scorecard"
import { promises as fs } from 'fs'
import path from 'path'

// Helper function to map status values
function mapStatus(status: string | null): 'exceeded' | 'on-track' | 'delayed' | 'missed' | undefined {
  if (!status) return undefined
  switch (status.toLowerCase()) {
    case 'green':
    case 'on-track':
      return 'on-track'
    case 'amber':
    case 'delayed':
      return 'delayed'
    case 'red':
    case 'missed':
      return 'missed'
    case 'blue':
    case 'exceeded':
      return 'exceeded'
    default:
      return undefined
  }
}

// Function to parse CSV data
export async function parseCSV(url: string): Promise<string[][]> {
  const response = await fetch(url)
  const csvText = await response.text()

  // Split by lines and then by commas, handling quoted values
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

    // Add the last value
    values.push(currentValue)

    return values
  })
}

// Helper: parse CSV string to array
export function parseCSVString(csvText: string): string[][] {
  const rows = csvText.split('\n')
  return rows.map((row) => {
    const values: string[] = []
    let inQuotes = false
    let currentValue = ''
    for (let i = 0; i < row.length; i++) {
      const char = row[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue)
        currentValue = ''
      } else {
        currentValue += char
      }
    }
    values.push(currentValue)
    return values
  })
}

// Function to transform CSV data to ScoreCardData
export function transformCSVToScoreCardData(csvData: string[][]): ScoreCardData {
  const headers = csvData[0]
  const dataRows = csvData.slice(1).filter((row) => row.length > 1) // Skip empty rows

  const pillarsMap = new Map<string, Pillar>()
  const categoriesMap = new Map<string, Category>()
  const goalsMap = new Map<string, StrategicGoal>()

  // Build lookup maps for category and goal by ID
  const catHeader = csvData[1]
  const catIdIdx = catHeader.indexOf('CategoryID')
  const catPillarIdIdx = catHeader.indexOf('StrategicPillarID')
  const catNameIdx = catHeader.indexOf('Category')
  const catStatusIdx = catHeader.indexOf('Status')
  const catCommentsIdx = catHeader.indexOf('Comments')
  const catMap = new Map<string, { id?: string, pillarId?: string, status?: string, comments?: string, name?: string }>()
  for (let i = 1; i < csvData[1].length; i++) {
    const row = csvData[1][i]
    if (!row[catIdIdx]) continue
    catMap.set(row[catNameIdx], {
      id: row[catIdIdx],
      pillarId: row[catPillarIdIdx],
      status: row[catStatusIdx],
      comments: row[catCommentsIdx],
      name: row[catNameIdx],
    })
  }

  const goalHeader = csvData[2]
  const goalIdIdx = goalHeader.indexOf('StrategicGoalID')
  const goalCatIdIdx = goalHeader.indexOf('CategoryID')
  const goalPillarIdIdx = goalHeader.indexOf('StrategicPillarID')
  const goalNameIdx = goalHeader.indexOf('Strategic Goal')
  const goalStatusIdx = goalHeader.indexOf('Status')
  const goalCommentsIdx = goalHeader.indexOf('Comments')
  const goalMap = new Map<string, { id?: string, catId?: string, pillarId?: string, status?: string, comments?: string }>()
  for (let i = 1; i < csvData[2].length; i++) {
    const row = csvData[2][i]
    if (!row[goalIdIdx]) continue
    goalMap.set(row[goalNameIdx], {
      id: row[goalIdIdx],
      catId: row[goalCatIdIdx],
      pillarId: row[goalPillarIdIdx],
      status: row[goalStatusIdx],
      comments: row[goalCommentsIdx],
    })
  }

  // Prepare main header and indices
  const mainHeader = dataRows[0].map(h => h.replace(/^\uFEFF/, '').replace(/\r/g, '').trim())
  const progGoalIdIdx = mainHeader.indexOf('StrategicGoalID')
  const progCatIdIdx = mainHeader.indexOf('CategoryID')
  const progPillarIdIdx = mainHeader.indexOf('StrategicPillarID')
  const progIdIdx = mainHeader.indexOf('StrategicProgramID')
  const progTextIdx = mainHeader.indexOf('Strategic Program')
  const progQ1ObjIdx = mainHeader.indexOf('Q1 Objective')
  const progQ2ObjIdx = mainHeader.indexOf('Q2 Objective')
  const progQ3ObjIdx = mainHeader.indexOf('Q3 Objective')
  const progQ4ObjIdx = mainHeader.indexOf('Q4 Objective')
  const progOrdLtIdx = mainHeader.indexOf('ORD LT Sponsor(s)')
  const progSponsorsIdx = mainHeader.indexOf('Sponsor(s)/Lead(s)')
  const progOwnersIdx = mainHeader.indexOf('Reporting owner(s)')
  const progQ1StatusIdx = mainHeader.indexOf('Q1 Status')
  const progQ2StatusIdx = mainHeader.indexOf('Q2 Status')
  const progQ3StatusIdx = mainHeader.indexOf('Q3 Status')
  const progQ4StatusIdx = mainHeader.indexOf('Q4 Status')
  const progQ1CommentsIdx = mainHeader.indexOf('Q1 Comments')
  const progQ2CommentsIdx = mainHeader.indexOf('Q2 Comments')
  const progQ3CommentsIdx = mainHeader.indexOf('Q3 Comments')
  const progQ4CommentsIdx = mainHeader.indexOf('Q4 Comments')

  dataRows.forEach((row) => {
    const rowData = headers.reduce(
      (obj, header, index) => {
        obj[header] = row[index] || null
        return obj
      },
      {} as Record<string, string | null>,
    )

    const pillarName = rowData["Strategic Pillar"] || "Unknown Pillar"
    const categoryName = rowData["Category"] || "Unknown Category"
    const goalText = rowData["Strategic Goal"] || "Unknown Goal"
    const programText = rowData["Strategic Program"] || "Unknown Program"

    // Get IDs from the data
    const pillarId = rowData["StrategicPillarID"] || "Unknown"
    const categoryId = rowData["CategoryID"] || "Unknown"
    const goalId = rowData["StrategicGoalID"] || "Unknown"
    const programId = rowData["StrategicProgramID"] || "Unknown"

    // Create program
    const program: StrategicProgram = {
      id: programId,
      text: programText,
      q1Objective: rowData["Q1 Objective"] || undefined,
      q2Objective: rowData["Q2 Objective"] || undefined,
      q3Objective: rowData["Q3 Objective"] || undefined,
      q4Objective: rowData["Q4 Objective"] || undefined,
      ordLtSponsors: rowData["ORD LT Sponsor(s)"] || undefined,
      sponsorsLeads: rowData["Sponsor(s)/Lead(s)"] || undefined,
      reportingOwners: rowData["Reporting owner(s)"] || undefined,
      q1Status: mapStatus(rowData["Q1 Status"]),
      q2Status: mapStatus(rowData["Q2 Status"]),
      q3Status: mapStatus(rowData["Q3 Status"]),
      q4Status: mapStatus(rowData["Q4 Status"]),
      q1Comments: rowData["Q1 Comments"] || undefined,
      q2Comments: rowData["Q2 Comments"] || undefined,
      q3Comments: rowData["Q3 Comments"] || undefined,
      q4Comments: rowData["Q4 Comments"] || undefined,
      strategicGoalId: goalId,
      categoryId: categoryId,
      strategicPillarId: pillarId
    }

    // Get or create pillar
    let pillar = pillarsMap.get(pillarId)
    if (!pillar) {
      pillar = {
        id: pillarId,
        name: pillarName,
        categories: [],
      }
      pillarsMap.set(pillarId, pillar)
    }

    // Get or create category
    let category = categoriesMap.get(categoryId)
    if (!category) {
      const catInfo = catMap.get(categoryName) || {}
      category = {
        id: categoryId,
        name: categoryName,
        status: mapStatus(catInfo.status || null),
        comments: catInfo.comments,
        goals: [],
        strategicPillarId: pillarId
      }
      categoriesMap.set(categoryId, category)
      pillar.categories.push(category)
    }

    // Get or create goal
    let goal = goalsMap.get(goalId)
    if (!goal) {
      const goalInfo = goalMap.get(goalText) || {}
      goal = {
        id: goalId,
        text: goalText,
        status: mapStatus(goalInfo.status || null),
        comments: goalInfo.comments,
        programs: [],
        categoryId: categoryId,
        strategicPillarId: pillarId
      }
      goalsMap.set(goalId, goal)
      category.goals.push(goal)
    }

    // Add program to goal
    if (!goal.programs) {
      goal.programs = []
    }
    goal.programs.push(program)
  })

  return {
    pillars: Array.from(pillarsMap.values()),
  }
}

// New: Load and parse all CSVs, merge by ID
export async function loadAndMergeScorecardCSVs(): Promise<ScoreCardData> {
  // File paths
  const dataDir = path.join(process.cwd(), 'data')
  const mainPath = path.join(dataDir, 'DummyData.csv')
  const catPath = path.join(dataDir, 'Category-status-comments.csv')
  const goalPath = path.join(dataDir, 'Strategic-Goals.csv')

  // Read files
  const [mainText, catText, goalText] = await Promise.all([
    fs.readFile(mainPath, 'utf-8'),
    fs.readFile(catPath, 'utf-8'),
    fs.readFile(goalPath, 'utf-8'),
  ])
  const mainRows = parseCSVString(mainText)
  const catRows = parseCSVString(catText)
  const goalRows = parseCSVString(goalText)

  // Build lookup maps by ID
  // Category map: CategoryID -> { ... }
  const catHeader = catRows[0].map(h => h.replace(/^\uFEFF/, '').replace(/\r/g, '').trim())
  const catIdIdx = catHeader.indexOf('CategoryID')
  const catNameIdx = catHeader.indexOf('Category')
  const catStatusIdx = catHeader.indexOf('Status')
  const catCommentsIdx = catHeader.indexOf('Comments')
  const catMap = new Map<string, { id: string, name: string, status?: string, comments?: string }>()
  for (let i = 1; i < catRows.length; i++) {
    const row = catRows[i]
    if (!row[catIdIdx]) continue
    catMap.set(row[catIdIdx], {
      id: row[catIdIdx],
      name: row[catNameIdx],
      status: row[catStatusIdx],
      comments: row[catCommentsIdx],
    })
  }

  // Goal map: StrategicGoalID -> { ... }
  const goalHeader = goalRows[0].map(h => h.replace(/^\uFEFF/, '').replace(/\r/g, '').trim())
  const goalIdIdx = goalHeader.indexOf('StrategicGoalID')
  const goalTextIdx = goalHeader.indexOf('Strategic Goal')
  const goalStatusIdx = goalHeader.indexOf('Status')
  const goalCommentsIdx = goalHeader.indexOf('Comments')
  const goalCatIdIdx = goalHeader.indexOf('CategoryID')
  const goalMap = new Map<string, { id: string, text: string, status?: string, comments?: string, categoryId: string }>()
  for (let i = 1; i < goalRows.length; i++) {
    const row = goalRows[i]
    if (!row[goalIdIdx]) continue
    goalMap.set(row[goalIdIdx], {
      id: row[goalIdIdx],
      text: row[goalTextIdx],
      status: row[goalStatusIdx],
      comments: row[goalCommentsIdx],
      categoryId: row[goalCatIdIdx],
    })
  }

  // Prepare main header and indices
  const mainHeader = mainRows[0].map(h => h.replace(/^\uFEFF/, '').replace(/\r/g, '').trim())
  const progGoalIdIdx = mainHeader.indexOf('StrategicGoalID')
  const progIdIdx = mainHeader.indexOf('StrategicProgramID')
  const progTextIdx = mainHeader.indexOf('Strategic Program')
  const progQ1ObjIdx = mainHeader.indexOf('Q1 Objective')
  const progQ2ObjIdx = mainHeader.indexOf('Q2 Objective')
  const progQ3ObjIdx = mainHeader.indexOf('Q3 Objective')
  const progQ4ObjIdx = mainHeader.indexOf('Q4 Objective')
  const progOrdLtIdx = mainHeader.indexOf('ORD LT Sponsor(s)')
  const progSponsorsIdx = mainHeader.indexOf('Sponsor(s)/Lead(s)')
  const progOwnersIdx = mainHeader.indexOf('Reporting owner(s)')
  const progQ1StatusIdx = mainHeader.indexOf('Q1 Status')
  const progQ2StatusIdx = mainHeader.indexOf('Q2 Status')
  const progQ3StatusIdx = mainHeader.indexOf('Q3 Status')
  const progQ4StatusIdx = mainHeader.indexOf('Q4 Status')
  const progQ1CommentsIdx = mainHeader.indexOf('Q1 Comments')
  const progQ2CommentsIdx = mainHeader.indexOf('Q2 Comments')
  const progQ3CommentsIdx = mainHeader.indexOf('Q3 Comments')
  const progQ4CommentsIdx = mainHeader.indexOf('Q4 Comments')
  const progCatIdIdx = mainHeader.indexOf('CategoryID')
  const progPillarIdx = mainHeader.indexOf('Strategic Pillar')

  // Build maps for pillar, category, and goal
  const pillarsMap = new Map<string, Pillar>()
  const categoriesMap = new Map<string, Category>()
  const goalsMap = new Map<string, StrategicGoal>()

  // Parse programs and build hierarchy by IDs
  for (let i = 1; i < mainRows.length; i++) {
    const row = mainRows[i]
    if (!row[progGoalIdIdx] || !row[progIdIdx] || !row[progCatIdIdx]) continue
    const pillarName = row[progPillarIdx] || 'Unknown Pillar'
    const categoryId = row[progCatIdIdx]
    const goalId = row[progGoalIdIdx]

    // --- Pillar ---
    let pillar = pillarsMap.get(pillarName)
    if (!pillar) {
      pillar = {
        id: `pillar-${pillarName}`,
        name: pillarName,
        categories: [],
      }
      pillarsMap.set(pillarName, pillar)
    }

    // --- Category ---
    let category = categoriesMap.get(categoryId)
    if (!category) {
      const catInfo = catMap.get(categoryId)
      category = {
        id: categoryId,
        name: catInfo?.name || categoryId,
        status: mapStatus(catInfo?.status || null),
        comments: catInfo?.comments,
        goals: [],
        strategicPillarId: pillarName
      }
      categoriesMap.set(categoryId, category)
      pillar.categories.push(category)
    }

    // --- Goal ---
    let goal = goalsMap.get(goalId)
    if (!goal) {
      const goalInfo = goalMap.get(goalId)
      goal = {
        id: goalId,
        text: goalInfo?.text || goalId,
        status: mapStatus(goalInfo?.status || null),
        comments: goalInfo?.comments,
        programs: [],
        categoryId: categoryId,
        strategicPillarId: pillarName
      }
      goalsMap.set(goalId, goal)
      if (category) {
        category.goals.push(goal)
      }
    }

    // --- Program ---
    const program: StrategicProgram = {
      id: row[progIdIdx],
      text: row[progTextIdx],
      q1Objective: row[progQ1ObjIdx],
      q2Objective: row[progQ2ObjIdx],
      q3Objective: row[progQ3ObjIdx],
      q4Objective: row[progQ4ObjIdx],
      ordLtSponsors: row[progOrdLtIdx],
      sponsorsLeads: row[progSponsorsIdx],
      reportingOwners: row[progOwnersIdx],
      q1Status: mapStatus(row[progQ1StatusIdx]),
      q2Status: mapStatus(row[progQ2StatusIdx]),
      q3Status: mapStatus(row[progQ3StatusIdx]),
      q4Status: mapStatus(row[progQ4StatusIdx]),
      q1Comments: row[progQ1CommentsIdx],
      q2Comments: row[progQ2CommentsIdx],
      q3Comments: row[progQ3CommentsIdx],
      q4Comments: row[progQ4CommentsIdx],
      strategicGoalId: goalId,
      categoryId: categoryId,
      strategicPillarId: pillarName
    }
    if (goal) {
      goal.programs!.push(program)
    }
  }

  return { pillars: Array.from(pillarsMap.values()) }
}
