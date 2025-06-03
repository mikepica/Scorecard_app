import { DataProvider } from './DataProvider.interface'
import { ScoreCardData } from '@/features/scorecard/types'
import { transformCSVToScoreCardData } from '@/core/data/parsers/csv-parser'

export class CSVDataProvider implements DataProvider<ScoreCardData> {
  constructor(private filePath: string) {}
  
  async fetch(): Promise<ScoreCardData> {
    const response = await fetch('/api/scorecard')
    if (!response.ok) {
      throw new Error('Failed to fetch scorecard data')
    }
    return await response.json()
  }
} 