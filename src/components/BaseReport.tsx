'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Download, RefreshCw } from 'lucide-react';
import { getServiceCenterName, serviceCenters } from '../utils/serviceCenters';
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
  reportType: '0340' | '0540' | '1340' | '1341' | '1342' | '7740' | '7741' | '7746' | '7747';
  data: ReportRecord[];
  loading: boolean;
  onRefresh: (payload: ReportPayload) => void;
  onExport?: (payload: ReportPayload) => void;
}

// Column configurations by report type
const getDefaultColumns = (reportType: string): ColumnConfig[] => {
  if (reportType === '0340') {
    return [
      { key: 'programId', label: 'Program Number', visible: true, width: 150 },
      { key: 'totalInventory', label: 'Total Inventory', visible: true, width: 150 },
      { key: 'day0Inventory', label: 'Day 0 Inventory', visible: true, width: 150 },
      { key: 'day1Inventory', label: 'Day 1 Inventory', visible: true, width: 150 }
    ];
  }

  if (reportType === '0540') {
    return [
      { key: 'dln', label: 'DLN', visible: true, width: 150 },
      { key: 'submissionTins', label: 'SSN', visible: true, width: 120 },
      { key: 'submissionNames', label: 'Name Control', visible: true, width: 150 },
      { key: 'serviceCenterId', label: 'Service Center', visible: true, width: 120 },
      { key: 'formType', label: 'Form Type', visible: true, width: 100 },
      { key: 'programId', label: 'Program', visible: true, width: 100 },
      { key: 'source', label: 'Source', visible: true, width: 120 },
      { key: 'controlDay', label: 'Control Day', visible: true, width: 120 },
      { key: 'daysAged', label: 'Days In Inventory', visible: true, width: 120 },
      { key: 'submissionErrorCodes', label: 'Submission Errors', visible: true, width: 150 }
    ];
  }

  if (reportType === '1340') {
    return [
      { key: 'dln', label: 'DLN', visible: true, width: 150 },
      { key: 'submissionTins', label: 'SSN', visible: true, width: 120 },
      { key: 'submissionNames', label: 'Name Control', visible: true, width: 150 },
      { key: 'serviceCenterId', label: 'Service Center', visible: true, width: 120 },
      { key: 'formType', label: 'Form Type', visible: true, width: 100 },
      { key: 'programId', label: 'Program', visible: true, width: 100 },
      { key: 'source', label: 'Source', visible: true, width: 120 },
      { key: 'controlDay', label: 'Control Day', visible: true, width: 120 },
      { key: 'daysAged', label: 'Days In Inventory', visible: true, width: 120 },
      { key: 'submissionErrorCodes', label: 'Submission Errors', visible: true, width: 150 }
    ];
  }

  if (reportType === '1341') {
    return [
      { key: 'formType', label: 'Form Type', visible: true, width: 100 },
      { key: 'programId', label: 'Program', visible: true, width: 100 },
      { key: 'totalVolume', label: 'Total Volume', visible: true, width: 120 },
      { key: 'daysInErs', label: 'Days In ERS', visible: true, width: 120 },
    ];
  }

  if (reportType === '7740') {
    return [
      { key: 'seid', label: 'Tax Examiner', visible: true, width: 120 },
      { key: 'formType', label: 'Form Type', visible: true, width: 100 },
      { key: 'programId', label: 'Program', visible: true, width: 100 },
      { key: 'totalTimeSpentStr', label: 'Total Hours Worked', visible: true, width: 150 },
      { key: 'totalVolume', label: 'Total Volume Worked', visible: true, width: 150 },
      { key: 'resolvedQty', label: 'Resolved Quantity', visible: true, width: 130 },
      { key: 'deletedQty', label: 'Deleted Quantity', visible: true, width: 130 },
      { key: 'suspendedQty', label: 'Suspended Quantity', visible: true, width: 140 },
      { key: 'reWorkedQty', label: 'ReWorked Quantity', visible: true, width: 140 },
      { key: 'daysInErs', label: 'Days In ERS', visible: true, width: 120 },
    ];
  }

  if (reportType === '7741') {
    return [
      { key: 'formType', label: 'Form Type', visible: true, width: 100 },
      { key: 'programId', label: 'Program', visible: true, width: 100 },
      { key: 'totalTimeSpentStr', label: 'Total Hours Worked', visible: true, width: 150 },
      { key: 'totalVolume', label: 'Total Volume Worked', visible: true, width: 150 },
      { key: 'resolvedQty', label: 'Resolved Quantity', visible: true, width: 130 },
      { key: 'deletedQty', label: 'Deleted Quantity', visible: true, width: 130 },
      { key: 'suspendedQty', label: 'Suspended Quantity', visible: true, width: 140 },
      { key: 'reWorkedQty', label: 'ReWorked Quantity', visible: true, width: 140 },
      { key: 'daysInErs', label: 'Days In ERS', visible: true, width: 120 },
    ];
  }

  if (reportType === '7746') {
    return [
      { key: 'seid', label: 'Tax Examiner', visible: true, width: 120 },
      { key: 'formType', label: 'Form Type', visible: true, width: 100 },
      { key: 'programId', label: 'Program', visible: true, width: 100 },
      { key: 'totalTimeSpentStr', label: 'Total Hours Worked', visible: true, width: 150 },
      { key: 'totalVolume', label: 'Total Volume Worked', visible: true, width: 150 },
      { key: 'resolvedQty', label: 'Resolved Quantity', visible: true, width: 130 },
      { key: 'deletedQty', label: 'Deleted Quantity', visible: true, width: 130 },
      { key: 'suspendedQty', label: 'Suspended Quantity', visible: true, width: 140 },
      { key: 'reWorkedQty', label: 'ReWorked Quantity', visible: true, width: 140 },
      { key: 'daysInErs', label: 'Days In ERS', visible: true, width: 120 },
    ];
  }

  if (reportType === '7747') {
    return [
      { key: 'formType', label: 'Form Type', visible: true, width: 100 },
      { key: 'programId', label: 'Program', visible: true, width: 100 },
      { key: 'totalTimeSpentStr', label: 'Total Hours Worked', visible: true, width: 150 },
      { key: 'totalVolume', label: 'Total Volume Worked', visible: true, width: 150 },
      { key: 'rateOfProductionStr', label: 'Rate of Production', visible: true, width: 150 },
      { key: 'resolvedQty', label: 'Resolved Quantity', visible: true, width: 130 },
      { key: 'deletedQty', label: 'Deleted Quantity', visible: true, width: 130 },
      { key: 'suspendedQty', label: 'Suspended Quantity', visible: true, width: 140 },
      { key: 'reWorkedQty', label: 'ReWorked Quantity', visible: true, width: 140 },
      { key: 'daysInErs', label: 'Days In ERS', visible: true, width: 120 },
    ];
  }
  
  if (reportType === '1342') {
    return [
      { key: 'dln', label: 'DLN', visible: true, width: 150 },
      { key: 'submissionTins', label: 'SSN', visible: true, width: 120 },
      { key: 'submissionNames', label: 'Name Control', visible: true, width: 150 },
      { key: 'serviceCenterId', label: 'Service Center', visible: true, width: 120 },
      { key: 'formType', label: 'Form Type', visible: true, width: 100 },
      { key: 'programId', label: 'Program', visible: true, width: 100 },
      { key: 'source', label: 'Source', visible: true, width: 120 },
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
    { key: 'programId', label: 'Program', visible: true, width: 100 },
    { key: 'source', label: 'Source', visible: true, width: 120 },
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

  // Service Center options - using names from serviceCenters utility
  const serviceCenterOptions = [
    'All Service Centers',
    ...serviceCenters.map(center => center.name)
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
    // For API-based pagination, we don't know the total records upfront
    // We determine if there are more pages based on whether we received a full page of data
    const receivedRecords = data.length;
    const hasMorePages = receivedRecords === pagination.pageSize;
    
    setPagination(prev => ({
      ...prev,
      totalRecords: receivedRecords, // Current page records
      totalPages: hasMorePages ? prev.currentPage + 1 : prev.currentPage, // Enable next if we have full page
    }));
  }, [data.length, pagination.pageSize, pagination.currentPage]);

  // For API-based pagination, data is already paginated - just add unique IDs
  const paginatedData = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    return filteredData.map((record, index) => ({
      ...record,
      _uniqueId: `record-${startIndex + index}-${record.dln || 'no-dln'}`
    }));
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
      return getServiceCenterName(value as number);
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
    
    // If page number changed, fetch new data
    if (newPagination.currentPage !== pagination.currentPage) {
      const payload: ReportPayload = {
        pageNumber: newPagination.currentPage,
        pageSize: newPagination.pageSize,
        reportId: reportType,
        startDateStr: selectedDate,
      };

      // Add current filter parameters
      if (searchTerm.trim() && reportType !== '0340' && reportType !== '0540' && reportType !== '1341' && reportType !== '7740' && reportType !== '7741') {
        payload.dln = searchTerm.trim();
      }

      if (selectedServiceCenter && selectedServiceCenter !== 'All Service Centers' && reportType !== '7740' && reportType !== '7741') {
        payload.serviceCenterEnum = selectedServiceCenter.toUpperCase();
      }

      if (selectedProgramCode && selectedProgramCode !== 'All Program Codes') {
        payload.programCode = selectedProgramCode;
      }

      // Add status for 1340 and 0540 reports
      if (reportType === '1340') {
        payload.status = 'NEW';
      }
      
      if (reportType === '0540') {
        payload.status = 'DELETED';
      }

      onRefresh(payload);
    }
  };

  const handleSubmit = () => {
    const payload: ReportPayload = {
      pageNumber: 1, // Reset to first page on new search
      pageSize: pagination.pageSize,
      reportId: reportType,
      startDateStr: selectedDate,
    };

    // Add optional filter parameters if they have values (exclude DLN for 0340, 1341, 7740, 7741 reports)
    if (searchTerm.trim() && reportType !== '0340' && reportType !== '1341' && reportType !== '7740' && reportType !== '7741') {
      payload.dln = searchTerm.trim();
    }

    // Add service center only for reports that support it (exclude 7740, 7741)
    if (selectedServiceCenter && selectedServiceCenter !== 'All Service Centers' && reportType !== '7740' && reportType !== '7741') {
      payload.serviceCenterEnum = selectedServiceCenter.toUpperCase();
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

  const handleExport = () => {
    if (!onExport) return;
    
    const payload: ReportPayload = {
      pageNumber: 1,
      pageSize: pagination.pageSize,
      reportId: reportType,
      startDateStr: selectedDate,
      export: true, // Add export flag
    };

    // Add optional filter parameters if they have values (exclude DLN for 0340, 1341, 7740, 7741 reports)
    if (searchTerm.trim() && reportType !== '0340' && reportType !== '1341' && reportType !== '7740' && reportType !== '7741') {
      payload.dln = searchTerm.trim();
    }

    // Add service center only for reports that support it (exclude 7740, 7741)
    if (selectedServiceCenter && selectedServiceCenter !== 'All Service Centers' && reportType !== '7740' && reportType !== '7741') {
      payload.serviceCenterEnum = selectedServiceCenter.toUpperCase();
    }

    if (selectedProgramCode && selectedProgramCode !== 'All Program Codes') {
      payload.programCode = selectedProgramCode;
    }

    // Add status for 1340 and 0540 reports
    if (reportType === '1340') {
      payload.status = 'NEW';
    }
    
    if (reportType === '0540') {
      payload.status = 'DELETED';
    }

    onExport(payload);
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
                  onClick={handleExport}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-200 hover:border-gray-400 hover:text-gray-900 hover:-translate-y-0.5"
                >
                  <Download size={16} className="mr-2" />
                  Export
                </button>
            )}
            {/* <ColumnSelector columns={columns} onColumnsChange={setColumns} /> */}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 items-end">
          {/* DLN Search - Hidden for 0340, 1341, 7740, and 7741 reports */}
          {reportType !== '0340' && reportType !== '1341' && reportType !== '7740' && reportType !== '7741' && reportType !== '7746' && reportType !== '7747' && (
            <div className="relative w-48">
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
          )}

          {/* Date Picker */}
          <div className="w-48">
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              label="Start Date"
              placeholder="Select start date..."
            />
          </div>

            {/* Service Center Filter - Hidden for 7740 and 7741 reports */}
            {reportType !== '7740' && reportType !== '7741' && (
              <div className="w-48">
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
            )}

            {/* Program Code Filter */}
            <div className="w-48">
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
            <div className="flex gap-2 items-end">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                getRecordId={(record) => record._uniqueId || `fallback-${record.dln || 'unknown'}`}
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
