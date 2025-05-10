import type { ScoreCardData, Pillar, Category, StrategicGoal, StrategicProgram } from "@/types/scorecard"

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

// Function to transform CSV data to ScoreCardData
export function transformCSVToScoreCardData(csvData: string[][]): ScoreCardData {
  const headers = csvData[0]
  const dataRows = csvData.slice(1).filter((row) => row.length > 1) // Skip empty rows

  const pillarsMap = new Map<string, Pillar>()
  const categoriesMap = new Map<string, Category>()
  const goalsMap = new Map<string, StrategicGoal>()

  // Generate unique IDs
  let pillarId = 1
  let categoryId = 1
  let goalId = 1
  let programId = 1

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

    // Map status values to the app's expected format
    const mapStatus = (status: string | null): "exceeded" | "on-track" | "delayed" | "missed" | undefined => {
      if (!status) return undefined

      switch (status.toLowerCase()) {
        case "green":
          return "on-track"
        case "amber":
          return "delayed"
        case "red":
          return "missed"
        case "blue":
          return "exceeded"
        default:
          return "on-track"
      }
    }

    // Create program
    const program: StrategicProgram = {
      id: `pr${programId++}`,
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
    }

    // Get or create pillar
    let pillar = pillarsMap.get(pillarName)
    if (!pillar) {
      pillar = {
        id: `p${pillarId++}`,
        name: pillarName,
        categories: [],
      }
      pillarsMap.set(pillarName, pillar)
    }

    // Get or create category
    const categoryKey = `${pillarName}:${categoryName}`
    let category = categoriesMap.get(categoryKey)
    if (!category) {
      category = {
        id: `c${categoryId++}`,
        name: categoryName,
        pillar: pillarName,
        goals: [],
      }
      categoriesMap.set(categoryKey, category)
      pillar.categories.push(category)
    }

    // Get or create goal
    const goalKey = `${pillarName}:${categoryName}:${goalText}`
    let goal = goalsMap.get(goalKey)
    if (!goal) {
      goal = {
        id: `g${goalId++}`,
        text: goalText,
        programs: [],
      }
      goalsMap.set(goalKey, goal)
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
