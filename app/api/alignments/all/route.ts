import { NextResponse } from "next/server"
import { DatabaseService } from '@/lib/database'

export async function GET() {
  try {
    console.log('API: Fetching all alignments')
    const alignments = await DatabaseService.getAllAlignments()
    console.log('API: Found alignments:', alignments.length)
    
    return NextResponse.json({ alignments })
  } catch (error) {
    console.error('All alignments GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alignments' },
      { status: 500 }
    )
  }
}