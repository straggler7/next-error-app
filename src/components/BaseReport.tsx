'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Download, RefreshCw } from 'lucide-react';
import { ReportRecord, ReportPayload } from '../services/reportsService';
import ColumnSelector, { ColumnConfig } from './ColumnSelector';
import DatePicker from './DatePicker';
import Pagination from './Pagination';
import { PaginationState } from '../types';
import LoadingSpinner, { TableLoadingState } from './LoadingSpinner';
import TanStackInventoryTable from './TanStackInventoryTable';
import { createColumnHelper, ColumnDef } from '@tanstack/react-table';

interface BaseReportProps {
  title: string;
  reportType: '1340' | '1341' | '1342';
  data: ReportRecord[];
  loading: boolean;
  onRefresh: (payload: ReportPayload) => void;
  onExport?: () => void;
}

// Column configurations by report type
const getDefaultColumns = (reportType: string): ColumnConfig[] => {
  if (reportType === '1340') {
    return [
      { key: 'dln', label: 'DLN', visible: true, width: 150 },
      { key: 'submissionTins', label: 'SSN', visible: true, width: 120 },
      { key: 'submissionNames', label: 'Name Control', visible: true, width: 150 },
      { key: 'serviceCenterId', label: 'Service Center', visible: true, width: 120 },
      { key: 'formType', label: 'Program', visible: true, width: 100 },
      { key: 'controlDay', label: 'Control Day', visible: true, width: 120 },
      { key: 'daysAged', label: 'Days In Inventory', visible: true, width: 120 },
      { key: 'submissionErrorCodes', label: 'Submission Errors', visible: true, width: 150 }
    ];
  }
  
  if (reportType === '1342') {
    return [
      { key: 'dln', label: 'DLN', visible: true, width: 150 },
      { key: 'submissionTins', label: 'SSN', visible: true, width: 120 },
      { key: 'submissionNames', label: 'Name Control', visible: true, width: 150 },
      { key: 'serviceCenterId', label: 'Service Center', visible: true, width: 120 },
      { key: 'formType', label: 'Program', visible: true, width: 100 },
      { key: 'controlDay', label: 'Control Day', visible: true, width: 120 },
      { key: 'daysAged', label: 'Days In Inventory', visible: true, width: 120 },
      { key: 'submissionErrorCodes', label: 'Submission Errors', visible: true, width: 150 },
      { key: 'daysInSuspense', label: 'Days in Suspense', visible: true, width: 130 },
      { key: 'suspendedStatusCode', label: 'Suspended Status Code', visible: true, width: 130 }
    ];
  }
  
  // Default columns for other reports
  return [
    { key: 'dln', label: 'DLN', visible: true, width: 150 },
    { key: 'status', label: 'Status', visible: true, width: 120 },
    { key: 'seid', label: 'SEID', visible: true, width: 100 },
    { key: 'formType', label: 'Form Type', visible: true, width: 100 },
    { key: 'taxPeriod', label: 'Tax Period', visible: true, width: 120 },
    { key: 'createdTime', label: 'Created Time', visible: false, width: 150 },
    { key: 'updatedDate', label: 'Updated Date', visible: false, width: 150 },
    { key: 'submissionTins', label: 'Submission TINs', visible: false, width: 150 },
    { key: 'submissionNames', label: 'Submission Names', visible: false, width: 150 },
    { key: 'submissionErrorCodes', label: 'Error Codes', visible: false, width: 150 },
    { key: 'serviceCenterId', label: 'Service Center', visible: false, width: 120 },
    { key: 'controlDay', label: 'Control Day', visible: false, width: 120 },
    { key: 'daysAged', label: 'Days Aged', visible: false, width: 100 },
    { key: 'processId', label: 'Process ID', visible: false, width: 100 },
    { key: 'statusEventId', label: 'Status Event ID', visible: false, width: 120 },
    { key: 'payloadId', label: 'Payload ID', visible: false, width: 100 },
    { key: 'ageFromDate', label: 'Age From Date', visible: false, width: 120 },
    { key: 'suspendedExpirationDate', label: 'Suspended Expiration', visible: false, width: 150 },
    { key: 'suspendedStatusCode', label: 'Suspended Status Code', visible: false, width: 120 },
    { key: 'clearCodes', label: 'Clear Codes', visible: false, width: 120 },
    { key: 'daysInSuspense', label: 'Days in Suspense', visible: false, width: 130 }
  ];
};

const columnHelper = createColumnHelper<ReportRecord>();

export default function BaseReport({ 
  title, 
  reportType, 
  data, 
  loading, 
  onRefresh, 
  onExport 
}: BaseReportProps) {
  const [columns, setColumns] = useState<ColumnConfig[]>(() => getDefaultColumns(reportType));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const month = (yesterday.getMonth() + 1).toString().padStart(2, '0');
    const day = yesterday.getDate().toString().padStart(2, '0');
    const year = yesterday.getFullYear();
    return `${month}/${day}/${year}`;
  });
  const [selectedServiceCenter, setSelectedServiceCenter] = useState('');
  const [selectedProgramCode, setSelectedProgramCode] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 25,
    totalRecords: 0,
    totalPages: 0
  });

  // Service Center options
  const serviceCenterOptions = [
    'All Service Centers',
    'Andover (16)',
    'Atlanta (31)',
    'Austin (73)',
    'Brookhaven (10)',
    'Cincinnati (21)',
    'Fresno (93)',
    'Kansas City (64)',
    'Memphis (55)',
    'Ogden (87)',
    'Philadelphia (12)'
  ];

  // Program Code options
  const programCodeOptions = [
    'All Program Codes',
    '44720',
    '44730',
  ];

  // No client-side filtering - data comes filtered from API
  const filteredData = data;

  // Update pagination when filtered data changes
  useEffect(() => {
    const totalRecords = filteredData.length;
    const totalPages = Math.ceil(totalRecords / pagination.pageSize);
    setPagination(prev => ({
      ...prev,
      totalRecords,
      totalPages,
      currentPage: Math.min(prev.currentPage, totalPages || 1)
    }));
  }, [filteredData.length, pagination.pageSize]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, pagination.currentPage, pagination.pageSize]);

  // Visible columns
  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible), 
    [columns]
  );

  // TanStack table columns
  const tableColumns = useMemo<ColumnDef<ReportRecord, any>[]>(() => {
    return visibleColumns.map(col => 
      columnHelper.accessor(col.key as keyof ReportRecord, {
        header: col.label,
        cell: ({ getValue }) => {
          const value = getValue();
          return formatCellValue(value, col.key);
        },
        size: col.width,
      })
    );
  }, [visibleColumns]);

  const formatCellValue = (value: any, key: string): string => {
    if (value === null || value === undefined) return '-';
    
    if (key === 'createdTime' || key === 'updatedDate') {
      return new Date(value).toLocaleDateString();
    }
    
    if (key === 'serviceCenterId') {
      const serviceCenterMap: { [key: number]: string } = {
        16: 'Andover',
        31: 'Atlanta', 
        73: 'Austin',
        10: 'Brookhaven',
        21: 'Cincinnati',
        93: 'Fresno',
        64: 'Kansas City',
        55: 'Memphis',
        87: 'Ogden',
        12: 'Philadelphia'
      };
      return serviceCenterMap[value as number] || `Service Center ${value}`;
    }

    if (key === 'submissionErrorCodes' && (!value || value === 'null')) {
      return 'No Errors';
    }

    if (key === 'daysInSuspense') {
      return value !== null && value !== undefined ? value.toString() : '0';
    }

    if (key === 'submissionNames' || key === 'submissionTins') {
      if (!value || value === 'null' || value.trim() === '') {
        return '-';
      }
      // Filter out null values if it's a comma-separated list
      if (value.includes(',')) {
        const values = value.split(',').map((v: string) => v.trim()).filter((v: string) => v && v !== 'null');
        return values.length > 0 ? values.join(', ') : '-';
      }
      return value.toString();
    }
    
    return value.toString();
  };

  const handlePaginationChange = (newPagination: PaginationState) => {
    setPagination(newPagination);
  };

  const handleSubmit = () => {
    const payload: ReportPayload = {
      pageNumber: 1, // Reset to first page on new search
      pageSize: pagination.pageSize,
      reportId: reportType,
      startDateStr: selectedDate,
    };

    // Add optional filter parameters if they have values
    if (searchTerm.trim()) {
      payload.dln = searchTerm.trim();
    }

    if (selectedServiceCenter && selectedServiceCenter !== 'All Service Centers') {
      const centerNumber = selectedServiceCenter.match(/\((\d+)\)/)?.[1];
      if (centerNumber) {
        payload.serviceCenter = centerNumber;
      }
    }

    if (selectedProgramCode && selectedProgramCode !== 'All Program Codes') {
      payload.programCode = selectedProgramCode;
    }

    // Reset pagination to first page
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    onRefresh(payload);
  };

  const handleRefresh = () => {
    handleSubmit(); // Use the same logic as submit
  };

  return (
    <div className="center-panel bg-white rounded-lg shadow-sm p-6 flex flex-col h-full">
          {/* Header */}
          <div className="card-header flex justify-between items-center mb-6 pb-2 border-b-2 border-gray-100">
            <div>
              <h2 className="card-title text-xl font-semibold text-[#003d6b]">
                Report {reportType}: {title}
              </h2>
              <div className="text-sm text-gray-600 mt-1">
                <p>{loading ? 'Loading...' : `${filteredData.length} records found`}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-200 hover:border-gray-400 hover:text-gray-900 hover:-translate-y-0.5 disabled:opacity-50"
              >
                <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {onExport && (
                <button
                  onClick={onExport}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-200 hover:border-gray-400 hover:text-gray-900 hover:-translate-y-0.5"
                >
                  <Download size={16} className="mr-2" />
                  Export
                </button>
              )}
              <ColumnSelector columns={columns} onColumnsChange={setColumns} />
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-4 grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
            {/* DLN Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DLN
              </label>
              {/* <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /> */}
              <input
                type="text"
                placeholder="Enter DLN"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Date Picker */}
            <div>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                label="Start Date"
                placeholder="Select start date..."
              />
            </div>

            {/* Service Center Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Center
              </label>
              <select
                value={selectedServiceCenter}
                onChange={(e) => setSelectedServiceCenter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              >
                {serviceCenterOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Program Code Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program Code
              </label>
              <select
                value={selectedProgramCode}
                onChange={(e) => setSelectedProgramCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              >
                {programCodeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Submit'}
              </button>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedServiceCenter('');
                  setSelectedProgramCode('');
                }}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                title="Clear Filters"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="grid-container flex-1 min-h-0 overflow-auto">
            {loading ? (
              <TableLoadingState />
            ) : filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    No report records found matching your criteria.
                  </p>
                  <button
                    onClick={handleRefresh}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            ) : (
              <TanStackInventoryTable<ReportRecord>
                records={paginatedData}
                selectedRecords={[]}
                onSelectionChange={() => {}}
                columns={tableColumns}
                getRecordId={(record) => record.dln}
              />
            )}
          </div>

          {/* Pagination */}
          {!loading && filteredData.length > 0 && (
            <Pagination
              pagination={pagination}
              onPaginationChange={handlePaginationChange}
            />
          )}
    </div>
  );
}
