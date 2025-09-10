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

    const searchColumns = search ? ['text', 'progress_updates'] : undefined;

    const result = await AdminDatabaseService.getPaginatedData(
      'functional_programs',
      page,
      limit,
      sortColumn,
      sortDirection,
      search || undefined,
      searchColumns
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching functional programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch functional programs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, goalId, categoryId, pillarId, ...optionalData } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    if (!goalId || typeof goalId !== 'string') {
      return NextResponse.json(
        { error: 'Goal ID is required and must be a string' },
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

    const id = await AdminDatabaseService.createFunctionalProgram(
      text.trim(),
      goalId,
      categoryId,
      pillarId,
      optionalData
    );

    return NextResponse.json({ id, message: 'Functional program created successfully' });
  } catch (error) {
    console.error('Error creating functional program:', error);
    return NextResponse.json(
      { error: 'Failed to create functional program' },
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

    await AdminDatabaseService.updateFunctionalProgram(id, updateData);

    return NextResponse.json({ message: 'Functional program updated successfully' });
  } catch (error) {
    console.error('Error updating functional program:', error);
    const message = error instanceof Error ? error.message : 'Failed to update functional program';
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

      const deletedCount = await AdminDatabaseService.bulkDelete('functional_programs', ids);
      return NextResponse.json({ 
        message: `${deletedCount} functional programs deleted successfully`,
        deletedCount 
      });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await AdminDatabaseService.deleteFunctionalProgram(id);

    return NextResponse.json({ message: 'Functional program deleted successfully' });
  } catch (error) {
    console.error('Error deleting functional program:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete functional program';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}