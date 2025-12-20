export interface DLNSearchRecord {
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
}

export interface DLNSearchFilters {
  dln?: string;
  tin?: string;
  nameControl?: string;
  programCode?: string;
  serviceCenter?: string;
}

export interface DLNSearchResponse {
  records: DLNSearchRecord[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export class DLNSearchService {
  static async searchByDLN(
    filters: DLNSearchFilters = {},
    page: number = 1,
    pageSize: number = 15,
    currentUserSeid?: string
  ): Promise<DLNSearchResponse | undefined> {
    try {
      const response = await fetch('/api/v1/era/inventories/inventory-search/dlnSearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': `${currentUserSeid}`
        },
        body: JSON.stringify({
          dln: filters.dln || '',
          tin: filters.tin || '',
          nameControl: filters.nameControl || '',
          programCode: filters.programCode || '',
          serviceCenter: filters.serviceCenter || '',
          page: page.toString(),
          pageSize: pageSize.toString()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      
      // Handle both array response and object with records property
      const records = Array.isArray(data) ? data : (data.records || []);
      const totalCount = data.totalCount || records.length;
      
      return {
        records: records,
        totalCount: totalCount,
        currentPage: page,
        pageSize: pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      };
    } catch (error) {
      console.error('Error performing DLN search:', error);
      throw error;
    }
  }

  static async searchRecords(
    searchCriteria: {
      dln?: string;
      tin?: string;
      nameControl?: string;
    },
    currentUserSeid?: string
  ): Promise<{ success: boolean; message?: string; records?: DLNSearchRecord[] }> {
    try {
      const response = await fetch('/api/v1/era/inventories/inventory-search/dlnSearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': `${currentUserSeid}`
        },
        body: JSON.stringify({
          dln: searchCriteria.dln || '',
          tin: searchCriteria.tin || '',
          nameControl: searchCriteria.nameControl || ''
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `Search failed: ${errorText}`
        };
      }

      const data = await response.json();
      const records = Array.isArray(data) ? data : (data.records || []);
      
      return {
        success: true,
        records: records
      };
    } catch (error) {
      console.error('Error in DLN search:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Search failed. Please try again.'
      };
    }
  }
}
