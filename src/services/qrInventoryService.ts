export interface QRInventoryRecord {
  inventoryId: number;
  processId: number;
  createdTime: string;
  taxPeriod: string;
  statusEventId: number;
  status: string;
  updatedDate: string;
  payloadId: number;
  seid: string;
  submissionTins: string;
  submissionErrorCodes: string | null;
  submissionNames: string;
  ageFromDate: string | null;
  daysAged: number;
  suspendedExpirationDate: string | null;
  suspendedStatusCode: string | null;
  clearCodes: string | null;
  dln: string;
  formType: string;
  controlDay: string;
  serviceCenterId: number;
  // Computed fields for display
  serviceCenter?: string;
  returnType?: string;
  errors?: string[];
  assignedTo?: string;
  qrStatus?: 'pending' | 'approved' | 'rejected' | 'rework';
}

export interface QRInventoryFilters {
  searchAll?: string;
  assignedTo?: string;
  qrStatus?: string;
  serviceCenter?: string;
  seid?: string;
  program?: string;
  statusCode?: string;
}

export interface QRInventoryResponse {
  records: QRInventoryRecord[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export class QRInventoryService {
  static async getQRRecords(
    filters: QRInventoryFilters = {},
    page: number = 1,
    pageSize: number = 15,
    currentUserSeid?: string
  ): Promise<QRInventoryResponse | undefined> {
    try {
      // Build query parameters
      const params = new URLSearchParams({
        status: 'QR_HOLD',
        page: page.toString(),
        pageSize: pageSize.toString()
      });

      // Add optional filters
      if (filters.seid) {
        params.append('seid', filters.seid);
      }
      if (filters.program) {
        params.append('program', filters.program);
      }
      if (filters.statusCode) {
        params.append('statusCode', filters.statusCode);
      }
      if (filters.searchAll) {
        params.append('search', filters.searchAll);
      }
      // if (filters.assignedTo) {
      //   params.append('assignedTo', filters.assignedTo);
      // }
      // if (filters.serviceCenter) {
      //   params.append('serviceCenter', filters.serviceCenter);
      // }

      // const response = await fetch(`/api/era/inventory?${params.toString()}`, {
      // const response = await fetch(`/api/inventories.json`, {
      // const response = await fetch(`/api/v1/era/inventories/inventory-search`, {
      const response = await fetch(`/api/v1/era/inventories/inventory-search/quality-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': `${currentUserSeid}`
        },
        body: JSON.stringify({
          // status: 'QR_HOLD',
          // page: page.toString(),
          // pageSize: pageSize.toString(),
          ...(filters.seid && { seid: filters.seid }),
          programCode: filters.program,
          statuses: ['QR_HOLD', 'SUSPEND_HOLD'],
          // statusCode: filters.statusCode,
          // serviceCenter: filters.serviceCenter
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Use data directly without transformation
      return {
        records: data || [],
        totalCount: data.length || 0,
        currentPage: page,
        pageSize: pageSize,
        totalPages: Math.ceil((data.length || 0) / pageSize)
      };
    } catch (error) {
      console.error('Error fetching QR records:', error);
      // throw new Error('Failed to fetch QR inventory records');
    }
  }
}
