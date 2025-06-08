import type { ScoreCardData } from "@/types/scorecard"
import { parseXLSX, transformSpreadsheetToScoreCardData } from "@/utils/csv-parser"

// Default data as fallback
const defaultData: ScoreCardData = {
  pillars: [
    {
      id: "p1",
      name: "Loading...",
      categories: [
        {
          id: "c1",
          name: "Loading categories...",
          pillar: "Loading...",
          goals: [
            {
              id: "g1",
              text: "Loading goals...",
              q1Status: "on-track",
              programs: [],
            },
          ],
        },
      ],
    },
  ],
}

// This will be populated when the data is loaded
let loadedData: ScoreCardData = defaultData

// Function to load data from CSV
export async function loadScorecardData(): Promise<ScoreCardData> {
  try {
    const response = await fetch('/api/scorecard')
    if (!response.ok) {
      throw new Error('Failed to fetch scorecard data')
    }
    const transformedData = await response.json()

    // Update the loaded data
    loadedData = transformedData
    return transformedData
  } catch (error) {
    console.error("Error loading scorecard data:", error)
    return defaultData
  }
}

// Export the data
export const scorecardData: ScoreCardData = loadedData