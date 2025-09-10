// Service for fetching and parsing Form 4868 error details
export interface Form4868Data {
  formId: string;
  taxYear: number;
  identification: {
    firstName: string;
    lastName: string;
    ssn: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      foreignCountry?: string;
    };
  };
  spouseIdentification?: {
    firstName: string;
    lastName: string;
    ssn: string;
  };
  incomeTaxInformation: {
    totalTaxLiability: number;
    totalPayments: number;
    balanceDue: number;
    amountPaidWithExtension: number;
  };
  filingStatus: {
    isOutOfCountry: boolean;
  };
}

class ErrorDetailsService {
  private baseUrl = '/api/error-details';
  private currentRecordIndex = 0;
  private mockRecords: Form4868Data[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Parse the mock XML data into structured records
    this.mockRecords = [
      {
        formId: '4868',
        taxYear: 2024,
        identification: {
          firstName: 'John',
          lastName: 'Doe',
          ssn: '123-45-6789',
          address: {
            street: '123 Main Street',
            city: 'Anytown',
            state: 'CA',
            zipCode: '90210'
          }
        },
        incomeTaxInformation: {
          totalTaxLiability: 7500.00,
          totalPayments: 6500.00,
          balanceDue: 1000.00,
          amountPaidWithExtension: 1000.00
        },
        filingStatus: {
          isOutOfCountry: false
        }
      },
      {
        formId: '4868',
        taxYear: 2024,
        identification: {
          firstName: 'Jane',
          lastName: 'Smith',
          ssn: '987-65-4321',
          address: {
            street: '456 Oak Avenue',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62704'
          }
        },
        spouseIdentification: {
          firstName: 'Peter',
          lastName: 'Smith',
          ssn: '111-22-3333'
        },
        incomeTaxInformation: {
          totalTaxLiability: 12000.00,
          totalPayments: 12500.00,
          balanceDue: 0.00,
          amountPaidWithExtension: 0.00
        },
        filingStatus: {
          isOutOfCountry: false
        }
      },
      {
        formId: '4868',
        taxYear: 2024,
        identification: {
          firstName: 'Michael',
          lastName: 'Jones',
          ssn: '444-55-6666',
          address: {
            street: '789 International Way',
            city: 'London',
            state: '--',
            zipCode: 'SW1A 0AA',
            foreignCountry: 'United Kingdom'
          }
        },
        incomeTaxInformation: {
          totalTaxLiability: 3000.00,
          totalPayments: 2000.00,
          balanceDue: 1000.00,
          amountPaidWithExtension: 0.00
        },
        filingStatus: {
          isOutOfCountry: true
        }
      }
    ];
  }

  // Parse XML string to Form4868Data object
  parseXmlToForm4868(xmlString: string): Form4868Data {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    const getTextContent = (tagName: string, parent: Element = xmlDoc.documentElement): string => {
      const element = parent.getElementsByTagName(tagName)[0];
      return element?.textContent?.trim() || '';
    };

    const getNumericContent = (tagName: string, parent: Element = xmlDoc.documentElement): number => {
      const content = getTextContent(tagName, parent);
      return parseFloat(content) || 0;
    };

    const getBooleanContent = (tagName: string, parent: Element = xmlDoc.documentElement): boolean => {
      const content = getTextContent(tagName, parent);
      return content.toLowerCase() === 'true';
    };

    const identificationElement = xmlDoc.getElementsByTagName('identification')[0];
    const addressElement = identificationElement?.getElementsByTagName('address')[0];
    const incomeTaxElement = xmlDoc.getElementsByTagName('income_tax_information')[0];
    const filingStatusElement = xmlDoc.getElementsByTagName('filing_status')[0];
    const spouseElement = xmlDoc.getElementsByTagName('spouse_identification')[0];

    const form4868Data: Form4868Data = {
      formId: getTextContent('form_id'),
      taxYear: getNumericContent('tax_year'),
      identification: {
        firstName: getTextContent('first_name', identificationElement),
        lastName: getTextContent('last_name', identificationElement),
        ssn: getTextContent('ssn', identificationElement),
        address: {
          street: getTextContent('street', addressElement),
          city: getTextContent('city', addressElement),
          state: getTextContent('state', addressElement),
          zipCode: getTextContent('zip_code', addressElement),
          ...(getTextContent('foreign_country', addressElement) && {
            foreignCountry: getTextContent('foreign_country', addressElement)
          })
        }
      },
      incomeTaxInformation: {
        totalTaxLiability: getNumericContent('total_tax_liability', incomeTaxElement),
        totalPayments: getNumericContent('total_payments', incomeTaxElement),
        balanceDue: getNumericContent('balance_due', incomeTaxElement),
        amountPaidWithExtension: getNumericContent('amount_paid_with_extension', incomeTaxElement)
      },
      filingStatus: {
        isOutOfCountry: getBooleanContent('is_out_of_country', filingStatusElement)
      }
    };

    // Add spouse information if present
    if (spouseElement) {
      form4868Data.spouseIdentification = {
        firstName: getTextContent('first_name', spouseElement),
        lastName: getTextContent('last_name', spouseElement),
        ssn: getTextContent('ssn', spouseElement)
      };
    }

    return form4868Data;
  }

  // Convert Form4868Data object to XML string
  convertForm4868ToXml(data: Form4868Data): string {
    const xmlParts = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Form4868>',
      `  <form_id>${data.formId}</form_id>`,
      `  <tax_year>${data.taxYear}</tax_year>`,
      '  <identification>',
      `    <first_name>${data.identification.firstName}</first_name>`,
      `    <last_name>${data.identification.lastName}</last_name>`,
      `    <ssn>${data.identification.ssn}</ssn>`,
      '    <address>',
      `      <street>${data.identification.address.street}</street>`,
      `      <city>${data.identification.address.city}</city>`,
      `      <state>${data.identification.address.state}</state>`,
      `      <zip_code>${data.identification.address.zipCode}</zip_code>`,
    ];

    if (data.identification.address.foreignCountry) {
      xmlParts.push(`      <foreign_country>${data.identification.address.foreignCountry}</foreign_country>`);
    }

    xmlParts.push('    </address>');
    xmlParts.push('  </identification>');

    // Add spouse identification if present
    if (data.spouseIdentification) {
      xmlParts.push('  <spouse_identification>');
      xmlParts.push(`    <first_name>${data.spouseIdentification.firstName}</first_name>`);
      xmlParts.push(`    <last_name>${data.spouseIdentification.lastName}</last_name>`);
      xmlParts.push(`    <ssn>${data.spouseIdentification.ssn}</ssn>`);
      xmlParts.push('  </spouse_identification>');
    }

    xmlParts.push('  <income_tax_information>');
    xmlParts.push(`    <total_tax_liability>${data.incomeTaxInformation.totalTaxLiability.toFixed(2)}</total_tax_liability>`);
    xmlParts.push(`    <total_payments>${data.incomeTaxInformation.totalPayments.toFixed(2)}</total_payments>`);
    xmlParts.push(`    <balance_due>${data.incomeTaxInformation.balanceDue.toFixed(2)}</balance_due>`);
    xmlParts.push(`    <amount_paid_with_extension>${data.incomeTaxInformation.amountPaidWithExtension.toFixed(2)}</amount_paid_with_extension>`);
    xmlParts.push('  </income_tax_information>');
    xmlParts.push('  <filing_status>');
    xmlParts.push(`    <is_out_of_country>${data.filingStatus.isOutOfCountry}</is_out_of_country>`);
    xmlParts.push('  </filing_status>');
    xmlParts.push('</Form4868>');

    return xmlParts.join('\n');
  }

  // Fetch the next error details record (mocked)
  async fetchNextErrorDetails(): Promise<Form4868Data> {
    // In a real implementation, this would make an HTTP request
    // For now, we'll simulate with mock data
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    const record = this.mockRecords[this.currentRecordIndex % this.mockRecords.length];
    this.currentRecordIndex++;
    
    return { ...record }; // Return a copy to avoid mutations
  }

  // Submit error details form (mocked)
  async submitErrorDetails(data: Form4868Data): Promise<{ success: boolean; message: string }> {
    // Convert to XML for submission
    const xmlData = this.convertForm4868ToXml(data);
    
    // In a real implementation, this would make an HTTP POST request
    // For now, we'll simulate the submission
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    console.log('Submitting XML data:', xmlData);
    
    // Simulate successful submission
    return {
      success: true,
      message: 'Form submitted successfully and new record retrieved'
    };
  }

  // Get current record index for debugging
  getCurrentRecordIndex(): number {
    return this.currentRecordIndex;
  }

  // Reset to first record
  reset(): void {
    this.currentRecordIndex = 0;
  }
}

// Export singleton instance
export const errorDetailsService = new ErrorDetailsService();
