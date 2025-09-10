import { NextRequest, NextResponse } from 'next/server';
import { AdminDatabaseService } from '@/lib/admin-database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortColumn = searchParams.get('sortColumn') || 'name';
    const sortDirection = (searchParams.get('sortDirection') || 'ASC') as 'ASC' | 'DESC';
    const search = searchParams.get('search');

    const searchColumns = search ? ['name'] : undefined;

    const result = await AdminDatabaseService.getPaginatedData(
      'strategic_pillars',
      page,
      limit,
      sortColumn,
      sortDirection,
      search || undefined,
      searchColumns
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching pillars:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pillars' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required and must be a string' },
        { status: 400 }
      );
    }

    const id = await AdminDatabaseService.createPillar(name.trim());

    return NextResponse.json({ id, message: 'Pillar created successfully' });
  } catch (error) {
    console.error('Error creating pillar:', error);
    return NextResponse.json(
      { error: 'Failed to create pillar' },
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

    await AdminDatabaseService.updatePillar(id, updateData);

    return NextResponse.json({ message: 'Pillar updated successfully' });
  } catch (error) {
    console.error('Error updating pillar:', error);
    const message = error instanceof Error ? error.message : 'Failed to update pillar';
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

      const deletedCount = await AdminDatabaseService.bulkDelete('strategic_pillars', ids);
      return NextResponse.json({ 
        message: `${deletedCount} pillars deleted successfully`,
        deletedCount 
      });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await AdminDatabaseService.deletePillar(id);

    return NextResponse.json({ message: 'Pillar deleted successfully' });
  } catch (error) {
    console.error('Error deleting pillar:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete pillar';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}