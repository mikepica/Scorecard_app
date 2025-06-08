import type { ScoreCardData, Pillar, Category, StrategicGoal, StrategicProgram } from "@/types/scorecard";
import { promises as fs } from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

// Helper function to map status values
function mapStatus(status: string | null | undefined): "exceeded" | "on-track" | "delayed" | "missed" | undefined {
  if (!status || status.trim() === '') return undefined;
  
  const statusMap: { [key: string]: "exceeded" | "on-track" | "delayed" | "missed" } = {
    "Green": "on-track",
    "Blue": "exceeded",
    "Amber": "delayed",
    "Red": "missed",
    "exceeded": "exceeded",
    "on-track": "on-track",
    "delayed": "delayed",
    "missed": "missed"
  };
  
  return statusMap[status.trim()];
}

// Helper to normalize IDs
function norm(id: string | undefined | null): string {
  return (id || '').trim().toUpperCase();
}

// Helper to trim display text
function trimText(val: string | undefined | null): string {
  return (val || '').trim();
}

// Helper to get column index safely
function colIdx(headers: string[], col: string): number {
  const idx = headers.findIndex(h => h.trim() === col.trim());
  return idx;
}

// Function to parse XLSX data from file
export async function parseXLSX(filePath: string): Promise<string[][]> {
  const fullPath = path.join(process.cwd(), filePath)
  const buffer = await fs.readFile(fullPath)
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false })
}

// Helper: parse XLSX string to array (for backwards compatibility)
export function parseXLSXString(xlsxBuffer: Buffer): string[][] {
  const workbook = XLSX.read(xlsxBuffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false })
}

// Legacy function name for backwards compatibility
export function parseCSVString(csvText: string): string[][] {
  // This function is kept for backwards compatibility in case it's used elsewhere
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

// Function to transform spreadsheet data to ScoreCardData
export function transformSpreadsheetToScoreCardData(data: string[][]): ScoreCardData {
  const headers = data[0]
  const dataRows = data.slice(1).filter((row) => row.length > 1) // Skip empty rows

  const pillarsMap = new Map<string, Pillar>()
  const categoriesMap = new Map<string, Category>()
  const goalsMap = new Map<string, StrategicGoal>()

  // Build lookup maps for category and goal by ID
  const catHeader = data[1]
  const catIdIdx = catHeader.indexOf('CategoryID')
  const catPillarIdIdx = catHeader.indexOf('StrategicPillarID')
  const catNameIdx = catHeader.indexOf('Category')
  const catStatusIdx = catHeader.indexOf('Status')
  const catCommentsIdx = catHeader.indexOf('Comments')
  const catMap = new Map<string, { id?: string, pillarId?: string, status?: string, comments?: string, name?: string }>()
  for (let i = 1; i < data[1].length; i++) {
    const row = data[1][i]
    if (!row[catIdIdx]) continue
    catMap.set(row[catNameIdx], {
      id: row[catIdIdx],
      pillarId: row[catPillarIdIdx],
      status: row[catStatusIdx],
      comments: row[catCommentsIdx],
      name: row[catNameIdx],
    })
  }

  const goalHeader = data[2]
  const goalIdIdx = goalHeader.indexOf('StrategicGoalID')
  const goalCatIdIdx = goalHeader.indexOf('CategoryID')
  const goalPillarIdIdx = goalHeader.indexOf('StrategicPillarID')
  const goalNameIdx = goalHeader.indexOf('Strategic Goal')
  const goalStatusIdx = goalHeader.indexOf('Status')
  const goalCommentsIdx = goalHeader.indexOf('Comments')
  const goalMap = new Map<string, { id?: string, catId?: string, pillarId?: string, status?: string, comments?: string }>()
  for (let i = 1; i < data[2].length; i++) {
    const row = data[2][i]
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
  const progProgressUpdatesIdx = mainHeader.indexOf('Progress Updates')

  let debugCount = 0;
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
      text: programText || `Program ${programId}`,
      strategicGoalId: goalId,
      categoryId: categoryId,
      strategicPillarId: pillarId,
      q1Objective: rowData["Q1 Objective"] || undefined,
      q2Objective: rowData["Q2 Objective"] || undefined,
      q3Objective: rowData["Q3 Objective"] || undefined,
      q4Objective: rowData["Q4 Objective"] || undefined,
      q1Status: mapStatus(rowData["Q1 Status"]),
      q2Status: mapStatus(rowData["Q2 Status"]),
      q3Status: mapStatus(rowData["Q3 Status"]),
      q4Status: mapStatus(rowData["Q4 Status"]),
      progressUpdates: rowData["Progress Updates"] || undefined,
      ordLtSponsors: rowData["ORD LT Sponsor(s)"] || undefined,
      sponsorsLeads: rowData["Sponsor(s)/Lead(s)"] || undefined,
      reportingOwners: rowData["Reporting owner(s)"] || undefined,
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
    if (debugCount < 5) {
      console.log('BACKEND DEBUG - Program object:', program);
      debugCount++;
    }
    goal.programs.push(program)
  })

  return {
    pillars: Array.from(pillarsMap.values()),
  }
}

// Function to load and merge data from all XLSX files
export async function loadAndMergeScorecardXLSXs(): Promise<ScoreCardData> {
  console.log('XLSX PARSER: loadAndMergeScorecardXLSXs called');
  try {
    const [dummyData, strategicGoals, categoryStatus, strategicPillars] = await Promise.all([
      parseXLSX('data/DummyData.xlsx'),
      parseXLSX('data/Strategic-Goals.xlsx'),
      parseXLSX('data/Category-status-comments.xlsx'),
      parseXLSX('data/StrategicPillars.xlsx')
    ]);

    // --- Pillar Names Map ---
    const pillarHeaders = dummyData[0].map(h => h.trim());
    const pillarHeadersSP = strategicPillars[0].map(h => h.trim());
    const pillarData = strategicPillars.slice(1);
    const pillarNameMap = new Map<string, string>();
    pillarData.forEach(row => {
      const id = norm(row[colIdx(pillarHeadersSP, 'StrategicPillarID')]);
      const name = trimText(row[colIdx(pillarHeadersSP, 'Strategic Pillar')]);
      if (id && name) pillarNameMap.set(id, name);
    });

    // --- Strategic Goals Map ---
    const goalHeaders = strategicGoals[0].map(h => h.trim());
    const goalData = strategicGoals.slice(1);
    const goalMap = new Map<string, any>();
    goalData.forEach(row => {
      const goalId = norm(row[colIdx(goalHeaders, 'StrategicGoalID')]);
      if (!goalId) return;
      goalMap.set(goalId, {
        id: goalId,
        text: trimText(row[colIdx(goalHeaders, 'Strategic Goal')]),
        status: mapStatus(row[colIdx(goalHeaders, 'Status')]),
        comments: trimText(row[colIdx(goalHeaders, 'Comments')]),
        categoryId: norm(row[colIdx(goalHeaders, 'CategoryID')]),
        strategicPillarId: norm(row[colIdx(goalHeaders, 'StrategicPillarID')])
      });
    });

    // --- Category Map ---
    const catHeaders = categoryStatus[0].map(h => h.trim());
    const catData = categoryStatus.slice(1);
    const catMap = new Map<string, any>();
    catData.forEach(row => {
      const catId = norm(row[colIdx(catHeaders, 'CategoryID')]);
      if (!catId) return;
      catMap.set(catId, {
        id: catId,
        name: trimText(row[colIdx(catHeaders, 'Category')]),
        status: mapStatus(row[colIdx(catHeaders, 'Status')]),
        comments: trimText(row[colIdx(catHeaders, 'Comments')]),
        strategicPillarId: norm(row[colIdx(catHeaders, 'StrategicPillarID')])
      });
    });

    // --- DummyData to build hierarchy ---
    const dummyHeaders = dummyData[0].map(h => h.trim());
    const dummyRows = dummyData.slice(1);
    const pillarsMap = new Map<string, Pillar>();
    const categoriesMap = new Map<string, Category>();
    const goalsMap = new Map<string, StrategicGoal>();
    const headers = dummyRows[0];
    const dataRows = dummyRows.slice(1);
    dataRows.forEach(row => {
      const pillarId = norm(row[colIdx(dummyHeaders, 'StrategicPillarID')]);
      const categoryId = norm(row[colIdx(dummyHeaders, 'CategoryID')]);
      const goalId = norm(row[colIdx(dummyHeaders, 'StrategicGoalID')]);
      const programId = norm(row[colIdx(dummyHeaders, 'StrategicProgramID')]);
      const programText = trimText(row[colIdx(dummyHeaders, 'Strategic Program')]);
      const q1Objective = trimText(row[colIdx(dummyHeaders, 'Q1 Objective')]);
      const q2Objective = trimText(row[colIdx(dummyHeaders, 'Q2 Objective')]);
      const q3Objective = trimText(row[colIdx(dummyHeaders, 'Q3 Objective')]);
      const q4Objective = trimText(row[colIdx(dummyHeaders, 'Q4 Objective')]);
      if (!pillarId || !categoryId || !goalId || !programId) return;

      // --- Pillar ---
      let pillar = pillarsMap.get(pillarId);
      if (!pillar) {
        const pillarName = pillarNameMap.get(pillarId);
        pillar = {
          id: pillarId,
          name: trimText(pillarName) || `Pillar ${pillarId}`,
          categories: []
        };
        pillarsMap.set(pillarId, pillar);
      }

      // --- Category ---
      let category = categoriesMap.get(categoryId);
      if (!category) {
        const catInfo = catMap.get(categoryId) || {};
        category = {
          id: categoryId,
          name: trimText(catInfo.name) || `Category ${categoryId}`,
          status: catInfo.status,
          comments: trimText(catInfo.comments),
          goals: [],
          strategicPillarId: pillarId
        };
        categoriesMap.set(categoryId, category);
        pillar.categories.push(category);
      }

      // --- Goal ---
      let goal = goalsMap.get(goalId);
      if (!goal) {
        const goalInfo = goalMap.get(goalId) || {};
        goal = {
          id: goalId,
          text: trimText(goalInfo.text) || `Goal ${goalId}`,
          status: goalInfo.status,
          comments: trimText(goalInfo.comments),
          programs: [],
          categoryId: categoryId,
          strategicPillarId: pillarId
        };
        goalsMap.set(goalId, goal);
        category.goals.push(goal);
      }

      // --- Program ---
      const program: StrategicProgram = {
        id: programId,
        text: programText || `Program ${programId}`,
        strategicGoalId: goalId,
        categoryId: categoryId,
        strategicPillarId: pillarId,
        q1Objective,
        q2Objective,
        q3Objective,
        q4Objective,
        q1Status: mapStatus(row[dummyHeaders.indexOf('Q1 Status')]),
        q2Status: mapStatus(row[dummyHeaders.indexOf('Q2 Status')]),
        q3Status: mapStatus(row[dummyHeaders.indexOf('Q3 Status')]),
        q4Status: mapStatus(row[dummyHeaders.indexOf('Q4 Status')]),
        progressUpdates: trimText(row[dummyHeaders.indexOf('Progress Updates')]),
        ordLtSponsors: trimText(row[dummyHeaders.indexOf('ORD LT Sponsor(s)')]),
        sponsorsLeads: trimText(row[dummyHeaders.indexOf('Sponsor(s)/Lead(s)')]),
        reportingOwners: trimText(row[dummyHeaders.indexOf('Reporting owner(s)')]),
      };
      if (!goal.programs) goal.programs = [];
      goal.programs.push(program);
    });

    return {
      pillars: Array.from(pillarsMap.values())
    };
  } catch (error) {
    console.error('Error loading and merging XLSX files:', error);
    throw error;
  }
}

// Legacy function for backwards compatibility
export async function loadAndMergeScorecardCSVs(): Promise<ScoreCardData> {
  return loadAndMergeScorecardXLSXs();
}

// Legacy function for backwards compatibility
export function transformCSVToScoreCardData(data: string[][]): ScoreCardData {
  return transformSpreadsheetToScoreCardData(data);
}

// Legacy function for backwards compatibility
export async function parseCSV(filePath: string): Promise<string[][]> {
  return parseXLSX(filePath.replace('.csv', '.xlsx'));
}
