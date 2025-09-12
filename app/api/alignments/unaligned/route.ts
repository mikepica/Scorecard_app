import { NextResponse } from "next/server"
import { DatabaseService } from '@/lib/database'

export async function GET() {
  try {
    const items = await DatabaseService.getUnalignedItems()
    
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Unaligned items GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unaligned items' },
      { status: 500 }
    )
  }
}