import { NextRequest, NextResponse } from 'next/server';
import { ExcelProcessor, type FunctionalProgramRow } from '@/lib/excel-processor';
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
    const processingResult = ExcelProcessor.processFunctionalProgramsExcelFile(fileBuffer);

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

    // Skip foreign key validation for now since spreadsheet uses text fields instead of IDs
    // const validationErrors = await validateForeignKeys(processingResult.data);
    // if (validationErrors.length > 0) {
    //   return NextResponse.json(
    //     {
    //       error: 'Foreign key validation failed',
    //       details: validationErrors
    //     },
    //     { status: 400 }
    //   );
    // }

    // Perform bulk upsert
    const upsertResult = await AdminDatabaseService.bulkUpsertFunctionalPrograms(processingResult.data);

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${processingResult.data.length} functional programs`,
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
    const template = ExcelProcessor.generateFunctionalProgramsTemplate();

    return new NextResponse(template, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="functional_programs_template.xlsx"'
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function validateForeignKeys(programs: FunctionalProgramRow[]): Promise<string[]> {
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

    // Validate linked strategic program IDs (optional field)
    const linkedProgramIds = programs
      .map(p => p.linked_ORD_strategic_program_ID)
      .filter(id => id && id.trim())
      .map(id => id!.trim());

    if (linkedProgramIds.length > 0) {
      const uniqueLinkedIds = [...new Set(linkedProgramIds)];
      const validLinkedIds = await AdminDatabaseService.validateIds('strategic_programs', uniqueLinkedIds);
      const invalidLinkedIds = uniqueLinkedIds.filter(id => !validLinkedIds.includes(id));
      if (invalidLinkedIds.length > 0) {
        errors.push(`Invalid Linked Strategic Program IDs: ${invalidLinkedIds.join(', ')}`);
      }
    }

  } catch (error) {
    errors.push(`Foreign key validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return errors;
}