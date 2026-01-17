'use client';

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckSquare, Square, FileText, UserCheck, XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Header from '../../components/Header';
import Breadcrumbs, { createBreadcrumbs } from '../../components/Breadcrumbs';
import FilterBar from '../../components/FilterBar';
import TanStackInventoryTable from '../../components/TanStackInventoryTable';
import { createColumnHelper, ColumnDef } from '@tanstack/react-table';
import ActionDropdown from '../../components/ActionDropdown';
import Pagination from '../../components/Pagination';
import LoadingSpinner, { TableLoadingState } from '../../components/LoadingSpinner';
import ErrorAlert from '../../components/ErrorAlert';
import WorkLogPanel from '../../components/WorkLogPanel';
import { User, FilterState, PaginationState, ActionDropdownItem } from '../../types';
// import { QRInventoryService, QRInventoryRecord, QRInventoryFilters } from '../../services/qrInventoryService';
import { InventoryRecord } from '../../types';
import { useSeid, useIsManager } from '../../hooks/useSeid';
import { getServiceCenterName } from '../../utils/serviceCenters';
import { useAuth } from '../../contexts/AuthContext';

function DailySummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seid = searchParams.get('seid');
  const currentUserSeid = useSeid();
  const isManager = useIsManager();
  const { user } = useAuth();

  // Check if user is tax examiner or analyst (should show Work Log panel)
  // const shouldShowWorkLog = user?.group === 'tax_examiners' || user?.group === 'analysts';
  const shouldShowWorkLog = true;

  const [filters, setFilters] = useState<FilterState>({
    searchAll: '',
    assignedTo: '',
    status: ''
  });

  const [seidFilter, setSeidFilter] = useState<string>('');

  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 15,
    totalRecords: 0,
    totalPages: 0
  });

  // const [records, setRecords] = useState<QRInventoryRecord[]>([]);
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInitiallyLoaded = useRef(false);
  const [flashMessage, setFlashMessage] = useState<string>("");
  const [showFlash, setShowFlash] = useState(false);

  // Load daily summary records
  const loadDailySummaryRecords = useCallback(async () => {
    // Prevent duplicate calls if already loading
    if (loading) {
      console.log('Daily Summary: Already loading, skipping duplicate call');
      return;
    }

    // Don't make API calls if SEID is not available yet
    if (!currentUserSeid) {
      console.log('Daily Summary: SEID not available yet, skipping API call');
      return;
    }

    // Don't make API calls if user data is still loading (prevents incorrect isManager value)
    if (!user) {
      console.log('Daily Summary: User data not loaded yet, skipping API call');
      return;
    }

    try {
      console.log('Daily Summary: Starting loadDailySummaryRecords with SEID:', currentUserSeid);
      console.log('Daily Summary: isManager:', isManager, 'seidFilter:', seidFilter);
      setLoading(true);
      setError(null);

      const payload = {
        pageNumber: pagination.currentPage,
        pageSize: pagination.pageSize,
        statuses: ['RESOLVED', 'SUSPEND'],
        ...(isManager && { managerSearch: true }),
        ...(seidFilter.trim() && { seid: seidFilter.trim().toLowerCase() })
      };
      
      console.log('Daily Summary: API payload:', JSON.stringify(payload, null, 2));

      // Use the daily summary endpoint
      const response = await fetch('/api/v1/era/inventories/inventory-search/daily-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': `${currentUserSeid}`
        },
        body: JSON.stringify(payload)
      });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      if (!response.ok) {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading daily summary records:", error);
        setError(error.message);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        setRecords([]);
        setPagination(prev => ({
          ...prev,
          totalRecords: 0,
          totalPages: 0
        }));
        return;
      }

      const data = await response.json();
      const records = data.records || data;
      
      setRecords(records);
      setPagination(prev => {
        // If API provides totalCount, use it for accurate pagination
        if (data.totalCount !== undefined) {
          return {
            ...prev,
            totalRecords: data.totalCount,
            totalPages: Math.ceil(data.totalCount / pagination.pageSize)
          };
        }
        
        // If no totalCount, determine pagination based on received records
        const receivedRecords = records.length;
        const hasMorePages = receivedRecords === pagination.pageSize;
        
        return {
          ...prev,
          totalRecords: receivedRecords,
          totalPages: hasMorePages ? Math.max(prev.currentPage + 1, prev.totalPages) : prev.currentPage
        };
      });
    } catch (err) {
      // Clear records on error
      setRecords([]);
      console.error('Daily Summary: Error loading daily summary records:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserSeid, filters.status, pagination.pageSize, pagination.currentPage, isManager, user]);

  // Separate function for Submit button that includes current seidFilter
  const handleSubmitWithSeidFilter = useCallback(async () => {
    // Prevent duplicate calls if already loading
    if (loading) {
      console.log('Daily Summary: Already loading, skipping duplicate call');
      return;
    }

    // Don't make API calls if user data is still loading (prevents incorrect isManager value)
    if (!user) {
      console.log('Daily Summary: User data not loaded yet, skipping API call');
      return;
    }

    try {
      console.log('Daily Summary: Starting handleSubmitWithSeidFilter with SEID:', seidFilter);
      console.log('Daily Summary: isManager:', isManager, 'seidFilter:', seidFilter);
      setLoading(true);
      setError(null);

      const payload = {
        pageNumber: pagination.currentPage,
        pageSize: pagination.pageSize,
        statuses: ['RESOLVED', 'SUSPEND'],
        ...(isManager && { managerSearch: true }),
        ...(seidFilter.trim() && { seid: seidFilter.trim().toLowerCase() })
      };
      
      console.log('Daily Summary: Submit API payload:', JSON.stringify(payload, null, 2));

      // Use the daily summary endpoint
      const response = await fetch('/api/v1/era/inventories/inventory-search/daily-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': `${currentUserSeid}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading daily summary records:", error);
        setError(error.message);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        setRecords([]);
        setPagination(prev => ({
          ...prev,
          totalRecords: 0,
          totalPages: 0
        }));
        return;
      }

      const data = await response.json();
      const records = data.records || data;
      
      setRecords(records);
      setPagination(prev => {
        // If API provides totalCount, use it for accurate pagination
        if (data.totalCount !== undefined) {
          return {
            ...prev,
            totalRecords: data.totalCount,
            totalPages: Math.ceil(data.totalCount / pagination.pageSize)
          };
        }
        
        // If no totalCount, determine pagination based on received records
        const receivedRecords = records.length;
        const hasMorePages = receivedRecords === pagination.pageSize;
        
        return {
          ...prev,
          totalRecords: receivedRecords,
          totalPages: hasMorePages ? Math.max(prev.currentPage + 1, prev.totalPages) : prev.currentPage
        };
      });
    } catch (err) {
      // Clear records on error
      setRecords([]);
      console.error('Daily Summary: Error loading daily summary records:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserSeid, pagination.currentPage, pagination.pageSize, seidFilter, isManager, loading]);

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
  }, [filters.searchAll, filters.assignedTo, filters.status, pagination.currentPage, pagination.pageSize, loadDailySummaryRecords]);

  // Filter the records based on current filters
  const filteredRecords = records;

  // Handle filter changes
  // const handleFilterChange = (newFilters: FilterState) => {
  //   setFilters(newFilters);
  //   setPagination(prev => ({ ...prev, currentPage: 1 }));
  // };

  // Handle pagination changes
  const handlePaginationChange = (newPagination: PaginationState) => {
    setPagination(newPagination);
  };

  // Handle reopen functionality - similar to QR Details page
  const handleReopen = useCallback(async (record: InventoryRecord) => {
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
  }, [currentUserSeid, router, setFlashMessage, setShowFlash]);

  const columnHelper = createColumnHelper<InventoryRecord>();

  // Daily summary columns - same as QR inventory plus Reopen button
  const dailySummaryColumns = useMemo<ColumnDef<InventoryRecord, any>[]>(() => [
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
        return getServiceCenterName(getValue());
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
      cell: ({ row }) => {
        const isDisabled = row.original.seid !== currentUserSeid;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click
              if (!isDisabled) {
                handleReopen(row.original);
              }
            }}
            disabled={isDisabled}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors duration-200 ${
              isDisabled 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Reopen
          </button>
        );
      },
      size: 100,
    }),
  ], [columnHelper, handleReopen, currentUserSeid]);

  // Handle row click to navigate to QR details (optional, keeping same behavior as QR inventory)
  // const handleRowClick = (record: InventoryRecord) => {
  //   const serviceCenter = getServiceCenterName(record.serviceCenterId);
    
  //   // Store the full record in sessionStorage for access on QR Details page (client-side only)
  //   if (typeof window !== 'undefined') {
  //     sessionStorage.setItem('selectedQRRecord', JSON.stringify({
  //       ...record,
  //       serviceCenter // Add the mapped service center name
  //     }));
  //   }
    
  //   router.push(`/qrDetails?inventoryId=${record.inventoryId}&dln=${record.dln}&serviceCenter=${encodeURIComponent(serviceCenter)}&seid=${record.seid}`);
  // };

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
      
      <div className="main-container p-4 mx-auto">
        <div className={`grid gap-6 ${shouldShowWorkLog ? 'grid-cols-[30%_1fr]' : 'grid-cols-1'}`}>
          {/* Work Log Panel - 30% width, only for tax examiners and analysts */}
          {shouldShowWorkLog && (
            <div className="min-h-0">
              <WorkLogPanel />
            </div>
          )}
          
          {/* Main Content Panel - remaining space when Work Log is shown, full width otherwise */}
          <div className="min-h-0">
            <div className="center-panel bg-white rounded-lg shadow-sm p-6 flex flex-col min-h-0">
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
                  Today&apos;s Worked Records
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
            
            {/* Refresh Button */}
            <div className="flex items-center">
              <button
                onClick={loadDailySummaryRecords}
                disabled={loading}
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh records"
              >
                <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="toolbar flex justify-between items-center gap-4 mb-6">
            {/* Manager SEID Filter */}
            {isManager && (
              <div className="flex flex-wrap gap-4 mb-6 items-end">
                <div className="w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SEID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter SEID"
                    value={seidFilter}
                    onChange={(e) => setSeidFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Trigger reload with current SEID filter
                      handleSubmitWithSeidFilter();
                    }}
                    disabled={loading}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'Submit'}
                  </button>
                  <button
                    onClick={() => {
                      setSeidFilter('');
                      // Trigger reload without SEID filter
                      loadDailySummaryRecords();
                    }}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
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
          <div className="flex-1 min-h-0">
            {loading ? (
              <TableLoadingState />
            ) : filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
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
              <TanStackInventoryTable<InventoryRecord>
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
