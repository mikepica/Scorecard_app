/**
 * Utility functions for determining item visibility based on quarter ranges
 */

/**
 * Parses a quarter string (flexible format) into comparable values
 * Accepts formats: "Q1-2025", "q1-2025", "Q1 2025", "q1 2025"
 * Returns null if invalid format
 */
function parseQuarter(quarter: string | null | undefined): { year: number; quarter: number } | null {
  if (!quarter) return null;
  
  // Clean and normalize the quarter string
  const cleaned = quarter.trim().toLowerCase().replace(/\s+/g, '-');
  
  // Match patterns like "q1-2025" or "1-2025"
  const match = cleaned.match(/^q?(\d+)-(\d{4})$/);
  if (!match) return null;
  
  const quarterNum = parseInt(match[1], 10);
  const year = parseInt(match[2], 10);
  
  if (quarterNum < 1 || quarterNum > 4 || year < 1900 || year > 3000) {
    return null;
  }
  
  return { year, quarter: quarterNum };
}

/**
 * Compares two quarters and returns:
 * -1 if quarter1 is before quarter2
 *  0 if they are the same
 *  1 if quarter1 is after quarter2
 */
function compareQuarters(quarter1: { year: number; quarter: number }, quarter2: { year: number; quarter: number }): number {
  if (quarter1.year !== quarter2.year) {
    return quarter1.year - quarter2.year;
  }
  return quarter1.quarter - quarter2.quarter;
}

/**
 * Determines if an item should be visible based on its start/end quarters and the selected quarter
 * 
 * Logic:
 * - If no start/end quarters set: always visible
 * - If only start quarter set: visible from that quarter onwards
 * - If only end quarter set: visible up to and including that quarter
 * - If both set: visible within range (inclusive)
 * 
 * @param selectedQuarter - The currently selected quarter (e.g., "q3_2025")
 * @param startQuarter - The item's start quarter (optional)
 * @param endQuarter - The item's end quarter (optional)
 * @returns true if the item should be visible, false otherwise
 */
export function isItemVisible(
  selectedQuarter: string,
  startQuarter?: string | null,
  endQuarter?: string | null
): boolean {
  // If no quarters are set, always show the item
  if (!startQuarter && !endQuarter) {
    return true;
  }
  
  // Parse the selected quarter (convert from "q3_2025" format to "q3-2025")
  const normalizedSelected = selectedQuarter.replace('_', '-');
  const selected = parseQuarter(normalizedSelected);
  
  if (!selected) {
    // If we can't parse the selected quarter, default to showing the item
    console.warn(`Unable to parse selected quarter: ${selectedQuarter}`);
    return true;
  }
  
  const start = parseQuarter(startQuarter);
  const end = parseQuarter(endQuarter);
  
  // If only start quarter is set
  if (start && !end) {
    return compareQuarters(selected, start) >= 0;
  }
  
  // If only end quarter is set
  if (!start && end) {
    return compareQuarters(selected, end) <= 0;
  }
  
  // If both start and end quarters are set
  if (start && end) {
    return compareQuarters(selected, start) >= 0 && compareQuarters(selected, end) <= 0;
  }
  
  // Default to visible if we can't determine
  return true;
}

/**
 * Filters an array of items based on their quarter visibility
 * 
 * @param items - Array of items with optional startQuarter and endQuarter properties
 * @param selectedQuarter - The currently selected quarter
 * @returns Filtered array containing only visible items
 */
export function filterVisibleItems<T extends { startQuarter?: string | null; endQuarter?: string | null }>(
  items: T[],
  selectedQuarter: string
): T[] {
  return items.filter(item => isItemVisible(selectedQuarter, item.startQuarter, item.endQuarter));
}

/**
 * Helper function to validate quarter format
 * @param quarter - Quarter string to validate
 * @returns true if valid format, false otherwise
 */
export function isValidQuarterFormat(quarter: string): boolean {
  return parseQuarter(quarter) !== null;
}