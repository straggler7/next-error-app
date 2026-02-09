export interface QRDetailsData {
  NEW: any; // eraDto-like object
  QR_HOLD: any;  // eraDto-like object
  metadata: {
    dln: string;
    serviceCenter: string;
    taxPeriod: string;
    submissionAge: number;
    lastModifiedBy: string;
    lastModifiedDate: string;
    errors: string[];
  };
}

export class QRDetailsService {
  static async getQRDetails(inventoryId: string, dln?: string, serviceCenter?: string, seid?: string): Promise<QRDetailsData> {
    try {
    //   const response = await fetch(`/api/v1/era/qrdetails/${inventoryId}`, {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
        // 'inventoryId': `${inventoryId}`
      };
      
      // if (dln) headers['dln'] = dln;
      // if (serviceCenter) headers['serviceCenter'] = serviceCenter;
      if (seid) headers['seid'] = seid;

      // console.log('QRDetailsService#getQRDetails headers:', headers);
      
      // const response = await fetch(`/api/v1/era/qr-details.json`, {
      const response = await fetch(`/api/v1/era/qualityreview/${inventoryId}/review`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 422) {
          // Handle 422 - User already has assignment or similar conflict
          const errorText = await response.text();
          let errorMessage = 'Unprocessable Entity';
          
          try {
            const error = JSON.parse(errorText);
            errorMessage = error.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          
          // Create a specific error for 422 that can be caught and handled by the UI
          const error422 = new Error(errorMessage);
          (error422 as any).status = 422;
          throw error422;
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching QR details:', error);
      
      // Re-throw 422 errors with their specific message intact
      if (error && typeof error === 'object' && (error as any).status === 422) {
        throw error;
      }
      
      throw new Error('Failed to fetch QR details');
    }
  }
}
