// Service for handling assigned work workflow
export interface AssignedWork {
  processId: number;
  gmfUuid: string;
  submissionId: string;
  formType: string;
  controlDay: string;
  taxPeriod: string;
  [key: string]: string | number;
}

export interface FormElement {
  name: string;
  value: string;
  ERSEditable: boolean;
  xpath: string;
}

export interface GMFError {
  Id: string;
  Description: string;
}

export interface GMFAugmentedData {
  FormElements: FormElement[];
  GMFErrors: GMFError[];
}

export interface WorkRecord {
  processId: number;
  gmfAugmentedData: GMFAugmentedData;
  submissionData: any; // Raw submission data
}

class WorkAssignmentService {
  private baseUrl = '/api/work';
  
  // Mock data for getAssignedWork
  private mockAssignedWork: AssignedWork = {
    processId: 1,
    gmfUuid: "12345678-1234-1234-1234-123456789012",
    submissionId: "12345678-1234-1234-1234-123456789012",
    formType: "4868",
    controlDay: "2025-106",
    taxPeriod: "2025"
  };

  // Mock GMF augmented XML data
  private mockGMFData: GMFAugmentedData = {
    FormElements: [
      // Identification Section
      { name: "form_id", value: "4868", ERSEditable: false, xpath: "/Form4868/form_id" },
      { name: "tax_year", value: "2024", ERSEditable: false, xpath: "/Form4868/tax_year" },
      { name: "first_name", value: "John", ERSEditable: true, xpath: "/Form4868/identification/first_name" },
      { name: "last_name", value: "Doe", ERSEditable: true, xpath: "/Form4868/identification/last_name" },
      { name: "ssn", value: "123-45-6789", ERSEditable: true, xpath: "/Form4868/identification/ssn" },
      { name: "street", value: "123 Main Street", ERSEditable: true, xpath: "/Form4868/identification/address/street" },
      { name: "city", value: "Anytown", ERSEditable: true, xpath: "/Form4868/identification/address/city" },
      { name: "state", value: "CA", ERSEditable: true, xpath: "/Form4868/identification/address/state" },
      { name: "zip_code", value: "90210", ERSEditable: true, xpath: "/Form4868/identification/address/zip_code" },
      
      // Income Tax Information
      { name: "total_tax_liability", value: "7500.00", ERSEditable: true, xpath: "/Form4868/income_tax_information/total_tax_liability" },
      { name: "total_payments", value: "6500.00", ERSEditable: true, xpath: "/Form4868/income_tax_information/total_payments" },
      { name: "balance_due", value: "1000.00", ERSEditable: true, xpath: "/Form4868/income_tax_information/balance_due" },
      { name: "amount_paid_with_extension", value: "1000.00", ERSEditable: true, xpath: "/Form4868/income_tax_information/amount_paid_with_extension" },
      
      // Filing Status
      { name: "is_out_of_country", value: "false", ERSEditable: true, xpath: "/Form4868/filing_status/is_out_of_country" }
    ],
    GMFErrors: [
      { Id: "101", Description: "SSN format is invalid" },
      { Id: "102", Description: "Zip code format is invalid" },
      { Id: "103", Description: "State code is invalid" },
      { Id: "104", Description: "Balance due does not match calculated amount" },
      { Id: "105", Description: "Amount paid with extension exceeds balance due" }
    ]
  };

  // Get assigned work - returns processId and other metadata
  async getAssignedWork(): Promise<AssignedWork> {
    // In a real implementation, this would make an HTTP GET request
    // For now, we'll simulate with mock data
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    console.log('Fetching assigned work...');
    return { ...this.mockAssignedWork };
  }

  // Get work record using processId - returns GMF augmented XML data
  async getWorkRecord(processId: number): Promise<WorkRecord> {
    // In a real implementation, this would make an HTTP GET request
    // GET /api/work/getWorkRecord?processId={processId}
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    
    console.log(`Fetching work record for processId: ${processId}`);
    
    return {
      processId,
      gmfAugmentedData: { ...this.mockGMFData },
      submissionData: {} // Additional submission data if needed
    };
  }

  // Parse GMF XML string to structured data (if needed for real XML parsing)
  parseGMFXml(xmlString: string): GMFAugmentedData {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    const formElements: FormElement[] = [];
    const gmfErrors: GMFError[] = [];
    
    // Parse FormElements
    const formElementNodes = xmlDoc.getElementsByTagName('FormElement');
    for (let i = 0; i < formElementNodes.length; i++) {
      const element = formElementNodes[i];
      formElements.push({
        name: element.getAttribute('name') || '',
        value: element.getAttribute('value') || '',
        ERSEditable: element.getAttribute('ERSEditable') === 'true',
        xpath: element.getAttribute('xpath') || ''
      });
    }
    
    // Parse GMFErrors
    const errorNodes = xmlDoc.getElementsByTagName('GMFError');
    for (let i = 0; i < errorNodes.length; i++) {
      const error = errorNodes[i];
      gmfErrors.push({
        Id: error.getAttribute('Id') || '',
        Description: error.getAttribute('Description') || ''
      });
    }
    
    return {
      FormElements: formElements,
      GMFErrors: gmfErrors
    };
  }

  // Convert form data back to XML for submission
  convertFormDataToXml(formElements: FormElement[]): string {
    const xmlParts = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<UITP-Submission xmlns:ns1="http://www.irs.gov/efile" xmlns="GMFModInput.xsd">',
      '  <GMFAugmentedData>',
      '    <FormElements>'
    ];

    // Add form elements
    formElements.forEach(element => {
      xmlParts.push(
        `      <FormElement name="${element.name}" value="${element.value}" ERSEditable="${element.ERSEditable}" xpath="${element.xpath}" />`
      );
    });

    xmlParts.push('    </FormElements>');
    xmlParts.push('  </GMFAugmentedData>');
    xmlParts.push('</UITP-Submission>');

    return xmlParts.join('\n');
  }

  // Update work record - submit form changes
  async updateWorkRecord(processId: number, formElements: FormElement[]): Promise<{ success: boolean; message: string }> {
    // Convert form data to XML
    const xmlData = this.convertFormDataToXml(formElements);
    
    // In a real implementation, this would make an HTTP POST request
    // POST /api/work/updateWorkRecord with { processId, xmlData }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    console.log(`Updating work record for processId: ${processId}`);
    console.log('XML Data:', xmlData);
    
    // Simulate successful submission
    return {
      success: true,
      message: 'Work record updated successfully'
    };
  }

  // Get form elements by section for easier form rendering
  getFormElementsBySection(formElements: FormElement[]) {
    const sections = {
      identification: formElements.filter(el => el.xpath.includes('/identification/')),
      incomeTax: formElements.filter(el => el.xpath.includes('/income_tax_information/')),
      filingStatus: formElements.filter(el => el.xpath.includes('/filing_status/')),
      metadata: formElements.filter(el => !el.xpath.includes('/identification/') && 
                                          !el.xpath.includes('/income_tax_information/') && 
                                          !el.xpath.includes('/filing_status/'))
    };
    
    return sections;
  }

  // Helper to get form element by name
  getFormElementByName(formElements: FormElement[], name: string): FormElement | undefined {
    return formElements.find(el => el.name === name);
  }

  // Helper to update form element value
  updateFormElementValue(formElements: FormElement[], name: string, newValue: string): FormElement[] {
    return formElements.map(el => 
      el.name === name ? { ...el, value: newValue } : el
    );
  }
}

// Export singleton instance
export const workAssignmentService = new WorkAssignmentService();
