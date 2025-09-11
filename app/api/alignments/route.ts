import { NextResponse } from "next/server"
import { DatabaseService } from '@/lib/database'

// GET /api/alignments - Get alignments for a specific item
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

    const alignments = await DatabaseService.getAlignments(itemType, itemId)
    
    return NextResponse.json({ alignments })
  } catch (error) {
    console.error('Alignments GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alignments' },
      { status: 500 }
    )
  }
}

// POST /api/alignments - Create new alignment
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const {
      functionalType,
      functionalId,
      ordType,
      ordId,
      strength,
      rationale,
      createdBy
    } = body

    // Validate required fields
    if (!functionalType || !functionalId || !ordType || !ordId || !strength) {
      return NextResponse.json(
        { error: 'functionalType, functionalId, ordType, ordId, and strength are required' },
        { status: 400 }
      )
    }

    // Validate types
    const validTypes = ['pillar', 'category', 'goal', 'program']
    if (!validTypes.includes(functionalType) || !validTypes.includes(ordType)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: ' + validTypes.join(', ') },
        { status: 400 }
      )
    }

    // Validate strength
    const validStrengths = ['strong', 'moderate', 'weak', 'informational']
    if (!validStrengths.includes(strength)) {
      return NextResponse.json(
        { error: 'Invalid strength. Must be one of: ' + validStrengths.join(', ') },
        { status: 400 }
      )
    }

    const alignment = await DatabaseService.createAlignment({
      functionalType,
      functionalId,
      ordType,
      ordId,
      strength,
      rationale,
      createdBy
    })

    return NextResponse.json({ alignment }, { status: 201 })
  } catch (error) {
    console.error('Alignments POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create alignment' },
      { status: 500 }
    )
  }
}

// PATCH /api/alignments - Update alignment (requires alignment ID in URL)
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const alignmentId = searchParams.get('id')

    if (!alignmentId) {
      return NextResponse.json(
        { error: 'Alignment ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { strength, rationale } = body

    // Validate strength if provided
    if (strength) {
      const validStrengths = ['strong', 'moderate', 'weak', 'informational']
      if (!validStrengths.includes(strength)) {
        return NextResponse.json(
          { error: 'Invalid strength. Must be one of: ' + validStrengths.join(', ') },
          { status: 400 }
        )
      }
    }

    const alignment = await DatabaseService.updateAlignment(alignmentId, {
      strength,
      rationale
    })

    return NextResponse.json({ alignment })
  } catch (error) {
    console.error('Alignments PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update alignment' },
      { status: 500 }
    )
  }
}

// DELETE /api/alignments - Delete alignment (requires alignment ID in URL)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const alignmentId = searchParams.get('id')

    if (!alignmentId) {
      return NextResponse.json(
        { error: 'Alignment ID is required' },
        { status: 400 }
      )
    }

    await DatabaseService.deleteAlignment(alignmentId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Alignments DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete alignment' },
      { status: 500 }
    )
  }
}