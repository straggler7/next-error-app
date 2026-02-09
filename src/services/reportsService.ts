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
  endDateStr?: string;
  status?: string; // Only for 1340 report
  dln?: string;
  serviceCenter?: string;
  serviceCenterEnum?: string; // Service center name in uppercase
  programCode?: string;
  source?: string; // Source filter for 1340 report
  daysInEraStart?: number; // Days in ERA start filter for 1342 and 3141 reports
  daysInEraEnd?: number; // Days in ERA end filter for 1342 and 3141 reports
  seid?: string; // Tax Examiner SEID for 7740 report
  assignmentSeid?: string; // Tax Examiner SEID for 7746 report
  export?: boolean; // For export functionality
}

/**
 * Helper function to get today's date in MM/DD/YYYY format
 */
function getTodayDateString(): string {
  const today = new Date();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  const year = today.getFullYear();
  return `${month}/${day}/${year}`;
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
        const errorData = await response.json();
        console.error("Error loading 0040 report:", errorData);
        throw new Error(errorData.message);
      }      

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
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
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading 1340 report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 1340 report:', error);
      throw error;
    }
  }

  /**
   * Fetch 1340_New report data (identical to 1340 report)
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async get1340NewReport(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      const response = await fetch('/api2/v1/era/reports/get-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify({
          ...payload,
          status: 'NEW' // Always include status for 1340_New (same as 1340)
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading 1340_New report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 1340_New report:', error);
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
      // For 0540 report, use startDateStr as default for endDateStr if not provided
      const enhancedPayload = {
        ...payload,
        endDateStr: payload.endDateStr || payload.startDateStr,
        // status: 'DELETED' // Always include DELETED status for 0540
      };

      const response = await fetch('/api2/v1/era/reports/get-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(enhancedPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading 0540 report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
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
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading 1740 report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
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
      // For 0340 report, endDateStr is required - use startDateStr if not provided
      const enhancedPayload = {
        ...payload,
        programCode: '44730',
        endDateStr: payload.endDateStr || payload.startDateStr,
      };

      const response = await fetch('/api2/v1/era/reports/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(enhancedPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading 0340 report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
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
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading 0341 report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
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
      // For MERDAIL report, endDateStr is required - use startDateStr if not provided
      const enhancedPayload = {
        ...payload,
        programCode: '44720',
        endDateStr: payload.endDateStr || payload.startDateStr,
      };

      const response = await fetch('/api2/v1/era/reports/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(enhancedPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading MERDAIL report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
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
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading MERYRDT report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
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
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading 1341 report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
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
      // For 1342 report, use startDateStr as default for endDateStr if not provided
      const enhancedPayload = {
        ...payload,
        endDateStr: payload.endDateStr || payload.startDateStr,
      };

      const response = await fetch('/api2/v1/era/reports/get-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(enhancedPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading 1342 report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 1342 report:', error);
      throw error;
    }
  }

  /**
   * Fetch 3141 report data
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async get3141Report(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      const response = await fetch('/api2/v1/era/reports/get-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(payload), // No status for 3141
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading 3141 report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 3141 report:', error);
      throw error;
    }
  }

  /**
   * Fetch 1343 report data (suspense summary report)
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async get1343Report(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      const response = await fetch('/api2/v1/era/reports/get-suspense-summary-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading 1343 report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 1343 report:', error);
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
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading 7740 report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
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
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading 7741 report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
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
      // For 7746 report, use startDateStr as default for endDateStr if not provided
      const enhancedPayload = {
        ...payload,
        endDateStr: payload.endDateStr || payload.startDateStr,
      };

      const response = await fetch('/api2/v1/era/reports/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(enhancedPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading 7746 report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
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
      // For 7747 report, use startDateStr as default for endDateStr if not provided
      const enhancedPayload = {
        ...payload,
        endDateStr: payload.endDateStr || payload.startDateStr,
      };

      const response = await fetch('/api2/v1/era/reports/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(enhancedPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading 7747 report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
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
      // For 7742 report, use startDateStr as default for endDateStr if not provided
      const enhancedPayload = {
        ...payload,
        endDateStr: payload.endDateStr || payload.startDateStr,
      };

      const response = await fetch('/api2/v1/era/reports/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(enhancedPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading 7742 report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
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
      // For 7743 report, use startDateStr as default for endDateStr if not provided
      const enhancedPayload = {
        ...payload,
        endDateStr: payload.endDateStr || payload.startDateStr,
      };

      const response = await fetch('/api2/v1/era/reports/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(enhancedPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading 7743 report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 7743 report:', error);
      throw error;
    }
  }

  /**
   * Fetch 7744 report data (program production summary report)
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async get7744Report(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      // For 7744 report, use startDateStr as default for endDateStr if not provided
      const enhancedPayload = {
        ...payload,
        endDateStr: payload.endDateStr || payload.startDateStr,
      };

      const response = await fetch('/api2/v1/era/reports/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(enhancedPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading 7744 report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 7744 report:', error);
      throw error;
    }
  }

  /**
   * Fetch 7745 report data (program production summary report)
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async get7745Report(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      // For 7745 report, use startDateStr as default for endDateStr if not provided
      const enhancedPayload = {
        ...payload,
        endDateStr: payload.endDateStr || payload.startDateStr,
      };

      const response = await fetch('/api2/v1/era/reports/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(enhancedPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading 7745 report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching 7745 report:', error);
      throw error;
    }
  }
  /**
   * Fetch 1747 report data
   * @param seid - Current user's SEID
   * @param dateFilter - Optional date filter in MM/DD/YYYY format
   * @returns Promise<any> - Inventory control data with 4 sections
   */
  static async get1747Report(seid: string, dateFilter?: string): Promise<any> {
    try {
      let startDateStr = dateFilter;
      
      if (!startDateStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const month = (yesterday.getMonth() + 1).toString().padStart(2, '0');
        const day = yesterday.getDate().toString().padStart(2, '0');
        const year = yesterday.getFullYear();
        startDateStr = `${month}/${day}/${year}`;
      }

      const payload = {
        // pageNumber: 1,
        // pageSize: 20,
        reportId: '1747',
        startDateStr,
      };

      const response = await fetch('/api2/v1/era/reports/get-summary-report-1747', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading 1747 report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return {};
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching 1747 report:', error);
      throw error;
    }
  }

  /**
   * Download CSV file from report data
   * @param data - Report data array
   * @param reportType - Type of report for filename
   * @param columns - Column configuration to determine visible columns and labels
   */
  static downloadCSV(data: ReportRecord[], reportType: string, columns?: { key: string; label: string; visible: boolean }[]): void {
    if (data.length === 0) {
      console.warn('No data to export');
      return;
    }
    
    let headers: string;
    let rowData: string[];
    
    if (columns) {
      // Filter to only visible columns
      const visibleColumns = columns.filter(col => col.visible);
      
      if (visibleColumns.length === 0) {
        console.warn('No visible columns to export');
        return;
      }
      
      // Use column labels as headers
      headers = visibleColumns.map(col => col.label).join(',');
      
      // Extract only visible column data
      rowData = data.map(row => 
        visibleColumns.map(col => {
          const value = (row as any)[col.key];
          
          // Handle null/undefined values
          if (value === null || value === undefined) return '';
          
          // Convert to string and escape commas and quotes
          const stringValue = value.toString();
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      );
    } else {
      // Fallback to original behavior if no columns provided
      headers = Object.keys(data[0]).join(',');
      rowData = data.map(row => 
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
      );
    }
    
    // Convert data to CSV format
    const csvContent = [headers, ...rowData].join('\n');
    
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

  /**
   * Fetch Close Out report data
   * @param seid - Current user's SEID
   * @param payload - Report request payload
   * @returns Promise<ReportRecord[]> - Array of report records
   */
  static async getCloseOutReport(seid: string, payload: ReportPayload): Promise<ReportRecord[]> {
    try {
      // For Close Out report, use startDateStr as default for endDateStr if not provided
      const enhancedPayload = {
        ...payload,
        endDateStr: payload.endDateStr || payload.startDateStr,
      };

      const response = await fetch('/api2/v1/era/reports/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
        body: JSON.stringify(enhancedPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error loading Close Out report:", error);
        throw new Error(error.message);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
      }

      const reportData: ReportRecord[] = await response.json();
      return reportData;
    } catch (error) {
      console.error('Error fetching Close Out report:', error);
      throw error;
    }
  }
}

export default ReportsService;
