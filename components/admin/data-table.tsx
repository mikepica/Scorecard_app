"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { EditableField } from '@/components/ui/editable-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Search,
  RefreshCw,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

export interface DataTableColumn {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'readonly' | 'array' | 'timestamp';
  options?: Array<{ value: string; label: string }>;
  optionsEndpoint?: string; // API endpoint to fetch dynamic options
  dependsOn?: string; // Field that this dropdown depends on (for cascading dropdowns)
  required?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  width?: string;
  hideOnCreate?: boolean; // Hide this field when creating new records
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

export interface PaginatedData<T = Record<string, unknown>> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface DataTableProps {
  title: string;
  apiEndpoint: string;
  columns: DataTableColumn[];
  defaultValues?: Record<string, unknown>;
  onRowClick?: (row: Record<string, unknown>) => void;
  allowCreate?: boolean;
  allowDelete?: boolean;
  allowBulkDelete?: boolean;
  searchPlaceholder?: string;
}

export function DataTable({
  title,
  apiEndpoint,
  columns,
  defaultValues = {},
  onRowClick,
  allowCreate = true,
  allowDelete = true,
  allowBulkDelete = true,
  searchPlaceholder = "Search..."
}: DataTableProps) {
  const [data, setData] = useState<PaginatedData>({
    data: [],
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, unknown>>(defaultValues);
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, Array<{ value: string; label: string }>>>({});

  // Fetch dynamic options for dependent fields
  const fetchDependentOptions = useCallback(async (updatedData: Record<string, unknown>) => {
    const optionsToFetch = columns.filter(col => col.optionsEndpoint && col.dependsOn);
    
    for (const column of optionsToFetch) {
      try {
        const dependencyValue = updatedData[column.dependsOn!];
        if (!dependencyValue) {
          // Clear options for this field if dependency is not set
          setDynamicOptions(prev => ({
            ...prev,
            [column.key]: []
          }));
          continue;
        }

        let endpoint = column.optionsEndpoint!;
        
        // Add dependency parameters
        if (column.key === 'category_id' && column.dependsOn === 'pillar_id') {
          endpoint += endpoint.includes('?') ? `&pillarId=${dependencyValue}` : `?pillarId=${dependencyValue}`;
        } else if (column.key === 'goal_id' && column.dependsOn === 'category_id') {
          endpoint += endpoint.includes('?') ? `&categoryId=${dependencyValue}` : `?categoryId=${dependencyValue}`;
        }
        
        const response = await fetch(endpoint);
        if (response.ok) {
          const options = await response.json();
          setDynamicOptions(prev => ({
            ...prev,
            [column.key]: options
          }));
        }
      } catch (error) {
        console.error(`Error fetching dependent options for ${column.key}:`, error);
      }
    }
  }, [columns]);

  // Fetch dynamic options for select fields (backward compatibility)
  const fetchDynamicOptions = useCallback(async () => {
    await fetchDependentOptions(newRowData);
  }, [fetchDependentOptions, newRowData]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: data.page.toString(),
        limit: data.limit.toString(),
        ...(search && { search }),
        ...(sortColumn && { sortColumn, sortDirection })
      });

      const response = await fetch(`${apiEndpoint}?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, data.page, data.limit, search, sortColumn, sortDirection]);

  // Fetch initial options for non-dependent fields on mount
  const fetchInitialOptions = useCallback(async () => {
    const optionsToFetch = columns.filter(col => col.optionsEndpoint && !col.dependsOn);
    
    for (const column of optionsToFetch) {
      try {
        const response = await fetch(column.optionsEndpoint!);
        if (response.ok) {
          const options = await response.json();
          setDynamicOptions(prev => ({
            ...prev,
            [column.key]: options
          }));
        }
      } catch (error) {
        console.error(`Error fetching initial options for ${column.key}:`, error);
      }
    }
  }, [columns]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchInitialOptions();
  }, [fetchInitialOptions]);

  useEffect(() => {
    fetchDynamicOptions();
  }, [fetchDynamicOptions]);

  const handleSort = (columnKey: string) => {
    if (!columns.find(col => col.key === columnKey)?.sortable) return;
    
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortColumn(columnKey);
      setSortDirection('ASC');
    }
  };

  const handleUpdateCell = async (rowId: string, columnKey: string, newValue: unknown) => {
    try {
      const updateData = { id: rowId, [columnKey]: newValue };
      const response = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update');
      }

      toast.success('Updated successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating cell:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update');
    }
  };

  const handleCreateNew = async () => {
    try {
      // Validate required fields
      const missingFields = columns
        .filter(col => col.required && !newRowData[col.key])
        .map(col => col.label);

      if (missingFields.length > 0) {
        toast.error(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRowData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create');
      }

      toast.success('Created successfully');
      setIsCreatingNew(false);
      setNewRowData(defaultValues);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error creating row:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${apiEndpoint}?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }

      toast.success('Deleted successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error deleting row:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return;

    try {
      const response = await fetch(`${apiEndpoint}?bulk=true`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedRows) })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }

      toast.success(`Deleted ${selectedRows.size} items successfully`);
      setSelectedRows(new Set());
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  const handleExport = async () => {
    try {
      // Export all data (no pagination)
      const params = new URLSearchParams({
        page: '1',
        limit: '10000', // Large limit to get all data
        ...(search && { search })
      });

      const response = await fetch(`${apiEndpoint}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch data for export');

      const result = await response.json();
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const renderCellValue = (value: unknown, column: DataTableColumn, row: Record<string, unknown>) => {
    if (column.render) {
      return column.render(value, row);
    }

    switch (column.type) {
      case 'array':
        if (Array.isArray(value)) {
          return (
            <>
              {value.map((item, index) => (
                <Badge key={`${column.key}-${index}-${item}`} variant="secondary" className="mr-1">
                  {item}
                </Badge>
              ))}
            </>
          );
        }
        return <span className="text-gray-400">No data</span>;

      case 'timestamp':
        return value ? new Date(value as string | number | Date).toLocaleDateString() : '';

      case 'select':
        const option = column.options?.find(opt => opt.value === value);
        return option ? (
          <Badge variant={value === 'exceeded' ? 'default' : 
                       value === 'on-track' ? 'secondary' :
                       value === 'delayed' ? 'destructive' : 'outline'}>
            {option.label}
          </Badge>
        ) : (value as string);

      default:
        return (value as string) || '';
    }
  };

  const renderEditableCell = (value: unknown, column: DataTableColumn, row: Record<string, unknown>) => {
    if (column.type === 'readonly') {
      return renderCellValue(value, column, row);
    }

    return (
      <EditableField
        value={(value as string) || ''}
        onSave={(newValue) => handleUpdateCell(row.id as string, column.key, newValue)}
        type={column.type === 'textarea' ? 'textarea' : 'text'}
        placeholder={`Enter ${column.label.toLowerCase()}`}
      />
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchData}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            {allowCreate && (
              <Button
                onClick={() => setIsCreatingNew(true)}
                size="sm"
              >
                <Plus className="w-4 h-4" />
                Add New
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {allowBulkDelete && selectedRows.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4" />
                  Delete {selectedRows.size}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Bulk Delete</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedRows.size} selected items?
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {allowBulkDelete && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedRows.size === data.data.length && data.data.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRows(new Set(data.data.map(row => row.id as string)));
                      } else {
                        setSelectedRows(new Set());
                      }
                    }}
                  />
                </TableHead>
              )}
              
              {columns.map((column) => (
                <TableHead 
                  key={column.key}
                  className={column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.required && <span className="text-red-500">*</span>}
                    {column.sortable && sortColumn === column.key && (
                      sortDirection === 'ASC' ? 
                        <ChevronUp className="w-4 h-4" /> : 
                        <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
              ))}
              
              {allowDelete && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isCreatingNew && (
              <TableRow className="bg-blue-50">
                {allowBulkDelete && <TableCell />}
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {column.hideOnCreate ? (
                      <span className="text-gray-400 italic">Auto-generated</span>
                    ) : column.type === 'select' ? (
                      <Select
                        value={(newRowData[column.key] as string) || ''}
                        onValueChange={async (value) => {
                          const updatedData = { ...newRowData, [column.key]: value };
                          
                          // Clear dependent field values when parent changes
                          if (column.key === 'pillar_id') {
                            updatedData.category_id = '';
                            updatedData.goal_id = '';
                          } else if (column.key === 'category_id') {
                            updatedData.goal_id = '';
                          }
                          
                          setNewRowData(updatedData);
                          
                          // Trigger re-fetch of dependent dropdowns immediately with the updated data
                          if (column.key === 'pillar_id' || column.key === 'category_id') {
                            await fetchDependentOptions(updatedData);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${column.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {(column.options || dynamicOptions[column.key] || []).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : column.type === 'readonly' ? (
                      <span className="text-gray-400">Read-only</span>
                    ) : (
                      <Input
                        value={(newRowData[column.key] as string) || ''}
                        onChange={(e) => 
                          setNewRowData(prev => ({ ...prev, [column.key]: e.target.value }))
                        }
                        placeholder={`Enter ${column.label.toLowerCase()}`}
                        disabled={column.type === 'timestamp'}
                      />
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateNew}>
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setIsCreatingNew(false);
                        setNewRowData(defaultValues);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {data.data.map((row) => (
              <TableRow 
                key={row.id as string}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                onClick={() => onRowClick?.(row)}
              >
                {allowBulkDelete && (
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(row.id as string)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedRows);
                        if (checked) {
                          newSelected.add(row.id as string);
                        } else {
                          newSelected.delete(row.id as string);
                        }
                        setSelectedRows(newSelected);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                )}

                {columns.map((column) => (
                  <TableCell 
                    key={column.key}
                    onClick={(e) => column.type !== 'readonly' && e.stopPropagation()}
                  >
                    {renderEditableCell(row[column.key], column, row)}
                  </TableCell>
                ))}

                {allowDelete && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this item? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(row.id as string)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {data.data.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No data found
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading...
          </div>
        )}

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {((data.page - 1) * data.limit) + 1} to{' '}
              {Math.min(data.page * data.limit, data.total)} of {data.total} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => setData(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {data.page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.totalPages}
                onClick={() => setData(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}