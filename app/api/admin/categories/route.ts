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
    const pillarId = searchParams.get('pillarId');

    const searchColumns = search ? ['name', 'comments'] : undefined;

    // If filtering by pillar, modify the query
    const tableName = 'categories';
    
    if (pillarId) {
      // For pillar filtering, we'll handle this in the service layer
      // This would need to be implemented in the AdminDatabaseService
    }

    const result = await AdminDatabaseService.getPaginatedData(
      tableName,
      page,
      limit,
      sortColumn,
      sortDirection,
      search || undefined,
      searchColumns
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, pillarId, status, comments } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required and must be a string' },
        { status: 400 }
      );
    }

    if (!pillarId || typeof pillarId !== 'string') {
      return NextResponse.json(
        { error: 'Pillar ID is required and must be a string' },
        { status: 400 }
      );
    }

    const id = await AdminDatabaseService.createCategory(
      name.trim(),
      pillarId,
      status,
      comments
    );

    return NextResponse.json({ id, message: 'Category created successfully' });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
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

    await AdminDatabaseService.updateCategory(id, updateData);

    return NextResponse.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    const message = error instanceof Error ? error.message : 'Failed to update category';
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

      const deletedCount = await AdminDatabaseService.bulkDelete('categories', ids);
      return NextResponse.json({ 
        message: `${deletedCount} categories deleted successfully`,
        deletedCount 
      });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await AdminDatabaseService.deleteCategory(id);

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete category';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}