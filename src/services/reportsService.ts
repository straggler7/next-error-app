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
  programCode?: string;
}

/**
 * Service for fetching report data from the backend API
 */
export class ReportsService {
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
      const response = await fetch('/api2/v1/era/reports/get-summary-report', {
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
      const response = await fetch('/api2/v1/era/reports/get-summary-report', {
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
}

export default ReportsService;
