import { NextRequest, NextResponse } from 'next/server';
import { AdminDatabaseService } from '@/lib/admin-database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortColumn = searchParams.get('sortColumn') || 'changed_at';
    const sortDirection = (searchParams.get('sortDirection') || 'DESC') as 'ASC' | 'DESC';
    const search = searchParams.get('search');
    const programId = searchParams.get('programId');

    // For progress history, we'll use the existing method but adapt it for pagination
    const offset = (page - 1) * limit;
    
    let historyData;
    if (programId) {
      historyData = await AdminDatabaseService.getProgressUpdateHistory(programId, limit + offset);
    } else {
      historyData = await AdminDatabaseService.getProgressUpdateHistory(undefined, limit + offset);
    }

    // Simple pagination handling for history data
    const paginatedData = historyData.slice(offset, offset + limit);
    
    const result = {
      data: paginatedData,
      total: historyData.length,
      page,
      limit,
      totalPages: Math.ceil(historyData.length / limit)
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching progress history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress history' },
      { status: 500 }
    );
  }
}