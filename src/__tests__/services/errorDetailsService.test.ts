import { errorDetailsService, Form4868Data } from '@/services/errorDetailsService';

describe('ErrorDetailsService', () => {
  beforeEach(() => {
    // Reset the service to initial state before each test
    errorDetailsService.reset();
  });

  const mockForm4868Data: Form4868Data = {
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
  };

  const mockForm4868DataWithSpouse: Form4868Data = {
    ...mockForm4868Data,
    spouseIdentification: {
      firstName: 'Jane',
      lastName: 'Doe',
      ssn: '987-65-4321'
    }
  };

  const mockForm4868DataForeign: Form4868Data = {
    ...mockForm4868Data,
    identification: {
      ...mockForm4868Data.identification,
      address: {
        street: '789 International Way',
        city: 'London',
        state: '--',
        zipCode: 'SW1A 0AA',
        foreignCountry: 'United Kingdom'
      }
    },
    filingStatus: {
      isOutOfCountry: true
    }
  };

  describe('fetchNextErrorDetails', () => {
    it('should fetch the first mock record', async () => {
      const result = await errorDetailsService.fetchNextErrorDetails();

      expect(result).toEqual({
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
      });
    });

    it('should fetch the second mock record', async () => {
      // Skip first record
      await errorDetailsService.fetchNextErrorDetails();
      
      const result = await errorDetailsService.fetchNextErrorDetails();

      expect(result).toEqual({
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
      });
    });

    it('should cycle back to first record after reaching the end', async () => {
      // Fetch all 3 records
      await errorDetailsService.fetchNextErrorDetails();
      await errorDetailsService.fetchNextErrorDetails();
      await errorDetailsService.fetchNextErrorDetails();
      
      // Should cycle back to first record
      const result = await errorDetailsService.fetchNextErrorDetails();

      expect(result.identification.firstName).toBe('John');
      expect(result.identification.lastName).toBe('Doe');
    });

    it('should return a copy of the data to avoid mutations', async () => {
      const result1 = await errorDetailsService.fetchNextErrorDetails();
      const result2 = await errorDetailsService.fetchNextErrorDetails();

      // Modify the first result
      result1.identification.firstName = 'Modified';

      // Reset and fetch first record again
      errorDetailsService.reset();
      const result3 = await errorDetailsService.fetchNextErrorDetails();

      expect(result3.identification.firstName).toBe('John');
      expect(result3).not.toBe(result1); // Different object references
    });

    it('should simulate network delay', async () => {
      const startTime = Date.now();
      await errorDetailsService.fetchNextErrorDetails();
      const endTime = Date.now();

      // Should take at least 500ms due to simulated delay
      expect(endTime - startTime).toBeGreaterThanOrEqual(500);
    });
  });

  describe('submitErrorDetails', () => {
    it('should successfully submit form data', async () => {
      const result = await errorDetailsService.submitErrorDetails(mockForm4868Data);

      expect(result).toEqual({
        success: true,
        message: 'Form submitted successfully and new record retrieved'
      });
    });

    it('should simulate network delay during submission', async () => {
      const startTime = Date.now();
      await errorDetailsService.submitErrorDetails(mockForm4868Data);
      const endTime = Date.now();

      // Should take at least 1000ms due to simulated delay
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
    });

    it('should log XML data during submission', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await errorDetailsService.submitErrorDetails(mockForm4868Data);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Submitting XML data:',
        expect.stringContaining('<?xml version="1.0" encoding="UTF-8"?>')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('parseXmlToForm4868', () => {
    const basicXml = `<?xml version="1.0" encoding="UTF-8"?>
<Form4868>
  <form_id>4868</form_id>
  <tax_year>2024</tax_year>
  <identification>
    <first_name>John</first_name>
    <last_name>Doe</last_name>
    <ssn>123-45-6789</ssn>
    <address>
      <street>123 Main Street</street>
      <city>Anytown</city>
      <state>CA</state>
      <zip_code>90210</zip_code>
    </address>
  </identification>
  <income_tax_information>
    <total_tax_liability>7500.00</total_tax_liability>
    <total_payments>6500.00</total_payments>
    <balance_due>1000.00</balance_due>
    <amount_paid_with_extension>1000.00</amount_paid_with_extension>
  </income_tax_information>
  <filing_status>
    <is_out_of_country>false</is_out_of_country>
  </filing_status>
</Form4868>`;

    const xmlWithSpouse = `<?xml version="1.0" encoding="UTF-8"?>
<Form4868>
  <form_id>4868</form_id>
  <tax_year>2024</tax_year>
  <identification>
    <first_name>John</first_name>
    <last_name>Doe</last_name>
    <ssn>123-45-6789</ssn>
    <address>
      <street>123 Main Street</street>
      <city>Anytown</city>
      <state>CA</state>
      <zip_code>90210</zip_code>
    </address>
  </identification>
  <spouse_identification>
    <first_name>Jane</first_name>
    <last_name>Doe</last_name>
    <ssn>987-65-4321</ssn>
  </spouse_identification>
  <income_tax_information>
    <total_tax_liability>7500.00</total_tax_liability>
    <total_payments>6500.00</total_payments>
    <balance_due>1000.00</balance_due>
    <amount_paid_with_extension>1000.00</amount_paid_with_extension>
  </income_tax_information>
  <filing_status>
    <is_out_of_country>false</is_out_of_country>
  </filing_status>
</Form4868>`;

    const xmlWithForeignAddress = `<?xml version="1.0" encoding="UTF-8"?>
<Form4868>
  <form_id>4868</form_id>
  <tax_year>2024</tax_year>
  <identification>
    <first_name>Michael</first_name>
    <last_name>Jones</last_name>
    <ssn>444-55-6666</ssn>
    <address>
      <street>789 International Way</street>
      <city>London</city>
      <state>--</state>
      <zip_code>SW1A 0AA</zip_code>
      <foreign_country>United Kingdom</foreign_country>
    </address>
  </identification>
  <income_tax_information>
    <total_tax_liability>3000.00</total_tax_liability>
    <total_payments>2000.00</total_payments>
    <balance_due>1000.00</balance_due>
    <amount_paid_with_extension>0.00</amount_paid_with_extension>
  </income_tax_information>
  <filing_status>
    <is_out_of_country>true</is_out_of_country>
  </filing_status>
</Form4868>`;

    it('should parse basic XML to Form4868Data', () => {
      const result = errorDetailsService.parseXmlToForm4868(basicXml);

      expect(result).toEqual(mockForm4868Data);
    });

    it('should parse XML with spouse information', () => {
      const result = errorDetailsService.parseXmlToForm4868(xmlWithSpouse);

      expect(result).toEqual(mockForm4868DataWithSpouse);
    });

    it('should parse XML with foreign address', () => {
      const result = errorDetailsService.parseXmlToForm4868(xmlWithForeignAddress);

      expect(result.identification.address.foreignCountry).toBe('United Kingdom');
      expect(result.filingStatus.isOutOfCountry).toBe(true);
    });

    it('should handle missing elements gracefully', () => {
      const minimalXml = `<?xml version="1.0" encoding="UTF-8"?>
<Form4868>
  <form_id>4868</form_id>
  <tax_year>2024</tax_year>
  <identification>
    <first_name>John</first_name>
    <last_name>Doe</last_name>
    <ssn>123-45-6789</ssn>
    <address>
      <street>123 Main Street</street>
      <city>Anytown</city>
      <state>CA</state>
      <zip_code>90210</zip_code>
    </address>
  </identification>
  <income_tax_information>
    <total_tax_liability>7500.00</total_tax_liability>
    <total_payments>6500.00</total_payments>
    <balance_due>1000.00</balance_due>
    <amount_paid_with_extension>1000.00</amount_paid_with_extension>
  </income_tax_information>
  <filing_status>
    <is_out_of_country>false</is_out_of_country>
  </filing_status>
</Form4868>`;

      const result = errorDetailsService.parseXmlToForm4868(minimalXml);

      expect(result.spouseIdentification).toBeUndefined();
      expect(result.identification.address.foreignCountry).toBeUndefined();
    });

    it('should handle invalid numeric values', () => {
      const xmlWithInvalidNumbers = basicXml.replace('7500.00', 'invalid');

      const result = errorDetailsService.parseXmlToForm4868(xmlWithInvalidNumbers);

      expect(result.incomeTaxInformation.totalTaxLiability).toBe(0);
    });

    it('should handle boolean values correctly', () => {
      const xmlWithTrueBoolean = basicXml.replace('false', 'true');

      const result = errorDetailsService.parseXmlToForm4868(xmlWithTrueBoolean);

      expect(result.filingStatus.isOutOfCountry).toBe(true);
    });
  });

  describe('convertForm4868ToXml', () => {
    it('should convert basic Form4868Data to XML', () => {
      const result = errorDetailsService.convertForm4868ToXml(mockForm4868Data);

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<Form4868>');
      expect(result).toContain('<form_id>4868</form_id>');
      expect(result).toContain('<tax_year>2024</tax_year>');
      expect(result).toContain('<first_name>John</first_name>');
      expect(result).toContain('<last_name>Doe</last_name>');
      expect(result).toContain('<ssn>123-45-6789</ssn>');
      expect(result).toContain('<total_tax_liability>7500.00</total_tax_liability>');
      expect(result).toContain('<is_out_of_country>false</is_out_of_country>');
      expect(result).toContain('</Form4868>');
    });

    it('should include spouse information when present', () => {
      const result = errorDetailsService.convertForm4868ToXml(mockForm4868DataWithSpouse);

      expect(result).toContain('<spouse_identification>');
      expect(result).toContain('<first_name>Jane</first_name>');
      expect(result).toContain('<last_name>Doe</last_name>');
      expect(result).toContain('<ssn>987-65-4321</ssn>');
      expect(result).toContain('</spouse_identification>');
    });

    it('should include foreign country when present', () => {
      const result = errorDetailsService.convertForm4868ToXml(mockForm4868DataForeign);

      expect(result).toContain('<foreign_country>United Kingdom</foreign_country>');
    });

    it('should format numeric values with 2 decimal places', () => {
      const dataWithWholeNumbers = {
        ...mockForm4868Data,
        incomeTaxInformation: {
          totalTaxLiability: 7500,
          totalPayments: 6500,
          balanceDue: 1000,
          amountPaidWithExtension: 1000
        }
      };

      const result = errorDetailsService.convertForm4868ToXml(dataWithWholeNumbers);

      expect(result).toContain('<total_tax_liability>7500.00</total_tax_liability>');
      expect(result).toContain('<total_payments>6500.00</total_payments>');
      expect(result).toContain('<balance_due>1000.00</balance_due>');
      expect(result).toContain('<amount_paid_with_extension>1000.00</amount_paid_with_extension>');
    });
  });

  describe('XML round-trip conversion', () => {
    it('should maintain data integrity through parse and convert cycle', () => {
      const originalData = mockForm4868Data;
      const xml = errorDetailsService.convertForm4868ToXml(originalData);
      const parsedData = errorDetailsService.parseXmlToForm4868(xml);

      expect(parsedData).toEqual(originalData);
    });

    it('should maintain data integrity with spouse information', () => {
      const originalData = mockForm4868DataWithSpouse;
      const xml = errorDetailsService.convertForm4868ToXml(originalData);
      const parsedData = errorDetailsService.parseXmlToForm4868(xml);

      expect(parsedData).toEqual(originalData);
    });

    it('should maintain data integrity with foreign address', () => {
      const originalData = mockForm4868DataForeign;
      const xml = errorDetailsService.convertForm4868ToXml(originalData);
      const parsedData = errorDetailsService.parseXmlToForm4868(xml);

      expect(parsedData).toEqual(originalData);
    });
  });

  describe('utility methods', () => {
    it('should return current record index', () => {
      expect(errorDetailsService.getCurrentRecordIndex()).toBe(0);
    });

    it('should increment record index after fetching', async () => {
      await errorDetailsService.fetchNextErrorDetails();
      expect(errorDetailsService.getCurrentRecordIndex()).toBe(1);

      await errorDetailsService.fetchNextErrorDetails();
      expect(errorDetailsService.getCurrentRecordIndex()).toBe(2);
    });

    it('should reset record index to 0', async () => {
      await errorDetailsService.fetchNextErrorDetails();
      await errorDetailsService.fetchNextErrorDetails();
      
      expect(errorDetailsService.getCurrentRecordIndex()).toBe(2);
      
      errorDetailsService.reset();
      expect(errorDetailsService.getCurrentRecordIndex()).toBe(0);
    });
  });
});
