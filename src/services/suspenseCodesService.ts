/**
 * Interface for suspense code data
 */
export interface SuspenseCode {
  code: string;
  description: string;
  daysSuspended: number;
}

/**
 * Type for suspense codes response object
 */
export type SuspenseCodesResponse = Record<string, SuspenseCode>;

/**
 * Service for fetching suspense codes from the backend API
 */
export class SuspenseCodesService {
  /**
   * Fetch suspense codes for the current user
   * @param seid - Current user's SEID
   * @returns Promise<SuspenseCodesResponse> - Object containing suspense codes with their details
   */
  static async getSuspenseCodes(seid: string): Promise<SuspenseCodesResponse> {
    try {
      const response = await fetch('/api/v1/era/inventories/suspenseCodes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'SEID': seid,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const suspenseCodes: SuspenseCodesResponse = await response.json();
      return suspenseCodes;
    } catch (error) {
      console.error('Error fetching suspense codes:', error);
      throw error;
    }
  }

  /**
   * Helper method to get just the codes as an array
   * @param seid - Current user's SEID
   * @returns Promise<string[]> - Array of suspense code strings
   */
  static async getSuspenseCodesArray(seid: string): Promise<string[]> {
    const codesResponse = await this.getSuspenseCodes(seid);
    return Object.keys(codesResponse);
  }

  /**
   * Helper method to get codes with descriptions for dropdowns
   * @param seid - Current user's SEID
   * @returns Promise<Array<{code: string, description: string, daysSuspended: number}>> - Array of suspense code objects
   */
  static async getSuspenseCodesWithDetails(seid: string): Promise<SuspenseCode[]> {
    const codesResponse = await this.getSuspenseCodes(seid);
    return Object.values(codesResponse);
  }
}

export default SuspenseCodesService;
