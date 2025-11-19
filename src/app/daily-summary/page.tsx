'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckSquare, Square, FileText, UserCheck, XCircle, ArrowLeft } from 'lucide-react';
import Header from '../../components/Header';
import Breadcrumbs, { createBreadcrumbs } from '../../components/Breadcrumbs';
import FilterBar from '../../components/FilterBar';
import TanStackInventoryTable from '../../components/TanStackInventoryTable';
import { createColumnHelper, ColumnDef } from '@tanstack/react-table';
import ActionDropdown from '../../components/ActionDropdown';
import Pagination from '../../components/Pagination';
import LoadingSpinner, { TableLoadingState } from '../../components/LoadingSpinner';
import ErrorAlert from '../../components/ErrorAlert';
import { User, FilterState, PaginationState, ActionDropdownItem } from '../../types';
import { QRInventoryService, QRInventoryRecord, QRInventoryFilters } from '../../services/qrInventoryService';
import { useSeid } from '../../hooks/useSeid';

function DailySummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seid = searchParams.get('seid');
  const currentUserSeid = useSeid();

  const [filters, setFilters] = useState<FilterState>({
    searchAll: '',
    assignedTo: '',
    status: ''
  });

  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 15,
    totalRecords: 0,
    totalPages: 0
  });

  const [records, setRecords] = useState<QRInventoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInitiallyLoaded = useRef(false);
  const [flashMessage, setFlashMessage] = useState<string>("");
  const [showFlash, setShowFlash] = useState(false);

  // Load daily summary records
  const loadDailySummaryRecords = async () => {
    // Prevent duplicate calls if already loading
    if (loading) {
      console.log('Daily Summary: Already loading, skipping duplicate call');
      return;
    }

    try {
      console.log('Daily Summary: Starting loadDailySummaryRecords');
      setLoading(true);
      setError(null);

      // Get selection data from session storage (client-side only)
      let parsedSelectionData: any = {};
      if (typeof window !== 'undefined') {
        const selectionData = sessionStorage.getItem('selectionData');
        console.log('Daily Summary - Raw selectionData from sessionStorage:', selectionData);
        parsedSelectionData = selectionData ? JSON.parse(selectionData) : {};
        console.log('Daily Summary - Parsed selectionData:', parsedSelectionData);
      }

      const dailySummaryFilters: QRInventoryFilters = {
        qrStatus: filters.status,
        seid: parsedSelectionData.seid,
        program: parsedSelectionData.program,
        statusCode: parsedSelectionData.statusCode,
        serviceCenter: parsedSelectionData.serviceCenter
      };

      // Use the daily summary endpoint
      const response = await fetch('/api/v1/era/inventories/inventory-search/daily-summary', {
      // const response = await fetch('/api/v1/era/inventories/daily-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'SEID': parsedSelectionData.seid || 'u1000'
          'SEID': `${currentUserSeid}`
        },
        body: JSON.stringify({
          // seid: parsedSelectionData.seid,
          // programCode: parsedSelectionData.program,
          // statusCode: parsedSelectionData.statusCode,
          // serviceCenter: parsedSelectionData.serviceCenter
          statuses: ['RESOLVED', 'SUSPEND']
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      setRecords(data.records || data);
      setPagination(prev => ({
        ...prev,
        totalRecords: data.totalCount || data.length,
        totalPages: Math.ceil((data.totalCount || data.length) / pagination.pageSize)
      }));
    } catch (err) {
      // setError('Failed to load daily summary records.');
      console.error('Daily Summary: Error loading daily summary records:', err);
      // console.error(err instanceof Error ? err.message : 'Failed to load daily summary records');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters/pagination change
  useEffect(() => {
    console.log('Daily Summary useEffect triggered, hasInitiallyLoaded:', hasInitiallyLoaded.current);
    
    // On first mount, always load
    if (!hasInitiallyLoaded.current) {
      hasInitiallyLoaded.current = true;
      loadDailySummaryRecords();
    } else {
      // On subsequent changes, only load if not currently loading
      if (!loading) {
        loadDailySummaryRecords();
      }
    }
  }, [filters.searchAll, filters.assignedTo, filters.status, pagination.currentPage, pagination.pageSize]);

  // Filter the records based on current filters
  const filteredRecords = records;

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle pagination changes
  const handlePaginationChange = (newPagination: PaginationState) => {
    setPagination(newPagination);
  };

  // Handle reopen functionality - similar to QR Details page
  const handleReopen = async (record: QRInventoryRecord) => {
    const inventoryId = record.inventoryId;
    
    if (!inventoryId) {
      setFlashMessage("No inventory ID available.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
      return;
    }

    try {
      // Make GET call to retrieve the inventory item with workRecord
      const response = await fetch(`/api/v1/era/inventories/${inventoryId}/reopen`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'SEID': `${currentUserSeid}`
        }
      });

      if (response.ok) {
        const inventoryItem = await response.json();
        console.log('Retrieved inventory item for reopen:', inventoryItem);
        
        // Extract workRecord from the inventory item response
        const workRecord = inventoryItem.workRecord;
        
        if (workRecord) {
          // Store the entire inventory item as eraDto in sessionStorage for the workRecord page
          sessionStorage.setItem('eraDto', JSON.stringify(inventoryItem));
          
          // Navigate to workRecord page with qrReviewer flag
          const searchParams = new URLSearchParams({
            qrReviewer: 'false',
            reopen: 'true'
          });
          
          router.push(`/workRecord?${searchParams.toString()}`);
        } else {
          throw new Error('No work record found in inventory item');
        }
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to retrieve inventory item: ${errorText}`);
      }
    } catch (error) {
      console.error('Error reopening record:', error);
      setFlashMessage('Error retrieving work record for reopen. Please try again.');
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
    }
  };

  const columnHelper = createColumnHelper<QRInventoryRecord>();

  // Daily summary columns - same as QR inventory plus Reopen button
  const dailySummaryColumns = useMemo<ColumnDef<QRInventoryRecord, any>[]>(() => [
    columnHelper.accessor('dln', {
      header: 'DLN',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{getValue()}</span>
      ),
      size: 150,
    }),
    columnHelper.accessor('serviceCenterId', {
      header: 'Service Center',
      cell: ({ getValue }) => {
        const serviceCenterMap: { [key: number]: string } = {
          16: 'Austin',
          17: 'Ogden',
          18: 'Kansas City',
          19: 'Fresno',
          20: 'Andover',
          21: 'Charlotte'
        };
        return serviceCenterMap[getValue()] || 'Unknown';
      },
      size: 120,
    }),
    columnHelper.display({
      id: 'programCode',
      header: 'Program Code',
      cell: () => {
        // Get program code from session storage (client-side only)
        if (typeof window !== 'undefined') {
          const selectionData = sessionStorage.getItem('selectionData');
          const parsedData = selectionData ? JSON.parse(selectionData) : {};
          return <span>{parsedData.program || 'N/A'}</span>;
        }
        return <span>N/A</span>;
      },
      size: 120,
    }),
    columnHelper.accessor('formType', {
      header: 'Form Type',
      size: 100,
    }),
    // columnHelper.accessor('formType', {
    //   id: 'returnType',
    //   header: 'Return Type',
    //   cell: ({ getValue }) => {
    //     const formType = getValue();
    //     return formType?.includes('Electronic') ? 'Electronic' : 'Paper';
    //   },
    //   size: 100,
    // }),
    columnHelper.accessor('taxPeriod', {
      header: 'Tax Period',
      size: 100,
    }),
    columnHelper.accessor('submissionErrorCodes', {
      header: 'Errors',
      cell: ({ getValue }) => {
        const errorCodes = getValue();
        const errors = errorCodes ? errorCodes.split(',') : [];
        return (
          <div className="max-w-48">
            <div className="truncate" title={errors.join(', ')}>
              {errors.join(', ') || 'None'}
            </div>
          </div>
        );
      },
      size: 150,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue();
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
      },
      size: 120,
    }),
    columnHelper.accessor('seid', {
      header: 'Worked By',
      size: 100,
    }),
    columnHelper.accessor('controlDay', {
      header: 'Control Day',
      size: 100,
    }),
    columnHelper.accessor('updatedDate', {
      header: 'Updated Date',
      size: 120,
    }),
    // Add Reopen button column
    columnHelper.display({
      id: 'reopen',
      header: 'Actions',
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click
            handleReopen(row.original);
          }}
          className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors duration-200"
        >
          Reopen
        </button>
      ),
      size: 100,
    }),
  ], []);

  // Handle row click to navigate to QR details (optional, keeping same behavior as QR inventory)
  const handleRowClick = (record: QRInventoryRecord) => {
    const serviceCenterMap: { [key: number]: string } = {
      16: 'Austin',
      17: 'Ogden',
      18: 'Kansas City',
      19: 'Fresno',
      20: 'Andover',
      21: 'Charlotte'
    };
    const serviceCenter = serviceCenterMap[record.serviceCenterId] || 'Unknown';
    
    // Store the full record in sessionStorage for access on QR Details page (client-side only)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selectedQRRecord', JSON.stringify({
        ...record,
        serviceCenter // Add the mapped service center name
      }));
    }
    
    router.push(`/qrDetails?inventoryId=${record.inventoryId}&dln=${record.dln}&serviceCenter=${encodeURIComponent(serviceCenter)}&seid=${record.seid}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Breadcrumbs */}
      <div className="px-4 pt-4 pb-2">
        <Breadcrumbs items={createBreadcrumbs.dailySummary()} />
      </div>
      
      {showFlash && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right">
          <span>{flashMessage}</span>
        </div>
      )}
      
      <div className="main-container p-4 max-w-[1900px] mx-auto h-[calc(100vh-80px)]">
        <div className="center-panel bg-white rounded-lg shadow-sm p-6 flex flex-col h-full">
          {/* Header */}
          <div className="card-header flex justify-between items-center mb-6 pb-2 border-b-2 border-gray-100">
            <div className="flex items-center gap-4">
              {/* <button
                onClick={() => router.back()}
                className="back-button inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-gray-200 hover:border-gray-400 hover:text-gray-900 hover:-translate-y-0.5"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Search
              </button> */}
              <div>
                <h2 className="card-title text-xl font-semibold text-[#003d6b]">
                  Daily Summary
                </h2>
                <div className="text-sm text-gray-600 mt-1 space-y-1">
                  {seid && (
                    <p>SEID: {seid}</p>
                  )}
                  {(() => {
                    if (typeof window !== 'undefined') {
                      const selectionData = sessionStorage.getItem('selectionData');
                      const parsedData = selectionData ? JSON.parse(selectionData) : {};
                      return (
                        <>
                          {/* {parsedData.program && (
                            <p>Program: {parsedData.program}</p>
                          )}
                          {parsedData.statusCode && (
                            <p>Status Code: {parsedData.statusCode}</p>
                          )} */}
                        </>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="toolbar flex justify-between items-center gap-4 mb-6">
          </div>

          {/* Filter Bar */}
          {/* <FilterBar 
            filters={filters}
            onFiltersChange={handleFilterChange}
            showQRFilters={true}
          /> */}

          {/* Error Alert */}
          {error && (
            <ErrorAlert 
              message={error} 
              onClose={() => setError(null)} 
            />
          )}

          {/* Table */}
          <div className="grid-container flex-1 min-h-0 overflow-auto">
            {loading ? (
              <TableLoadingState />
            ) : filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Daily Summary Records</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {seid ? `No daily summary records found for SEID: ${seid}` : 'No daily summary records found matching your criteria.'}
                  </p>
                  <button
                    onClick={loadDailySummaryRecords}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            ) : (
              <TanStackInventoryTable<QRInventoryRecord>
                records={filteredRecords}
                selectedRecords={[]}
                onSelectionChange={() => {}}
                onRowClick={undefined}
                columns={dailySummaryColumns}
                getRecordId={(record) => record.inventoryId.toString()}
              />
            )}
          </div>

          {/* Pagination */}
          <Pagination
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
          />
        </div>
      </div>
    </div>
  );
}

export default function DailySummary() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <DailySummaryContent />
    </Suspense>
  );
}
