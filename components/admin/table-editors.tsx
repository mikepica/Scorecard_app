"use client"

import React from 'react';
import { DataTable, DataTableColumn } from './data-table';

const statusOptions = [
  { value: 'exceeded', label: 'Exceeded' },
  { value: 'on-track', label: 'On Track' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'missed', label: 'Missed' }
];

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
        return <span className="text-sm font-mono">{value}</span>;
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
      render: (value) => <span className="text-sm font-mono">{value}</span>
    },
    {
      key: 'category_id',
      label: 'Category',
      type: 'select',
      required: true,
      optionsEndpoint: '/api/admin/options?type=categories',
      dependsOn: 'pillar_id',
      render: (value) => <span className="text-sm font-mono">{value}</span>
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
      render: (value) => {
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value || '';
      }
    },
    {
      key: 'sponsors_leads',
      label: 'Sponsor Leads',
      type: 'array',
      render: (value) => {
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value || '';
      }
    },
    {
      key: 'reporting_owners',
      label: 'Reporting Owners',
      type: 'array',
      render: (value) => {
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value || '';
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
      render: (value) => <span className="text-sm font-mono">{value}</span>
    },
    {
      key: 'category_id',
      label: 'Category',
      type: 'select',
      required: true,
      optionsEndpoint: '/api/admin/options?type=categories',
      dependsOn: 'pillar_id',
      render: (value) => <span className="text-sm font-mono">{value}</span>
    },
    {
      key: 'goal_id',
      label: 'Goal',
      type: 'select',
      required: true,
      optionsEndpoint: '/api/admin/options?type=goals',
      dependsOn: 'category_id',
      render: (value) => <span className="text-sm font-mono">{value}</span>
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
      render: (value) => {
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value || '';
      }
    },
    {
      key: 'sponsors_leads',
      label: 'Sponsor Leads',
      type: 'array',
      render: (value) => {
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value || '';
      }
    },
    {
      key: 'reporting_owners',
      label: 'Reporting Owners',
      type: 'array',
      render: (value) => {
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value || '';
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

  return (
    <DataTable
      title="Strategic Programs"
      apiEndpoint="/api/admin/programs"
      columns={columns}
      searchPlaceholder="Search programs..."
    />
  );
}

// Functional Programs Editor
export function FunctionalProgramsEditor() {
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
      render: (value) => <span className="text-sm font-mono">{value}</span>
    },
    {
      key: 'category_id',
      label: 'Category',
      type: 'select',
      required: true,
      optionsEndpoint: '/api/admin/options?type=categories',
      dependsOn: 'pillar_id',
      render: (value) => <span className="text-sm font-mono">{value}</span>
    },
    {
      key: 'goal_id',
      label: 'Goal',
      type: 'select',
      required: true,
      optionsEndpoint: '/api/admin/options?type=goals',
      dependsOn: 'category_id',
      render: (value) => <span className="text-sm font-mono">{value}</span>
    },
    {
      key: 'linked_ord_strategic_program_id',
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
      render: (value) => {
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value || '';
      }
    },
    {
      key: 'sponsors_leads',
      label: 'Sponsor Leads',
      type: 'array',
      render: (value) => {
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value || '';
      }
    },
    {
      key: 'reporting_owners',
      label: 'Reporting Owners',
      type: 'array',
      render: (value) => {
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value || '';
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

  return (
    <DataTable
      title="Functional Programs"
      apiEndpoint="/api/admin/functional-programs"
      columns={columns}
      searchPlaceholder="Search functional programs..."
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