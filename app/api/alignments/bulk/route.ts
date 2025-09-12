import { NextResponse } from "next/server"
import { DatabaseService } from '@/lib/database'

// POST /api/alignments/bulk - Create multiple alignments
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { alignments } = body

    if (!Array.isArray(alignments) || alignments.length === 0) {
      return NextResponse.json(
        { error: 'alignments array is required and must not be empty' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    // Process each alignment
    for (let i = 0; i < alignments.length; i++) {
      const alignmentData = alignments[i]
      
      try {
        // Validate required fields
        const {
          functionalType,
          functionalId,
          ordType,
          ordId,
          strength,
          rationale,
          createdBy
        } = alignmentData

        if (!functionalType || !functionalId || !ordType || !ordId || !strength) {
          throw new Error('Missing required fields')
        }

        // Validate types
        const validTypes = ['pillar', 'category', 'goal', 'program']
        if (!validTypes.includes(functionalType) || !validTypes.includes(ordType)) {
          throw new Error('Invalid type')
        }

        // Validate strength
        const validStrengths = ['strong', 'moderate', 'weak', 'informational']
        if (!validStrengths.includes(strength)) {
          throw new Error('Invalid strength')
        }

        const alignment = await DatabaseService.createAlignment({
          functionalType,
          functionalId,
          ordType,
          ordId,
          strength,
          rationale,
          createdBy: createdBy || 'bulk-import'
        })

        results.push({
          index: i,
          success: true,
          alignment
        })

      } catch (error) {
        console.error(`Bulk alignment ${i} error:`, error)
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: alignmentData
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: alignments.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    }, { status: 201 })

  } catch (error) {
    console.error('Bulk alignments POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk alignments' },
      { status: 500 }
    )
  }
}

// PATCH /api/alignments/bulk - Update multiple alignments
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { updates } = body

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'updates array is required and must not be empty' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    // Process each update
    for (let i = 0; i < updates.length; i++) {
      const updateData = updates[i]
      
      try {
        const { id, strength, rationale } = updateData

        if (!id) {
          throw new Error('Missing alignment ID')
        }

        // Validate strength if provided
        if (strength) {
          const validStrengths = ['strong', 'moderate', 'weak', 'informational']
          if (!validStrengths.includes(strength)) {
            throw new Error('Invalid strength')
          }
        }

        const alignment = await DatabaseService.updateAlignment(id, {
          strength,
          rationale
        })

        results.push({
          index: i,
          success: true,
          alignment
        })

      } catch (error) {
        console.error(`Bulk update ${i} error:`, error)
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: updateData
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: updates.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    })

  } catch (error) {
    console.error('Bulk alignments PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk updates' },
      { status: 500 }
    )
  }
}

// DELETE /api/alignments/bulk - Delete multiple alignments
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids array is required and must not be empty' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    // Process each deletion
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      
      try {
        if (!id || typeof id !== 'string') {
          throw new Error('Invalid alignment ID')
        }

        await DatabaseService.deleteAlignment(id)

        results.push({
          index: i,
          success: true,
          id
        })

      } catch (error) {
        console.error(`Bulk delete ${i} error:`, error)
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
          id
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: ids.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    })

  } catch (error) {
    console.error('Bulk alignments DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk deletions' },
      { status: 500 }
    )
  }
}