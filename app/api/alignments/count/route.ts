import { NextResponse } from "next/server"
import { DatabaseService } from '@/lib/database'

// GET /api/alignments/count - Get alignment count for a specific item
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const itemType = searchParams.get('itemType')
    const itemId = searchParams.get('itemId')

    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: 'itemType and itemId are required' },
        { status: 400 }
      )
    }

    // Validate itemType
    const validTypes = ['pillar', 'category', 'goal', 'program']
    if (!validTypes.includes(itemType)) {
      return NextResponse.json(
        { error: 'Invalid itemType. Must be one of: ' + validTypes.join(', ') },
        { status: 400 }
      )
    }

    const count = await DatabaseService.getAlignmentCount(itemType, itemId)
    
    return NextResponse.json({ count })
  } catch (error) {
    console.error('Alignment count error:', error)
    return NextResponse.json(
      { error: 'Failed to get alignment count' },
      { status: 500 }
    )
  }
}