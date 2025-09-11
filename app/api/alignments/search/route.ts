import { NextResponse } from "next/server"
import { DatabaseService } from '@/lib/database'

// GET /api/alignments/search - Search for alignment targets
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('q')
    const excludeType = searchParams.get('excludeType')
    const excludeId = searchParams.get('excludeId')

    if (!searchTerm) {
      return NextResponse.json(
        { error: 'Search term (q) is required' },
        { status: 400 }
      )
    }

    // Minimum search term length
    if (searchTerm.length < 2) {
      return NextResponse.json(
        { error: 'Search term must be at least 2 characters long' },
        { status: 400 }
      )
    }

    // Validate excludeType if provided
    if (excludeType) {
      const validTypes = ['pillar', 'category', 'goal', 'program']
      if (!validTypes.includes(excludeType)) {
        return NextResponse.json(
          { error: 'Invalid excludeType. Must be one of: ' + validTypes.join(', ') },
          { status: 400 }
        )
      }
    }

    const results = await DatabaseService.searchAlignmentTargets(
      searchTerm,
      excludeType || undefined,
      excludeId || undefined
    )

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Alignment search error:', error)
    return NextResponse.json(
      { error: 'Failed to search alignment targets' },
      { status: 500 }
    )
  }
}