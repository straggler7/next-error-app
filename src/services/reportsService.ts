/**
 * Interface for report record data
 */
export interface ReportRecord {
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
  daysInSuspense?: number; // Optional field for report 1342
  programId?: string; // Program ID field
  source?: string; // Source field
  totalVolume?: number; // Total volume field for report 1341
  daysInErs?: number; // Days in ERS field for report 1341
  totalTimeSpentStr?: string; // Total hours worked for reports 7740/7741
  volumePerHr?: number; // Volume per hour for reports 7740/7741
  resolvedQty?: number; // Resolved quantity for reports 7740/7741
  deletedQty?: number; // Deleted quantity for reports 7740/7741
  suspendedQty?: number; // Suspended quantity for reports 7740/7741
  reWorkedQty?: number; // ReWorked quantity for reports 7740/7741
  rateOfProductionStr?: string; // Rate of production for reports 7740/7741
  totalInventory?: number; // Total inventory for report 0340
  day0Inventory?: number; // Day 0 inventory for report 0340
  day1Inventory?: number; // Day 1 inventory for report 0340
  created?: string; // Created date for report 0340
  taxClass?: string; // Tax class for report 0340
  docCode?: string; // Document code for report 0340
  errorCode?: string; // Error code for report 0340
  priority?: string; // Priority for report 0340
  count?: number; // Count for report 0340
  actionCode?: string; // Action code for report 0540
  _uniqueId?: string; // Generated unique ID for table rows
}

/**
 * Interface for report request payload
 */
export interface ReportPayload {
  pageNumber: number;
  pageSize: number;
  reportId: string;
  startDateStr: string;
  status?: string; // Only for 1340 report
  dln?: string;
  serviceCenter?: string;
  serviceCenterEnum?: string; // Service center name in uppercase
  programCode?: string;
  export?: boolean; // For export functionality
}

/**
 * Service for fetching report data from the backend API
 */
export class ReportsService {
  /**
   * Fetch 0040 report data
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async get0040Report(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      const response = await fetch('/api2/v1/era/reports/get-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify({
          ...payload,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 0040 report:', error);
      throw error;
    }
  }

  /**
   * Fetch 1340 report data
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async get1340Report(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      const response = await fetch('/api2/v1/era/reports/get-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify({
          ...payload,
          status: 'NEW' // Always include status for 1340
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 1340 report:', error);
      throw error;
    }
  }

  /**
   * Fetch 0540 report data (Deleted Records Report)
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async get0540Report(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      const response = await fetch('/api2/v1/era/reports/get-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify({
          ...payload,
          // status: 'DELETED' // Always include DELETED status for 0540
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reportData: ReportRecord[] = await response.json();
      
      // Add default actionCode value of '640' for 0540 report
      const reportDataWithActionCode = reportData.map(record => ({
        ...record,
        actionCode: '640'
      }));
      
      return reportDataWithActionCode;
    } catch (error) {
      console.error('Error fetching 0540 report:', error);
      throw error;
    }
  }

  /**
   * Fetch 1740 report data (Unselected Records Inventory)
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async get1740Report(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      const response = await fetch('/api2/v1/era/reports/get-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify({
          ...payload,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 1740 report:', error);
      throw error;
    }
  }

  /**
   * Fetch 0340 report data (Error Count Report)
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async get0340Report(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      const response = await fetch('/api2/v1/era/reports/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify({
          ...payload,
          programCode: '44730',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 0340 report:', error);
      throw error;
    }
  }

  /**
   * Fetch 0341 report data (Error Count Report)
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async get0341Report(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      const response = await fetch('/api2/v1/era/reports/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify({
          ...payload,
          programCode: '44730',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 0341 report:', error);
      throw error;
    }
  }

  /**
   * Fetch MERDAIL report data (Error Count Report)
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async getMERDAILReport(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      const response = await fetch('/api2/v1/era/reports/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify({
          ...payload,
          programCode: '44720',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching MERDAIL report:', error);
      throw error;
    }
  }

  /**
   * Fetch MERYRDT report data (Error Count Report)
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async getMERYRDTReport(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      const response = await fetch('/api2/v1/era/reports/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify({
          ...payload,
          programCode: '44720',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching MERYRDT report:', error);
      throw error;
    }
  }

  /**
   * Fetch 1341 report data (summary report)
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async get1341Report(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      const response = await fetch('/api2/v1/era/reports/get-summary-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(payload), // No status for 1341
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 1341 report:', error);
      throw error;
    }
  }

  /**
   * Fetch 1342 report data
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async get1342Report(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      const response = await fetch('/api2/v1/era/reports/get-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(payload), // No status for 1342
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 1342 report:', error);
      throw error;
    }
  }

  /**
   * Fetch 7740 report data (summary report)
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async get7740Report(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      // const response = await fetch('/api2/v1/era/reports/get-summary-report', {
      const response = await fetch('/api2/v1/era/reports/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 7740 report:', error);
      throw error;
    }
  }

  /**
   * Fetch 7741 report data (summary report)
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async get7741Report(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      const response = await fetch('/api2/v1/era/reports/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 7741 report:', error);
      throw error;
    }
  }

  /**
   * Fetch 7746 report data (summary report)
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async get7746Report(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      const response = await fetch('/api2/v1/era/reports/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 7746 report:', error);
      throw error;
    }
  }

  /**
   * Fetch 7747 report data (summary report)
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async get7747Report(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      const response = await fetch('/api2/v1/era/reports/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 7747 report:', error);
      throw error;
    }
  }

  /**
   * Fetch 7742 report data (summary report)
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async get7742Report(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      const response = await fetch('/api2/v1/era/reports/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 7742 report:', error);
      throw error;
    }
  }

  /**
   * Fetch 7743 report data (summary report)
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async get7743Report(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      const response = await fetch('/api2/v1/era/reports/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 7743 report:', error);
      throw error;
    }
  }
  /**
   * Fetch 1747 report data (Error Resolution Inventory Control)
   * @param seid - Current user's SEID
   * @returns Promise<any> - Inventory control data with 4 sections
   */
  static async get1747Report(seid: string): Promise<any> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const month = (yesterday.getMonth() + 1).toString().padStart(2, '0');
      const day = yesterday.getDate().toString().padStart(2, '0');
      const year = yesterday.getFullYear();

      const payload = {
        pageNumber: 1,
        pageSize: 20,
        reportId: '1747',
        startDateStr: `${month}/${day}/${year}`,
      };

      const response = await fetch('/api2/v1/era/reports/get-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reportData = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 1747 report:', error);
      throw error;
    }
  }

  /**
   * Download CSV file from report data
   * @param data - Report data array
   * @param reportType - Type of report for filename
   */
  static downloadCSV(data: ReportRecord[], reportType: string): void {
    if (data.length === 0) {
      console.warn('No data to export');
      return;
    }
    
    // Get headers from the first record
    const headers = Object.keys(data[0]).join(',');
    
    // Convert data to CSV format
    const csvContent = [
      headers,
      ...data.map(row => 
        Object.values(row).map(value => {
          // Handle null/undefined values
          if (value === null || value === undefined) return '';
          
          // Convert to string and escape commas and quotes
          const stringValue = value.toString();
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export default ReportsService;
