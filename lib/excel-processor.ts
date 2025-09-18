import * as XLSX from 'xlsx';

export interface StrategicProgramRow {
  id?: string;
  text: string;
  q1_objective?: string;
  q2_objective?: string;
  q3_objective?: string;
  q4_objective?: string;
  q1_status?: 'exceeded' | 'on-track' | 'delayed' | 'missed';
  q2_status?: 'exceeded' | 'on-track' | 'delayed' | 'missed';
  q3_status?: 'exceeded' | 'on-track' | 'delayed' | 'missed';
  q4_status?: 'exceeded' | 'on-track' | 'delayed' | 'missed';
  ord_lt_sponsors?: string[];
  sponsors_leads?: string[];
  reporting_owners?: string[];
  progress_updates?: string;
  q1_2025_progress?: string;
  q2_2025_progress?: string;
  q3_2025_progress?: string;
  q4_2025_progress?: string;
  q1_2026_progress?: string;
  q2_2026_progress?: string;
  q3_2026_progress?: string;
  q4_2026_progress?: string;
  goal_id: string;
  category_id: string;
  pillar_id: string;
}

export interface ExcelProcessingResult {
  success: boolean;
  data?: StrategicProgramRow[];
  errors?: string[];
  warnings?: string[];
}

export class ExcelProcessor {
  private static readonly VALID_STATUSES = ['exceeded', 'on-track', 'delayed', 'missed'];

  private static readonly COLUMN_MAPPING: Record<string, string> = {
    'ID': 'id',
    'Text': 'text',
    'Program Text': 'text',
    'Q1 Objective': 'q1_objective',
    'Q2 Objective': 'q2_objective',
    'Q3 Objective': 'q3_objective',
    'Q4 Objective': 'q4_objective',
    'Q1 Status': 'q1_status',
    'Q2 Status': 'q2_status',
    'Q3 Status': 'q3_status',
    'Q4 Status': 'q4_status',
    'ORD LT Sponsors': 'ord_lt_sponsors',
    'Sponsors/Leads': 'sponsors_leads',
    'Reporting Owners': 'reporting_owners',
    'Progress Updates': 'progress_updates',
    'Q1 2025 Progress': 'q1_2025_progress',
    'Q2 2025 Progress': 'q2_2025_progress',
    'Q3 2025 Progress': 'q3_2025_progress',
    'Q4 2025 Progress': 'q4_2025_progress',
    'Q1 2026 Progress': 'q1_2026_progress',
    'Q2 2026 Progress': 'q2_2026_progress',
    'Q3 2026 Progress': 'q3_2026_progress',
    'Q4 2026 Progress': 'q4_2026_progress',
    'Goal ID': 'goal_id',
    'Category ID': 'category_id',
    'Pillar ID': 'pillar_id'
  };

  static processExcelFile(fileBuffer: ArrayBuffer): ExcelProcessingResult {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        return {
          success: false,
          errors: ['No worksheets found in the Excel file']
        };
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

      if (rawData.length < 2) {
        return {
          success: false,
          errors: ['Excel file must contain at least a header row and one data row']
        };
      }

      const headers = rawData[0] as string[];
      const dataRows = rawData.slice(1);

      // Map headers to database column names
      const mappedHeaders = headers.map(header =>
        this.COLUMN_MAPPING[header.trim()] || header.toLowerCase().replace(/\s+/g, '_')
      );

      const errors: string[] = [];
      const warnings: string[] = [];
      const processedData: StrategicProgramRow[] = [];

      // Check for required columns
      const requiredColumns = ['text', 'goal_id', 'category_id', 'pillar_id'];
      const missingColumns = requiredColumns.filter(col => !mappedHeaders.includes(col));

      if (missingColumns.length > 0) {
        return {
          success: false,
          errors: [`Missing required columns: ${missingColumns.join(', ')}`]
        };
      }

      dataRows.forEach((row, index) => {
        const rowNumber = index + 2; // +2 because we skip header and array is 0-indexed

        if (!row || row.every(cell => !cell || cell === '')) {
          warnings.push(`Row ${rowNumber}: Empty row skipped`);
          return;
        }

        try {
          const processedRow = this.processRow(row as (string | number)[], mappedHeaders, rowNumber);
          if (processedRow.errors.length > 0) {
            errors.push(...processedRow.errors);
          }
          if (processedRow.warnings.length > 0) {
            warnings.push(...processedRow.warnings);
          }
          if (processedRow.data) {
            processedData.push(processedRow.data);
          }
        } catch (error) {
          errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      return {
        success: errors.length === 0,
        data: processedData,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      return {
        success: false,
        errors: [`Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  private static processRow(
    row: (string | number)[],
    headers: string[],
    rowNumber: number
  ): { data?: StrategicProgramRow; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const data: Partial<StrategicProgramRow> = {};

    headers.forEach((header, index) => {
      const cellValue = row[index];

      if (cellValue === undefined || cellValue === null || cellValue === '') {
        return;
      }

      try {
        switch (header) {
          case 'id':
            data.id = String(cellValue).trim();
            break;

          case 'text':
            data.text = String(cellValue).trim();
            if (!data.text) {
              errors.push(`Row ${rowNumber}: Text field is required`);
            }
            break;

          case 'goal_id':
          case 'category_id':
          case 'pillar_id':
            const idValue = String(cellValue).trim();
            if (!idValue) {
              errors.push(`Row ${rowNumber}: ${header} is required`);
            } else {
              (data as Record<string, unknown>)[header] = idValue;
            }
            break;

          case 'q1_status':
          case 'q2_status':
          case 'q3_status':
          case 'q4_status':
            const status = String(cellValue).toLowerCase().trim();
            if (status && !this.VALID_STATUSES.includes(status)) {
              errors.push(`Row ${rowNumber}: Invalid status "${cellValue}" for ${header}. Must be one of: ${this.VALID_STATUSES.join(', ')}`);
            } else if (status) {
              (data as Record<string, unknown>)[header] = status as 'exceeded' | 'on-track' | 'delayed' | 'missed';
            }
            break;

          case 'ord_lt_sponsors':
          case 'sponsors_leads':
          case 'reporting_owners':
            const arrayValue = this.parseArrayField(String(cellValue));
            if (arrayValue.length > 0) {
              (data as Record<string, unknown>)[header] = arrayValue;
            }
            break;

          default:
            // Handle all other text fields
            if (typeof cellValue === 'string' || typeof cellValue === 'number') {
              (data as Record<string, unknown>)[header] = String(cellValue).trim();
            }
            break;
        }
      } catch (error) {
        errors.push(`Row ${rowNumber}, Column "${header}": ${error instanceof Error ? error.message : 'Processing error'}`);
      }
    });

    // Validate required fields
    if (!data.text) {
      errors.push(`Row ${rowNumber}: Text field is required`);
    }
    if (!data.goal_id) {
      errors.push(`Row ${rowNumber}: Goal ID is required`);
    }
    if (!data.category_id) {
      errors.push(`Row ${rowNumber}: Category ID is required`);
    }
    if (!data.pillar_id) {
      errors.push(`Row ${rowNumber}: Pillar ID is required`);
    }

    return {
      data: errors.length === 0 ? data as StrategicProgramRow : undefined,
      errors,
      warnings
    };
  }

  private static parseArrayField(value: string): string[] {
    if (!value || typeof value !== 'string') {
      return [];
    }

    return value
      .split(/[,;|]/) // Split on comma, semicolon, or pipe
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  static generateTemplate(): Uint8Array {
    const templateData = [
      [
        'Text',
        'Q1 Objective',
        'Q2 Objective',
        'Q3 Objective',
        'Q4 Objective',
        'Q1 Status',
        'Q2 Status',
        'Q3 Status',
        'Q4 Status',
        'ORD LT Sponsors',
        'Sponsors/Leads',
        'Reporting Owners',
        'Progress Updates',
        'Q1 2025 Progress',
        'Q2 2025 Progress',
        'Q3 2025 Progress',
        'Q4 2025 Progress',
        'Q1 2026 Progress',
        'Q2 2026 Progress',
        'Q3 2026 Progress',
        'Q4 2026 Progress',
        'Goal ID',
        'Category ID',
        'Pillar ID'
      ],
      // Empty row for user to fill in
      [
        '', // Text
        '', // Q1 Objective
        '', // Q2 Objective
        '', // Q3 Objective
        '', // Q4 Objective
        '', // Q1 Status
        '', // Q2 Status
        '', // Q3 Status
        '', // Q4 Status
        '', // ORD LT Sponsors
        '', // Sponsors/Leads
        '', // Reporting Owners
        '', // Progress Updates
        '', // Q1 2025 Progress
        '', // Q2 2025 Progress
        '', // Q3 2025 Progress
        '', // Q4 2025 Progress
        '', // Q1 2026 Progress
        '', // Q2 2026 Progress
        '', // Q3 2026 Progress
        '', // Q4 2026 Progress
        '', // Goal ID - USER MUST FILL
        '', // Category ID - USER MUST FILL
        ''  // Pillar ID - USER MUST FILL
      ]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Add comments/notes to required columns
    if (worksheet['V2']) { // Goal ID column
      worksheet['V2'].c = [{ a: 'System', t: 'Required: Get real Goal IDs from admin interface' }];
    }
    if (worksheet['W2']) { // Category ID column
      worksheet['W2'].c = [{ a: 'System', t: 'Required: Get real Category IDs from admin interface' }];
    }
    if (worksheet['X2']) { // Pillar ID column
      worksheet['X2'].c = [{ a: 'System', t: 'Required: Get real Pillar IDs from admin interface' }];
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Strategic Programs');

    return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  }
}