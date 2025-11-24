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

      console.log('QRDetailsService#getQRDetails headers:', headers);
      
      // const response = await fetch(`/api/v1/era/qr-details.json`, {
      const response = await fetch(`/api/v1/era/qualityreview/${inventoryId}/review`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching QR details:', error);
      throw new Error('Failed to fetch QR details');
    }
  }

  // Mock data for development/fallback
  static getMockQRDetails(inventoryId: string, dln?: string, serviceCenter?: string, seid?: string): QRDetailsData {
    return {
      NEW: {
        workRecord: {
          primaryNameControlTxt: "JOHN",
          nameLine1Txt: "Johnson, Michael R",
          primarySSN: "",
          TaxPeriodEndDt: "2025-12-31",
          transDt: "2025-01-15",
          napEifTaxPrdUndrprt: "N",
          napAccessInd: "Y",
          masterFileSystemIdCode: "MF01",
          transCd: "405",
          secondaryTransCd: "405",
          tertiaryTransCd: "409"
        }
      },
      QR_HOLD: {
        workRecord: {
          primaryNameControlTxt: "JOHN",
          nameLine1Txt: "Johnson, Michael R",
          primarySSN: "123-45-6789",
          TaxPeriodEndDt: "2025-12-31",
          transDt: "2025-01-16",
          napEifTaxPrdUndrprt: "Y",
          napAccessInd: "Y",
          masterFileSystemIdCode: "MF01",
          transCd: "405",
          secondaryTransCd: "405",
          tertiaryTransCd: "409"
        }
      },
      metadata: {
        dln: dln || `00217-102-05701-${inventoryId}`,
        serviceCenter: serviceCenter || "Austin",
        taxPeriod: "2025",
        submissionAge: 2,
        lastModifiedBy: seid ? `${seid} (Sarah Thompson)` : "1ABCD (Sarah Thompson)",
        lastModifiedDate: "2025-01-03 14:30:15",
        errors: ["01ED - Extended Due Date", "01TIN - Missing TIN"]
      }
    };
  }
}
