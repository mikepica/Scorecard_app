export interface QuarterInfo {
  quarter: number
  year: number
  label: string
  columnName: string
}

/**
 * Get the current quarter info based on today's date
 */
export function getCurrentQuarter(): QuarterInfo {
  const now = new Date()
  const month = now.getMonth() + 1 // getMonth() returns 0-11, we want 1-12
  const year = now.getFullYear()
  
  let quarter: number
  if (month >= 1 && month <= 3) {
    quarter = 1
  } else if (month >= 4 && month <= 6) {
    quarter = 2
  } else if (month >= 7 && month <= 9) {
    quarter = 3
  } else {
    quarter = 4
  }
  
  return {
    quarter,
    year,
    label: `Q${quarter}-${year}`,
    columnName: `q${quarter}_${year}_progress`
  }
}

/**
 * Get the previous quarter info based on the current quarter
 */
export function getPreviousQuarter(): QuarterInfo {
  const current = getCurrentQuarter()
  
  let prevQuarter: number
  let prevYear: number
  
  if (current.quarter === 1) {
    prevQuarter = 4
    prevYear = current.year - 1
  } else {
    prevQuarter = current.quarter - 1
    prevYear = current.year
  }
  
  return {
    quarter: prevQuarter,
    year: prevYear,
    label: `Q${prevQuarter}-${prevYear}`,
    columnName: `q${prevQuarter}_${prevYear}_progress`
  }
}

/**
 * Get quarter info for a specific quarter and year
 */
export function getQuarterInfo(quarter: number, year: number): QuarterInfo {
  return {
    quarter,
    year,
    label: `Q${quarter}-${year}`,
    columnName: `q${quarter}_${year}_progress`
  }
}

/**
 * Get all available quarter info for progress tracking (2025-2026)
 */
export function getAvailableQuarters(): QuarterInfo[] {
  const quarters: QuarterInfo[] = []
  
  // 2025 quarters
  for (let q = 1; q <= 4; q++) {
    quarters.push(getQuarterInfo(q, 2025))
  }
  
  // 2026 quarters
  for (let q = 1; q <= 4; q++) {
    quarters.push(getQuarterInfo(q, 2026))
  }
  
  return quarters
}

/**
 * Parse a column name to get quarter info
 */
export function parseQuarterColumnName(columnName: string): QuarterInfo | null {
  const match = columnName.match(/^q(\d)_(\d{4})_progress$/)
  if (!match) return null
  
  const quarter = parseInt(match[1])
  const year = parseInt(match[2])
  
  return getQuarterInfo(quarter, year)
}