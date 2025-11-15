/**
 * Service for fetching suspense codes from the backend API
 */
export class SuspenseCodesService {
  /**
   * Fetch suspense codes for the current user
   * @param seid - Current user's SEID
   * @returns Promise<string[]> - Array of suspense code strings
   */
  static async getSuspenseCodes(seid: string): Promise<string[]> {
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

      const suspenseCodes: string[] = await response.json();
      return suspenseCodes;
    } catch (error) {
      console.error('Error fetching suspense codes:', error);
      throw error;
    }
  }
}

export default SuspenseCodesService;
