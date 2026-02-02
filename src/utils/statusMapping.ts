export const STATUS_DISPLAY_MAP: Record<string, string> = {
  NEW: 'NEW',
  ASSIGNED: 'ASSIGNED',
  RESOLVED: 'RESOLVED',
  QR_HOLD: 'QR HOLD',
  QR_REVIEW: 'QR REVIEW',
  QR_APPROVED: 'QR APPROVED',
  SUSPEND: 'SUSPEND',
  SUSPEND_HOLD: 'SUSPEND HOLD',
  SUSPEND_REVIEW: 'SUSPEND REVIEW',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
  WORKABLE_SUSPENSE: 'WORKABLE SUSPENSE',
  TRANSACTION_GENERATED: 'POSTED',
};

/**
 * Get human-readable status display string
 * @param status - The status code from the API
 * @returns Human-readable status string. If status is not in the map, returns the status itself.
 */
export function getStatusDisplay(status: string | undefined | null): string {
  if (!status) return '';
  return STATUS_DISPLAY_MAP[status] || status;
}
