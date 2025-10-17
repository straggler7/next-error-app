// Service for handling assigned work workflow
export interface AssignedWork {
  processId: number;
  payloadId: number;
  gmfUuid: string;
  submissionId: string;
  formType: string;
  controlDay: string;
  taxPeriod: string;
  [key: string]: string | number;
}

export interface AssignedWorkResponse {
  hasWork: boolean;
  work?: AssignedWork;
  message?: string;
}

export interface FormElement {
  name: string;
  value: string;
  ERSEditable: boolean;
  xpath: string;
  [key: string]: string | number | boolean;
}

export interface GMFError {
  Id?: string;
  Description?: string;
  code?: string;
  type?: string;
  description?: string;
  errorFields?: string[];
}

export interface GMFAugmentedData {
  FormElements: FormElement[];
  GMFErrors: GMFError[];
}

export interface SubmissionHeader {
  GMFUUID: string;
  SubmissionId: string;
  DLN: string;
  FormType: string;
  programCode?: string;
  Source: string;
  Timestamp: string;
}

export interface WorkRecord {
  processId?: number;
  payloadId?: number;
  gmfAugmentedData: GMFAugmentedData;
  submissionHeader?: SubmissionHeader;
  submissionData?: any; // Raw submission data
}

class WorkAssignmentService {
  private baseUrl = '/api/work';
  
  // Mock data for getAssignedWork
  private mockAssignedWork: AssignedWork = {
    processId: 1,
    payloadId: 1,
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
      { 
        code: "01TIN", 
        type: "FIELD", 
        description: "Taxpayer Identification Number",
        errorFields: ["ssn"]
      },
      { 
        code: "01ED", 
        type: "FIELD", 
        description: "Address Validation Error",
        errorFields: ["street", "city", "zip_code"]
      },
      { 
        code: "004", 
        type: "CONSISTENCY", 
        description: "EIF/NAP Mismatch",
        errorFields: ["ssn", "first_name", "last_name"]
      },
      { 
        code: "107", 
        type: "CONSISTENCY", 
        description: "Tax Calculation Error",
        errorFields: ["total_tax_liability", "total_payments", "balance_due"]
      }
    ]
  };

  // Get assigned work - returns processId and other metadata
  async getAssignedWork(): Promise<AssignedWorkResponse> {
    // In a real implementation, this would make an HTTP GET request
    // For now, we'll simulate with mock data
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    try {
      const response = await fetch('/api/work/getAssignedWork');
      
      if (!response.ok) {
        if (response.status === 404 || response.status === 204) {
          return {
            hasWork: false,
            message: "No work records available to assign at this time."
          };
        }
        throw new Error(`Failed to fetch assigned work: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetching assigned work...');
      
      return {
        hasWork: true,
        work: data
      };
    } catch (error) {
      console.error('Error fetching assigned work:', error);
      // Fallback to mock data if API fails
      console.log('Falling back to mock data');
      return {
        hasWork: true,
        work: { ...this.mockAssignedWork }
      };
    }
  }

  // Get work record using processId - returns GMF augmented XML data
  async getJsonWorkRecord(payloadId: number): Promise<any> {
    // In a real implementation, this would make an HTTP GET request
    // GET /api/work/getWorkRecord?processId={processId}

    const response = await fetch(`/api/era/inventory/workrecords/documents/${payloadId}`);
    const data = await response.text();
    
    console.log(`Fetching JSON work record for payloadId: ${payloadId}`);
    
    const jsonData = JSON.parse(data);
    console.log('parsed json data -------------')
    console.log(jsonData);
    return jsonData;
  }


  // Get work record using processId - returns GMF augmented XML data
  async getWorkRecord(payloadId: number): Promise<WorkRecord> {
    // In a real implementation, this would make an HTTP GET request
    // GET /api/work/getWorkRecord?processId={processId}
    // await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

    const response = await fetch(`/api/era/inventory/workrecords/documents/${payloadId}`);
    const data = await response.text();
    
    console.log(`Fetching work record for payloadId: ${payloadId}`);
    
    const parsedData = this.parseGMFXml(data);
    return {
      payloadId,
      gmfAugmentedData: parsedData.gmfAugmentedData,
      submissionHeader: parsedData.submissionHeader,
      submissionData: {} // Additional submission data if needed
    };
  }

  // async getWorkRecord(processId: number): Promise<WorkRecord> {
  //   // In a real implementation, this would make an HTTP GET request
  //   // GET /api/work/getWorkRecord?processId={processId}
  //   await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    
  //   console.log(`Fetching work record for processId: ${processId}`);
    
  //   return {
  //     processId,
  //     gmfAugmentedData: { ...this.mockGMFData },
  //     submissionData: {} // Additional submission data if needed
  //   };
  // }

  // Parse GMF XML string to structured data (if needed for real XML parsing)
  parseGMFXml(xmlString: string): { gmfAugmentedData: GMFAugmentedData; submissionHeader?: SubmissionHeader } {
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
    
    // Parse GMFErrors - handle both old and new formats
    const errorNodes = xmlDoc.getElementsByTagName('GMFError');
    for (let i = 0; i < errorNodes.length; i++) {
      const error = errorNodes[i];
      
      // Check for new format first
      const code = error.getAttribute('code');
      const type = error.getAttribute('type');
      const description = error.getAttribute('description');
      
      if (code && type && description) {
        // New format
        const errorFieldNodes = error.getElementsByTagName('errorField');
        const errorFields: string[] = [];
        for (let j = 0; j < errorFieldNodes.length; j++) {
          errorFields.push(errorFieldNodes[j].textContent || '');
        }
        
        gmfErrors.push({
          code,
          type,
          description,
          errorFields
        });
      } else {
        // Old format fallback
        gmfErrors.push({
          Id: error.getAttribute('Id') || '',
          Description: error.getAttribute('Description') || ''
        });
      }
    }
    
    // Parse SubmissionHeader
    let submissionHeader: SubmissionHeader | undefined;
    const headerNode = xmlDoc.getElementsByTagName('SubmissionHeader')[0];
    if (headerNode) {
      const getTextContent = (tagName: string) => {
        const node = headerNode.getElementsByTagName(tagName)[0];
        return node?.textContent || '';
      };
      
      submissionHeader = {
        GMFUUID: getTextContent('GMFUUID'),
        SubmissionId: getTextContent('SubmissionId'),
        DLN: getTextContent('DLN'),
        FormType: getTextContent('FormType'),
        Source: getTextContent('Source'),
        Timestamp: getTextContent('Timestamp')
      };
    }
    
    return {
      gmfAugmentedData: {
        FormElements: formElements,
        GMFErrors: gmfErrors
      },
      submissionHeader
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
    // await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    const response = await fetch(`/api/work/updateWorkRecord?processId=${processId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml'
      },
      body: xmlData
    });
    
    console.log(`Updating work record for processId: ${processId}`);
    console.log('XML Data:', xmlData);
    
    // Simulate successful submission
    return {
      success: true,
      message: 'Work record updated successfully'
    };
  }

  // Update JSON work record - submit updated jsonWorkRecord with form changes
  async updateJsonWorkRecord(processId: number, formElements: FormElement[], originalJsonWorkRecord: any): Promise<{ success: boolean; message: string }> {
    // Clone the original jsonWorkRecord to avoid mutation
    const updatedJsonWorkRecord = JSON.parse(JSON.stringify(originalJsonWorkRecord));
    
    // Update the workRecord fields with new form values
    if (updatedJsonWorkRecord?.workRecord) {
      formElements.forEach(element => {
        // Update the field value in the workRecord
        if (updatedJsonWorkRecord.workRecord.hasOwnProperty(element.name)) {
          updatedJsonWorkRecord.workRecord[element.name] = element.value;
        }
      });
      
      // Update timestamp to track when the record was modified
      updatedJsonWorkRecord.workRecord.lastModified = new Date().toISOString();
    }
    
    // In a real implementation, this would make an HTTP POST request
    // POST /api/work/updateJsonWorkRecord with the complete updated JSON structure
    // await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    try {
      const response = await fetch(`/api/work/updateJsonWorkRecord?processId=${processId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedJsonWorkRecord)
      });
      
      console.log(`Updating JSON work record for processId: ${processId}`);
      console.log('Updated JSON Work Record:', updatedJsonWorkRecord);
      
      // Simulate successful submission
      return {
        success: true,
        message: 'JSON work record updated successfully'
      };
    } catch (error) {
      console.error('Error updating JSON work record:', error);
      return {
        success: false,
        message: 'Failed to update JSON work record'
      };
    }
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
