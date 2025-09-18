"use client"

import React, { useState, useRef } from 'react';
import { DataTable, DataTableColumn } from './data-table';
import { Button } from '@/components/ui/button';
import { Upload, Download } from 'lucide-react';
import { toast } from 'sonner';

const statusOptions = [
  { value: 'exceeded', label: 'Exceeded' },
  { value: 'on-track', label: 'On Track' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'missed', label: 'Missed' }
];

// Excel Upload Component for Strategic Programs
function ExcelUploadActions({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/programs/upload');
      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'strategic_programs_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Only Excel files (.xlsx, .xls) are supported');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/programs/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok && response.status >= 500) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error(`Invalid response from server: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        console.error('Upload API Error:', result);
        const errorMessage = result.error || 'Upload failed';

        // Special handling for foreign key validation errors
        if (result.error === 'Foreign key validation failed' && result.details) {
          const detailsText = Array.isArray(result.details) ? result.details.join('\n') : result.details;
          throw new Error(`${errorMessage}\n\n${detailsText}\n\nTo get valid IDs:\n• Go to the Pillars tab to find Pillar IDs\n• Go to the Categories tab to find Category IDs\n• Go to the Goals tab to find Goal IDs`);
        }

        const errorDetails = result.details ? `\nDetails: ${Array.isArray(result.details) ? result.details.join('\n') : result.details}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      toast.success(`Upload successful! Created: ${result.details.created}, Updated: ${result.details.updated}`);

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        onChange={handleFileUpload}
        className="hidden"
      />

      <Button
        onClick={downloadTemplate}
        variant="outline"
        size="sm"
      >
        <Download className="w-4 h-4" />
        Template
      </Button>

      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        size="sm"
        disabled={uploading}
      >
        <Upload className="w-4 h-4" />
        {uploading ? 'Uploading...' : 'Upload Excel'}
      </Button>
    </>
  );
}

// Excel Upload Component for Functional Programs
function FunctionalExcelUploadActions({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/functional-programs/upload');
      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'functional_programs_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Only Excel files (.xlsx, .xls) are supported');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/functional-programs/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok && response.status >= 500) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error(`Invalid response from server: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        console.error('Upload API Error:', result);
        const errorMessage = result.error || 'Upload failed';

        // Special handling for foreign key validation errors
        if (result.error === 'Foreign key validation failed' && result.details) {
          const detailsText = Array.isArray(result.details) ? result.details.join('\n') : result.details;
          throw new Error(`${errorMessage}\n\n${detailsText}\n\nTo get valid IDs:\n• Go to the Pillars tab to find Pillar IDs\n• Go to the Categories tab to find Category IDs\n• Go to the Goals tab to find Goal IDs\n• Go to the Programs tab to find Strategic Program IDs for linking`);
        }

        const errorDetails = result.details ? `\nDetails: ${Array.isArray(result.details) ? result.details.join('\n') : result.details}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      toast.success(`Upload successful! Created: ${result.details.created}, Updated: ${result.details.updated}`);

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        onChange={handleFileUpload}
        className="hidden"
      />

      <Button
        onClick={downloadTemplate}
        variant="outline"
        size="sm"
      >
        <Download className="w-4 h-4" />
        Template
      </Button>

      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        size="sm"
        disabled={uploading}
      >
        <Upload className="w-4 h-4" />
        {uploading ? 'Uploading...' : 'Upload Excel'}
      </Button>
    </>
  );
}

// Strategic Pillars Editor
export function PillarsEditor() {
  const columns: DataTableColumn[] = [
    {
      key: 'id',
      label: 'ID',
      type: 'readonly',
      width: '200px',
      sortable: true,
      hideOnCreate: true
    },
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      searchable: true,
      sortable: true
    },
    {
      key: 'created_at',
      label: 'Created',
      type: 'timestamp',
      sortable: true,
      width: '150px'
    },
    {
      key: 'updated_at',
      label: 'Updated',
      type: 'timestamp',
      sortable: true,
      width: '150px'
    }
  ];

  return (
    <DataTable
      title="Strategic Pillars"
      apiEndpoint="/api/admin/pillars"
      columns={columns}
      searchPlaceholder="Search pillars..."
    />
  );
}

// Categories Editor
export function CategoriesEditor() {
  const columns: DataTableColumn[] = [
    {
      key: 'id',
      label: 'ID',
      type: 'readonly',
      width: '200px',
      sortable: true,
      hideOnCreate: true
    },
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      searchable: true,
      sortable: true
    },
    {
      key: 'pillar_id',
      label: 'Pillar',
      type: 'select',
      required: true,
      optionsEndpoint: '/api/admin/options?type=pillars',
      render: (value) => {
        return <span className="text-sm font-mono">{String(value)}</span>;
      }
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: statusOptions
    },
    {
      key: 'comments',
      label: 'Comments',
      type: 'textarea',
      searchable: true
    },
    {
      key: 'created_at',
      label: 'Created',
      type: 'timestamp',
      sortable: true,
      width: '150px'
    }
  ];

  return (
    <DataTable
      title="Categories"
      apiEndpoint="/api/admin/categories"
      columns={columns}
      searchPlaceholder="Search categories..."
    />
  );
}

// Strategic Goals Editor
export function GoalsEditor() {
  const columns: DataTableColumn[] = [
    {
      key: 'id',
      label: 'ID',
      type: 'readonly',
      width: '200px',
      sortable: true,
      hideOnCreate: true
    },
    {
      key: 'text',
      label: 'Goal Text',
      type: 'textarea',
      required: true,
      searchable: true,
      sortable: true
    },
    {
      key: 'pillar_id',
      label: 'Pillar',
      type: 'select',
      required: true,
      optionsEndpoint: '/api/admin/options?type=pillars',
      render: (value) => <span className="text-sm font-mono">{String(value)}</span>
    },
    {
      key: 'category_id',
      label: 'Category',
      type: 'select',
      required: true,
      optionsEndpoint: '/api/admin/options?type=categories',
      dependsOn: 'pillar_id',
      render: (value) => <span className="text-sm font-mono">{String(value)}</span>
    },
    {
      key: 'q1_2025_status',
      label: 'Q1 2025 Status',
      type: 'select',
      options: statusOptions
    },
    {
      key: 'q2_2025_status',
      label: 'Q2 2025 Status',
      type: 'select',
      options: statusOptions
    },
    {
      key: 'q3_2025_status',
      label: 'Q3 2025 Status',
      type: 'select',
      options: statusOptions
    },
    {
      key: 'q4_2025_status',
      label: 'Q4 2025 Status',
      type: 'select',
      options: statusOptions
    },
    {
      key: 'ord_lt_sponsors',
      label: 'ORD LT Sponsors',
      type: 'array',
      render: (value, _row): React.ReactNode => { // eslint-disable-line @typescript-eslint/no-unused-vars
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return String(value || '');
      }
    },
    {
      key: 'sponsors_leads',
      label: 'Sponsor Leads',
      type: 'array',
      render: (value, _row): React.ReactNode => { // eslint-disable-line @typescript-eslint/no-unused-vars
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return String(value || '');
      }
    },
    {
      key: 'reporting_owners',
      label: 'Reporting Owners',
      type: 'array',
      render: (value, _row): React.ReactNode => { // eslint-disable-line @typescript-eslint/no-unused-vars
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return String(value || '');
      }
    },
    {
      key: 'progress_updates',
      label: 'Progress Updates',
      type: 'textarea',
      searchable: true
    },
    {
      key: 'comments',
      label: 'Comments',
      type: 'textarea',
      searchable: true
    }
  ];

  return (
    <DataTable
      title="Strategic Goals"
      apiEndpoint="/api/admin/goals"
      columns={columns}
      searchPlaceholder="Search goals..."
    />
  );
}

// Strategic Programs Editor
export function ProgramsEditor() {
  const columns: DataTableColumn[] = [
    {
      key: 'id',
      label: 'ID',
      type: 'readonly',
      width: '200px',
      sortable: true,
      hideOnCreate: true
    },
    {
      key: 'text',
      label: 'Program Text',
      type: 'textarea',
      required: true,
      searchable: true,
      sortable: true
    },
    {
      key: 'pillar_id',
      label: 'Pillar',
      type: 'select',
      required: true,
      optionsEndpoint: '/api/admin/options?type=pillars',
      render: (value) => <span className="text-sm font-mono">{String(value)}</span>
    },
    {
      key: 'category_id',
      label: 'Category',
      type: 'select',
      required: true,
      optionsEndpoint: '/api/admin/options?type=categories',
      dependsOn: 'pillar_id',
      render: (value) => <span className="text-sm font-mono">{String(value)}</span>
    },
    {
      key: 'goal_id',
      label: 'Goal',
      type: 'select',
      required: true,
      optionsEndpoint: '/api/admin/options?type=goals',
      dependsOn: 'category_id',
      render: (value) => <span className="text-sm font-mono">{String(value)}</span>
    },
    {
      key: 'q1_2025_objective',
      label: 'Q1 2025 Objective',
      type: 'textarea'
    },
    {
      key: 'q1_2025_status',
      label: 'Q1 2025 Status',
      type: 'select',
      options: statusOptions
    },
    {
      key: 'q2_2025_objective',
      label: 'Q2 2025 Objective',
      type: 'textarea'
    },
    {
      key: 'q2_2025_status',
      label: 'Q2 2025 Status',
      type: 'select',
      options: statusOptions
    },
    {
      key: 'q3_2025_objective',
      label: 'Q3 2025 Objective',
      type: 'textarea'
    },
    {
      key: 'q3_2025_status',
      label: 'Q3 2025 Status',
      type: 'select',
      options: statusOptions
    },
    {
      key: 'q4_2025_objective',
      label: 'Q4 2025 Objective',
      type: 'textarea'
    },
    {
      key: 'q4_2025_status',
      label: 'Q4 2025 Status',
      type: 'select',
      options: statusOptions
    },
    {
      key: 'ord_lt_sponsors',
      label: 'ORD LT Sponsors',
      type: 'array',
      render: (value, _row): React.ReactNode => { // eslint-disable-line @typescript-eslint/no-unused-vars
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return String(value || '');
      }
    },
    {
      key: 'sponsors_leads',
      label: 'Sponsor Leads',
      type: 'array',
      render: (value, _row): React.ReactNode => { // eslint-disable-line @typescript-eslint/no-unused-vars
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return String(value || '');
      }
    },
    {
      key: 'reporting_owners',
      label: 'Reporting Owners',
      type: 'array',
      render: (value, _row): React.ReactNode => { // eslint-disable-line @typescript-eslint/no-unused-vars
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return String(value || '');
      }
    },
    {
      key: 'progress_updates',
      label: 'Progress Updates',
      type: 'textarea',
      searchable: true
    },
    {
      key: 'q1_2025_progress',
      label: 'Q1 2025 Progress',
      type: 'textarea'
    },
    {
      key: 'q2_2025_progress',
      label: 'Q2 2025 Progress',
      type: 'textarea'
    },
    {
      key: 'q3_2025_progress',
      label: 'Q3 2025 Progress',
      type: 'textarea'
    },
    {
      key: 'q4_2025_progress',
      label: 'Q4 2025 Progress',
      type: 'textarea'
    },
    {
      key: 'start_quarter',
      label: 'Start Quarter',
      type: 'text',
      width: '120px'
    },
    {
      key: 'end_quarter',
      label: 'End Quarter',
      type: 'text',
      width: '120px'
    },
    {
      key: 'updated_at',
      label: 'Last Updated',
      type: 'timestamp',
      sortable: true,
      width: '150px'
    }
  ];

  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <DataTable
      key={refreshKey}
      title="Strategic Programs"
      apiEndpoint="/api/admin/programs"
      columns={columns}
      searchPlaceholder="Search programs..."
      customActions={<ExcelUploadActions onUploadSuccess={handleUploadSuccess} />}
    />
  );
}

// Functional Programs Editor
export function FunctionalProgramsEditor() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const columns: DataTableColumn[] = [
    {
      key: 'id',
      label: 'ID',
      type: 'readonly',
      width: '200px',
      sortable: true,
      hideOnCreate: true
    },
    {
      key: 'text',
      label: 'Program Text',
      type: 'textarea',
      required: true,
      searchable: true,
      sortable: true
    },
    {
      key: 'function',
      label: 'Function',
      type: 'text',
      searchable: true,
      sortable: true
    },
    {
      key: 'pillar_id',
      label: 'Pillar',
      type: 'select',
      required: true,
      optionsEndpoint: '/api/admin/options?type=pillars',
      render: (value) => <span className="text-sm font-mono">{String(value)}</span>
    },
    {
      key: 'category_id',
      label: 'Category',
      type: 'select',
      required: true,
      optionsEndpoint: '/api/admin/options?type=categories',
      dependsOn: 'pillar_id',
      render: (value) => <span className="text-sm font-mono">{String(value)}</span>
    },
    {
      key: 'goal_id',
      label: 'Goal',
      type: 'select',
      required: true,
      optionsEndpoint: '/api/admin/options?type=goals',
      dependsOn: 'category_id',
      render: (value) => <span className="text-sm font-mono">{String(value)}</span>
    },
    {
      key: 'linked_ORD_strategic_program_ID',
      label: 'Linked ORD Program',
      type: 'text',
      render: (value) => value ? <span className="text-sm font-mono">{value}</span> : <span className="text-gray-400">None</span>
    },
    {
      key: 'q1_2025_objective',
      label: 'Q1 2025 Objective',
      type: 'textarea'
    },
    {
      key: 'q1_2025_status',
      label: 'Q1 2025 Status',
      type: 'select',
      options: statusOptions
    },
    {
      key: 'q2_2025_objective',
      label: 'Q2 2025 Objective',
      type: 'textarea'
    },
    {
      key: 'q2_2025_status',
      label: 'Q2 2025 Status',
      type: 'select',
      options: statusOptions
    },
    {
      key: 'q3_2025_objective',
      label: 'Q3 2025 Objective',
      type: 'textarea'
    },
    {
      key: 'q3_2025_status',
      label: 'Q3 2025 Status',
      type: 'select',
      options: statusOptions
    },
    {
      key: 'q4_2025_objective',
      label: 'Q4 2025 Objective',
      type: 'textarea'
    },
    {
      key: 'q4_2025_status',
      label: 'Q4 2025 Status',
      type: 'select',
      options: statusOptions
    },
    {
      key: 'ord_lt_sponsors',
      label: 'ORD LT Sponsors',
      type: 'array',
      render: (value, _row): React.ReactNode => { // eslint-disable-line @typescript-eslint/no-unused-vars
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return String(value || '');
      }
    },
    {
      key: 'sponsors_leads',
      label: 'Sponsor Leads',
      type: 'array',
      render: (value, _row): React.ReactNode => { // eslint-disable-line @typescript-eslint/no-unused-vars
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return String(value || '');
      }
    },
    {
      key: 'reporting_owners',
      label: 'Reporting Owners',
      type: 'array',
      render: (value, _row): React.ReactNode => { // eslint-disable-line @typescript-eslint/no-unused-vars
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return String(value || '');
      }
    },
    {
      key: 'progress_updates',
      label: 'Progress Updates',
      type: 'textarea',
      searchable: true
    },
    {
      key: 'q1_2025_progress',
      label: 'Q1 2025 Progress',
      type: 'textarea'
    },
    {
      key: 'q2_2025_progress',
      label: 'Q2 2025 Progress',
      type: 'textarea'
    },
    {
      key: 'q3_2025_progress',
      label: 'Q3 2025 Progress',
      type: 'textarea'
    },
    {
      key: 'q4_2025_progress',
      label: 'Q4 2025 Progress',
      type: 'textarea'
    },
    {
      key: 'updated_at',
      label: 'Last Updated',
      type: 'timestamp',
      sortable: true,
      width: '150px'
    }
  ];

  return (
    <DataTable
      key={refreshKey}
      title="Functional Programs"
      apiEndpoint="/api/admin/functional-programs"
      columns={columns}
      searchPlaceholder="Search functional programs..."
      customActions={<FunctionalExcelUploadActions onUploadSuccess={handleUploadSuccess} />}
    />
  );
}

// Progress Update History Viewer (Read-only)
export function ProgressUpdateHistoryViewer() {
  const columns: DataTableColumn[] = [
    {
      key: 'id',
      label: 'ID',
      type: 'readonly',
      width: '200px',
      sortable: true,
      hideOnCreate: true
    },
    {
      key: 'program_id',
      label: 'Program ID',
      type: 'readonly',
      width: '200px'
    },
    {
      key: 'program_text',
      label: 'Program',
      type: 'readonly',
      searchable: true,
      render: (value) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'previous_value',
      label: 'Previous Value',
      type: 'readonly',
      render: (value) => (
        <div className="max-w-xs truncate bg-red-50 p-2 rounded text-sm" title={value}>
          {value || '<empty>'}
        </div>
      )
    },
    {
      key: 'new_value',
      label: 'New Value',
      type: 'readonly',
      render: (value) => (
        <div className="max-w-xs truncate bg-green-50 p-2 rounded text-sm" title={value}>
          {value || '<empty>'}
        </div>
      )
    },
    {
      key: 'changed_by',
      label: 'Changed By',
      type: 'readonly',
      width: '150px'
    },
    {
      key: 'changed_at',
      label: 'Changed At',
      type: 'timestamp',
      sortable: true,
      width: '150px'
    }
  ];

  return (
    <DataTable
      title="Progress Update History"
      apiEndpoint="/api/admin/progress-history"
      columns={columns}
      searchPlaceholder="Search history..."
      allowCreate={false}
      allowDelete={false}
      allowBulkDelete={false}
    />
  );
}