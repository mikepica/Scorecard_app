import { NextRequest, NextResponse } from 'next/server';
import { AdminDatabaseService } from '@/lib/admin-database';
import { getDbConnection } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const pillarId = searchParams.get('pillarId');
    const categoryId = searchParams.get('categoryId');

    switch (type) {
      case 'pillars':
        const pillars = await AdminDatabaseService.getAllPillars();
        const pillarOptions = pillars.map(pillar => ({ value: pillar.id, label: pillar.name }));
        return NextResponse.json(pillarOptions);

      case 'categories':
        if (!pillarId) {
          // Return all categories if no pillar specified
          const client = await getDbConnection();
          try {
            const result = await client.query('SELECT id, name FROM categories ORDER BY name');
            const allCategoryOptions = result.rows.map((category: any) => ({ value: category.id, label: category.name }));
            return NextResponse.json(allCategoryOptions);
          } finally {
            client.release();
          }
        }
        const categories = await AdminDatabaseService.getCategoriesForPillar(pillarId);
        const categoryOptions = categories.map(category => ({ value: category.id, label: category.name }));
        return NextResponse.json(categoryOptions);

      case 'goals':
        if (!categoryId) {
          // Return all goals if no category specified
          const client = await getDbConnection();
          try {
            const result = await client.query('SELECT id, text FROM strategic_goals ORDER BY text');
            const allGoalOptions = result.rows.map((goal: any) => ({ value: goal.id, label: goal.text }));
            return NextResponse.json(allGoalOptions);
          } finally {
            client.release();
          }
        }
        const goals = await AdminDatabaseService.getGoalsForCategory(categoryId);
        const goalOptions = goals.map(goal => ({ value: goal.id, label: goal.text }));
        return NextResponse.json(goalOptions);

      case 'status-options':
        const statusOptions = [
          { value: 'exceeded', label: 'Exceeded' },
          { value: 'on-track', label: 'On Track' },
          { value: 'delayed', label: 'Delayed' },
          { value: 'missed', label: 'Missed' }
        ];
        return NextResponse.json(statusOptions);

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch options' },
      { status: 500 }
    );
  }
}