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
  id: string;
  name: string;
  label: string;
  value: string;
  type: string;
  editable: boolean;
  hasFieldError: boolean;
  ref?: string;
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

  // Mock GMF augmented data
  private mockGMFData: GMFAugmentedData = {
    FormElements: [
      // Identification Section
      { id: "form_id", name: "form_id", label: "Form ID", value: "4868", type: "text", editable: false, hasFieldError: false },
      { id: "tax_year", name: "tax_year", label: "Tax Year", value: "2024", type: "text", editable: false, hasFieldError: false },
      { id: "first_name", name: "first_name", label: "First Name", value: "John", type: "text", editable: true, hasFieldError: false },
      { id: "last_name", name: "last_name", label: "Last Name", value: "Doe", type: "text", editable: true, hasFieldError: false },
      { id: "ssn", name: "ssn", label: "SSN", value: "123-45-6789", type: "text", editable: true, hasFieldError: false },
      { id: "street", name: "street", label: "Street", value: "123 Main Street", type: "text", editable: true, hasFieldError: false },
      { id: "city", name: "city", label: "City", value: "Anytown", type: "text", editable: true, hasFieldError: false },
      { id: "state", name: "state", label: "State", value: "CA", type: "text", editable: true, hasFieldError: false },
      { id: "zip_code", name: "zip_code", label: "Zip Code", value: "90210", type: "text", editable: true, hasFieldError: false },
      
      // Income Tax Information
      { id: "total_tax_liability", name: "total_tax_liability", label: "Total Tax Liability", value: "7500.00", type: "text", editable: true, hasFieldError: false },
      { id: "total_payments", name: "total_payments", label: "Total Payments", value: "6500.00", type: "text", editable: true, hasFieldError: false },
      { id: "balance_due", name: "balance_due", label: "Balance Due", value: "1000.00", type: "text", editable: true, hasFieldError: false },
      { id: "amount_paid_with_extension", name: "amount_paid_with_extension", label: "Amount Paid with Extension", value: "1000.00", type: "text", editable: true, hasFieldError: false },
      
      // Filing Status
      { id: "is_out_of_country", name: "is_out_of_country", label: "Out of Country", value: "false", type: "text", editable: true, hasFieldError: false }
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
        id: element.getAttribute('id') || element.getAttribute('name') || '',
        name: element.getAttribute('name') || '',
        label: element.getAttribute('label') || '',
        value: element.getAttribute('value') || '',
        type: element.getAttribute('type') || 'text',
        editable: element.getAttribute('editable') === 'true',
        hasFieldError: element.getAttribute('hasFieldError') === 'true',
        ref: element.getAttribute('ref') || ''
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
        `      <FormElement id="${element.id}" name="${element.name}" label="${element.label}" value="${element.value}" editable="${element.editable}" hasFieldError="${element.hasFieldError}" />`
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
    // Group elements by common naming patterns instead of xpath
    const identificationFields = ['first_name', 'last_name', 'ssn', 'street', 'city', 'state', 'zip_code'];
    const incomeTaxFields = ['total_tax_liability', 'total_payments', 'balance_due', 'amount_paid_with_extension'];
    const filingStatusFields = ['is_out_of_country'];
    
    const sections = {
      identification: formElements.filter(el => identificationFields.includes(el.name)),
      incomeTax: formElements.filter(el => incomeTaxFields.includes(el.name)),
      filingStatus: formElements.filter(el => filingStatusFields.includes(el.name)),
      metadata: formElements.filter(el => !identificationFields.includes(el.name) && 
                                          !incomeTaxFields.includes(el.name) && 
                                          !filingStatusFields.includes(el.name))
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
