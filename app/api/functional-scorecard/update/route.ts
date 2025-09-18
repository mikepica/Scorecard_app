import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { updateType, fieldPath, newValue, quarter } = body;

    console.log('🔄 Functional scorecard update request:', { updateType, fieldPath, newValue, quarter });

    // Validate required fields
    if (!updateType || !fieldPath || !Array.isArray(fieldPath)) {
      return NextResponse.json(
        { error: 'Missing required fields: updateType, fieldPath' },
        { status: 400 }
      );
    }

    // Perform the update using the functional update method
    const updatedData = await DatabaseService.performFunctionalUpdate(
      updateType,
      fieldPath,
      newValue,
      quarter
    );

    console.log('✅ Functional scorecard update completed');

    return NextResponse.json({
      success: true,
      data: updatedData
    });

  } catch (error) {
    console.error('❌ Functional scorecard update error:', error);
    
    // Return more specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to update functional scorecard',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { fieldPath, newValue, type, quarter }: {
      fieldPath: string[],
      newValue: string | null,
      type: string,
      quarter?: 'q1' | 'q2' | 'q3' | 'q4',
    } = await request.json()

    console.log('🗄️  Processing functional database update operation:', type)
    try {
      const updatedData = await DatabaseService.performFunctionalUpdate(type, fieldPath, newValue, quarter)
      return NextResponse.json(updatedData)
    } catch (dbError) {
      console.error('Functional database update error:', dbError)
      return NextResponse.json(
        { error: `Functional database update failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Functional update error:', error)
    return NextResponse.json({ error: "Failed to update functional data" }, { status: 500 })
  }
}