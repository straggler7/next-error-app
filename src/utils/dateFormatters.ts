/**
 * Utility functions for date formatting
 */

/**
 * Converts an ISO timestamp to mm/dd/yyyy hh:mm:ss format
 * @param isoTimestamp - ISO timestamp string (e.g., "2026-01-20T20:41:50.9235932")
 * @returns Formatted date string in mm/dd/yyyy hh:mm:ss format or original string if parsing fails
 */
export function formatISOTimestamp(isoTimestamp: string | null | undefined): string {
  if (!isoTimestamp) return '';
  
  try {
    const date = new Date(isoTimestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', isoTimestamp);
      return isoTimestamp;
    }
    
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error parsing date:', isoTimestamp, error);
    return isoTimestamp; // Return original if parsing fails
  }
}

/**
 * Converts an ISO timestamp to mm/dd/yyyy format (date only)
 * @param isoTimestamp - ISO timestamp string
 * @returns Formatted date string in mm/dd/yyyy format or original string if parsing fails
 */
export function formatISODate(isoTimestamp: string | null | undefined): string {
  if (!isoTimestamp) return '';
  
  try {
    const date = new Date(isoTimestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', isoTimestamp);
      return isoTimestamp;
    }
    
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch (error) {
    console.error('Error parsing date:', isoTimestamp, error);
    return isoTimestamp; // Return original if parsing fails
  }
}

/**
 * Converts an ISO timestamp to hh:mm:ss format (time only)
 * @param isoTimestamp - ISO timestamp string
 * @returns Formatted time string in hh:mm:ss format or original string if parsing fails
 */
export function formatISOTime(isoTimestamp: string | null | undefined): string {
  if (!isoTimestamp) return '';
  
  try {
    const date = new Date(isoTimestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', isoTimestamp);
      return isoTimestamp;
    }
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error parsing date:', isoTimestamp, error);
    return isoTimestamp; // Return original if parsing fails
  }
}
