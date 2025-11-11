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
import { mockUser } from '../../data/mockData';
import { useSeid } from '../../hooks/useSeid';
import { useAuth } from '../../contexts/AuthContext';

function QRInventoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seidFromUrl = searchParams.get('seid');
  const currentUserSeid = useSeid();
  const { user, isAuthenticated, isLoading, seid: authSeid } = useAuth();
  
  console.log('QR Inventory: Auth Debug:', {
    currentUserSeid,
    authSeid,
    seidFromUrl,
    user,
    isAuthenticated,
    isLoading
  });

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

  const [qrRecords, setQRRecords] = useState<QRInventoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInitiallyLoaded = useRef(false);


  // Load QR records
  const loadQRRecords = async () => {
    // Prevent duplicate calls if already loading
    if (loading) {
      console.log('QR Inventory: Already loading, skipping duplicate call');
      return;
    }

    try {
      console.log('QR Inventory: Starting loadQRRecords');
      setLoading(true);
      setError(null);

      // Get selection data from session storage (client-side only)
      let parsedSelectionData: any = {};
      if (typeof window !== 'undefined') {
        const selectionData = sessionStorage.getItem('selectionData');
        console.log('QR Inventory - Raw selectionData from sessionStorage:', selectionData);
        parsedSelectionData = selectionData ? JSON.parse(selectionData) : {};
        console.log('QR Inventory - Parsed selectionData:', parsedSelectionData);
      }

      const qrFilters: QRInventoryFilters = {
        // searchAll: filters.searchAll,
        // assignedTo: filters.assignedTo,
        qrStatus: filters.status,
        seid: parsedSelectionData.seid,
        program: parsedSelectionData.program,
        statusCode: parsedSelectionData.statusCode,
        serviceCenter: parsedSelectionData.serviceCenter
      };

      console.log('QR Inventory: currentUserSeid before call:', currentUserSeid);
      const response = await QRInventoryService.getQRRecords(
        qrFilters,
        pagination.currentPage,
        pagination.pageSize,
        currentUserSeid || undefined
      );

      setQRRecords(response?.records || []);
      setPagination(prev => ({
        ...prev,
        totalRecords: response?.totalCount || 0,
        totalPages: response?.totalPages || 0
      }));
    } catch (err) {
      // setError('Failed to load QR records');
      console.error('QR Inventory: Error loading QR records:', err);
      console.error(err instanceof Error ? err.message : 'Failed to load QR records');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters/pagination change
  useEffect(() => {
    console.log('QR Inventory useEffect triggered, hasInitiallyLoaded:', hasInitiallyLoaded.current);
    
    // On first mount, always load
    if (!hasInitiallyLoaded.current) {
      hasInitiallyLoaded.current = true;
      loadQRRecords();
    } else {
      // On subsequent changes, only load if not currently loading
      if (!loading) {
        loadQRRecords();
      }
    }
  }, [filters.searchAll, filters.assignedTo, filters.status, pagination.currentPage, pagination.pageSize]); // Use specific filter properties instead of entire object

  // Filter the records based on current filters
  const filteredRecords = qrRecords;

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle pagination changes
  const handlePaginationChange = (newPagination: PaginationState) => {
    setPagination(newPagination);
  };

  const columnHelper = createColumnHelper<QRInventoryRecord>();

  // QR-specific columns - only the required fields
  const qrColumns = useMemo<ColumnDef<QRInventoryRecord, any>[]>(() => [
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
  ], []);

  // Handle row click to navigate to QR details
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
        <Breadcrumbs items={createBreadcrumbs.qrInventory()} />
      </div>
      
      <div className="main-container p-4 max-w-[1900px] mx-auto h-[calc(100vh-80px)]">
        <div className="center-panel bg-white rounded-lg shadow-sm p-6 flex flex-col h-full">
          {/* Header */}
          <div className="card-header flex justify-between items-center mb-6 pb-2 border-b-2 border-gray-100">
            <div className="flex items-center gap-4">
             {/* 
              <button
                onClick={() => router.back()}
                className="back-button inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-gray-200 hover:border-gray-400 hover:text-gray-900 hover:-translate-y-0.5"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Search
              </button>
              
              */}
              <div>
                <h2 className="card-title text-xl font-semibold text-[#003d6b]">
                  QR Review Inventory
                </h2>
                <div className="text-sm text-gray-600 mt-1 space-y-1">
                  {authSeid && (
                    <p>SEID: {authSeid}</p>
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Records for QR</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {authSeid ? `No QR review records found for SEID: ${authSeid}` : 'No QR review records found matching your criteria.'}
                  </p>
                  <button
                    onClick={loadQRRecords}
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
                onRowClick={handleRowClick}
                columns={qrColumns}
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

export default function QRInventory() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <QRInventoryContent />
    </Suspense>
  );
}
