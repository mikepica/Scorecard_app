import { NextRequest, NextResponse } from 'next/server';
import { AdminDatabaseService } from '@/lib/admin-database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortColumn = searchParams.get('sortColumn') || 'text';
    const sortDirection = (searchParams.get('sortDirection') || 'ASC') as 'ASC' | 'DESC';
    const search = searchParams.get('search');

    const searchColumns = search ? ['text', 'comments', 'progress_updates'] : undefined;

    const result = await AdminDatabaseService.getPaginatedData(
      'strategic_goals',
      page,
      limit,
      sortColumn,
      sortDirection,
      search || undefined,
      searchColumns
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, categoryId, pillarId, ...optionalData } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    if (!categoryId || typeof categoryId !== 'string') {
      return NextResponse.json(
        { error: 'Category ID is required and must be a string' },
        { status: 400 }
      );
    }

    if (!pillarId || typeof pillarId !== 'string') {
      return NextResponse.json(
        { error: 'Pillar ID is required and must be a string' },
        { status: 400 }
      );
    }

    const id = await AdminDatabaseService.createGoal(
      text.trim(),
      categoryId,
      pillarId,
      optionalData
    );

    return NextResponse.json({ id, message: 'Goal created successfully' });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await AdminDatabaseService.updateGoal(id, updateData);

    return NextResponse.json({ message: 'Goal updated successfully' });
  } catch (error) {
    console.error('Error updating goal:', error);
    const message = error instanceof Error ? error.message : 'Failed to update goal';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const bulk = searchParams.get('bulk');

    if (bulk === 'true') {
      const { ids } = await request.json();
      if (!ids || !Array.isArray(ids)) {
        return NextResponse.json(
          { error: 'IDs array is required for bulk delete' },
          { status: 400 }
        );
      }

      const deletedCount = await AdminDatabaseService.bulkDelete('strategic_goals', ids);
      return NextResponse.json({ 
        message: `${deletedCount} goals deleted successfully`,
        deletedCount 
      });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await AdminDatabaseService.deleteGoal(id);

    return NextResponse.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete goal';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}