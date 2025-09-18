import { NextRequest, NextResponse } from 'next/server';
import { ExcelProcessor, type StrategicProgramRow } from '@/lib/excel-processor';
import { AdminDatabaseService } from '@/lib/admin-database';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json(
        { error: 'Only Excel files (.xlsx, .xls) are supported' },
        { status: 400 }
      );
    }

    // Process the Excel file
    const fileBuffer = await file.arrayBuffer();
    const processingResult = ExcelProcessor.processExcelFile(fileBuffer);

    if (!processingResult.success) {
      return NextResponse.json(
        {
          error: 'Failed to process Excel file',
          details: processingResult.errors
        },
        { status: 400 }
      );
    }

    if (!processingResult.data || processingResult.data.length === 0) {
      return NextResponse.json(
        { error: 'No valid data found in Excel file' },
        { status: 400 }
      );
    }

    // Validate foreign key relationships before bulk upsert
    const validationErrors = await validateForeignKeys(processingResult.data);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Foreign key validation failed',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Perform bulk upsert
    const upsertResult = await AdminDatabaseService.bulkUpsertPrograms(processingResult.data);

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${processingResult.data.length} programs`,
      details: {
        processed: processingResult.data.length,
        created: upsertResult.created,
        updated: upsertResult.updated,
        warnings: processingResult.warnings
      }
    });

  } catch (error) {
    console.error('Error uploading Excel file:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload Excel file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Generate and return Excel template
    const template = ExcelProcessor.generateTemplate();

    return new NextResponse(template, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="strategic_programs_template.xlsx"'
      }
    });
  } catch (error) {
    console.error('Error generating Excel template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}

async function validateForeignKeys(programs: StrategicProgramRow[]): Promise<string[]> {
  const errors: string[] = [];

  try {
    // Get all unique IDs that need validation
    const goalIds = [...new Set(programs.map(p => p.goal_id))];
    const categoryIds = [...new Set(programs.map(p => p.category_id))];
    const pillarIds = [...new Set(programs.map(p => p.pillar_id))];

    // Validate goal IDs
    const validGoalIds = await AdminDatabaseService.validateIds('strategic_goals', goalIds);
    const invalidGoalIds = goalIds.filter(id => !validGoalIds.includes(id));
    if (invalidGoalIds.length > 0) {
      errors.push(`Invalid Goal IDs: ${invalidGoalIds.join(', ')}`);
    }

    // Validate category IDs
    const validCategoryIds = await AdminDatabaseService.validateIds('categories', categoryIds);
    const invalidCategoryIds = categoryIds.filter(id => !validCategoryIds.includes(id));
    if (invalidCategoryIds.length > 0) {
      errors.push(`Invalid Category IDs: ${invalidCategoryIds.join(', ')}`);
    }

    // Validate pillar IDs
    const validPillarIds = await AdminDatabaseService.validateIds('strategic_pillars', pillarIds);
    const invalidPillarIds = pillarIds.filter(id => !validPillarIds.includes(id));
    if (invalidPillarIds.length > 0) {
      errors.push(`Invalid Pillar IDs: ${invalidPillarIds.join(', ')}`);
    }

  } catch (error) {
    errors.push(`Foreign key validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return errors;
}