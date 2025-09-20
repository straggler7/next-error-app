'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import Header from '../../components/Header';
import ErrorSidebar from '../../components/ErrorSidebar';
import FormSection, { FormField, FormInput, FormSelect, FormTextarea } from '../../components/FormSection';
import NotesSection from '../../components/NotesSection';
import { mockUser } from '../../data/mockData';
import { ErrorItem, Note } from '../../types';
import { workAssignmentService, FormElement, GMFError, AssignedWork, WorkRecord, AssignedWorkResponse } from '../../services/workAssignmentService';

export default function Form4868Page() {
  const [assignedWork, setAssignedWork] = useState<AssignedWork | null>(null);
  const [workRecord, setWorkRecord] = useState<WorkRecord | null>(null);
  const [formElements, setFormElements] = useState<FormElement[]>([]);
  const [originalFormElements, setOriginalFormElements] = useState<FormElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flashMessage, setFlashMessage] = useState<string>('');
  const [showFlash, setShowFlash] = useState(false);
  const [noWorkAvailable, setNoWorkAvailable] = useState(false);
  const [noWorkMessage, setNoWorkMessage] = useState<string>('');
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);

  // Convert GMF errors to ErrorItem format for sidebar
  const convertGMFErrorsToErrorItems = (gmfErrors: GMFError[]): ErrorItem[] => {
    // Use the new GMFError structure if available
    if (workRecord?.gmfAugmentedData?.GMFErrors && workRecord.gmfAugmentedData.GMFErrors.length > 0) {
      const newErrors = workRecord.gmfAugmentedData.GMFErrors.filter(error => error.code);
      if (newErrors.length > 0) {
        return newErrors.map((error, index) => ({
          id: `err-${error.code}`,
          code: error.code || 'UNKNOWN',
          type: error.type || 'UNKNOWN',
          description: error.description || 'No description available',
          status: 'active' as const,
          errorFields: error.errorFields || [],
          irm: {
            title: `IRM 3.12.${180 + index} - ${error.type || 'UNKNOWN'} Error Resolution`,
            content: `Resolve the following ${error.type?.toLowerCase() || 'unknown'} error: ${error.description || 'No description available'}`,
            steps: [
              'Review the error description',
              'Correct the identified issue in the highlighted fields',
              'Validate the correction'
            ]
          }
        }));
      }
    }
    
    // Fallback to old format
    return gmfErrors.map((error, index) => ({
      id: `err-${error.Id}`,
      code: `Error Code ${error.Id || 'UNKNOWN'}`,
      description: error.Description || 'No description available',
      status: 'active' as const,
      errorFields: [],
      irm: {
        title: `IRM 3.12.${180 + index} - Error Resolution`,
        content: `Resolve the following error: ${error.Description || 'No description available'}`,
        steps: [
          'Review the error description',
          'Correct the identified issue',
          'Validate the correction'
        ]
      }
    }));
  };

  // Mock notes data - empty as requested
  const mockNotes: Note[] = [];

  useEffect(() => {
    loadAssignedWork();
  }, []);

  const loadAssignedWork = async (showLoadingState = true) => {
    if (showLoadingState) {
      setLoading(true);
    }
    try {
      // Step 1: Get assigned work
      const workResponse = await workAssignmentService.getAssignedWork();
      
      if (!workResponse.hasWork) {
        setNoWorkAvailable(true);
        setNoWorkMessage(workResponse.message || 'No work records available to assign at this time.');
        // Clear existing work data when no work is available
        setAssignedWork(null);
        setWorkRecord(null);
        setFormElements([]);
        return;
      }
      
      console.log('Setting new assigned work:', workResponse.work!.payloadId);
      setAssignedWork(workResponse.work!);
      setNoWorkAvailable(false);
      
      // Step 2: Get work record using payloadId
      const record = await workAssignmentService.getWorkRecord(workResponse.work!.payloadId);
      console.log('Setting new work record and form elements');
      setWorkRecord(record);
      const elements = [...record.gmfAugmentedData.FormElements];
      setFormElements(elements);
      setOriginalFormElements([...elements]);
    } catch (error) {
      console.error('Error loading assigned work:', error);
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (fieldName: string, value: string) => {
    setFormElements(prev => {
      const updated = workAssignmentService.updateFormElementValue(prev, fieldName, value);
      
      // Auto-update name control when any individual name field changes
      if (['first_name', 'last_name', 'spouse_first_name', 'spouse_last_name'].includes(fieldName)) {
        // Create a temporary state to calculate name control with the new value
        const tempElements = [...updated];
        
        // Calculate name control using the updated individual name fields
        const getValueFromTemp = (name: string): string => {
          const element = tempElements.find(el => el.name === name);
          return element?.value || '';
        };
        
        const firstName = getValueFromTemp('first_name');
        const lastName = getValueFromTemp('last_name');
        
        if (lastName) {
          const cleanLastName = lastName.trim().toUpperCase();
          
          // Remove common suffixes
          const suffixes = ['JR', 'SR', 'III', 'IV', 'V', 'II'];
          let nameForControl = cleanLastName;
          
          for (const suffix of suffixes) {
            if (cleanLastName.endsWith(` ${suffix}`)) {
              nameForControl = cleanLastName.replace(` ${suffix}`, '').trim();
              break;
            }
          }
          
          const nameControl = nameForControl.substring(0, Math.min(4, nameForControl.length));
          return workAssignmentService.updateFormElementValue(updated, 'name_control', nameControl);
        } else if (firstName) {
          const cleanFirstName = firstName.trim().toUpperCase();
          const nameControl = cleanFirstName.substring(0, Math.min(4, cleanFirstName.length));
          return workAssignmentService.updateFormElementValue(updated, 'name_control', nameControl);
        }
      }
      
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!assignedWork || !workRecord) return;

    // Clear any highlighted fields on submit
    setHighlightedFields([]);
    
    setSubmitting(true);
    try {
      const result = await workAssignmentService.updateWorkRecord(
        assignedWork.processId, 
        formElements
      );
      
      if (result.success) {
        // Show initial success message
        setFlashMessage('Form submitted successfully');
        setShowFlash(true);
        
        // Fetch new assigned work after successful submission
        try {
          console.log('Before loadAssignedWork - Current assignedWork:', assignedWork?.payloadId);
          await loadAssignedWork(false); // Skip loading state to avoid UI blocking
          console.log('After loadAssignedWork completed');
          setFlashMessage('Form submitted successfully and new record retrieved');
        } catch (fetchError) {
          console.error('Error fetching new assigned work:', fetchError);
          setFlashMessage('Form submitted successfully but failed to fetch new record');
        }
        
        // Hide flash message after 4 seconds (longer to show the full message)
        setTimeout(() => {
          setShowFlash(false);
        }, 4000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setFlashMessage('Error submitting form. Please try again.');
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = (content: string) => {
    console.log('Adding note:', content);
    // In a real app, this would make an API call
  };

  // Helper function to get form element value by name
  const getFormElementValue = (name: string): string => {
    const element = workAssignmentService.getFormElementByName(formElements, name);
    return element?.value || '';
  };

  // Helper function to check if form element is editable
  const isFormElementEditable = (name: string): boolean => {
    const element = workAssignmentService.getFormElementByName(formElements, name);
    return element?.ERSEditable || false;
  };

  // Helper function to generate combined name display
  const generateCombinedName = (): string => {
    const firstName = getFormElementValue('first_name');
    const lastName = getFormElementValue('last_name');
    const spouseFirstName = getFormElementValue('spouse_first_name');
    const spouseLastName = getFormElementValue('spouse_last_name');
    
    let name = '';
    if (firstName && lastName) {
      name = `${firstName} ${lastName}`;
    }
    
    if (spouseFirstName && spouseLastName) {
      if (name) {
        name += ` & ${spouseFirstName} ${spouseLastName}`;
      } else {
        name = `${spouseFirstName} ${spouseLastName}`;
      }
    }
    
    return name;
  };

  // Helper function to generate name control using individual name fields (Form 4868 - individuals only)
  const generateNameControl = (): string => {
    const firstName = getFormElementValue('first_name');
    const lastName = getFormElementValue('last_name');
    const spouseFirstName = getFormElementValue('spouse_first_name');
    const spouseLastName = getFormElementValue('spouse_last_name');
    
    // Primary taxpayer's last name is used for name control
    if (lastName) {
      const cleanLastName = lastName.trim().toUpperCase();
      
      // Remove common suffixes
      const suffixes = ['JR', 'SR', 'III', 'IV', 'V', 'II'];
      let nameForControl = cleanLastName;
      
      for (const suffix of suffixes) {
        if (cleanLastName.endsWith(` ${suffix}`)) {
          nameForControl = cleanLastName.replace(` ${suffix}`, '').trim();
          break;
        }
      }
      
      // Return first 4 characters of last name, no padding if less than 4
      return nameForControl.substring(0, Math.min(4, nameForControl.length));
    }
    
    // Fallback: if no last name, use first name
    if (firstName) {
      const cleanFirstName = firstName.trim().toUpperCase();
      return cleanFirstName.substring(0, Math.min(4, cleanFirstName.length));
    }
    
    return '';
  };

  // Helper function to generate name control from a given name value (for backward compatibility)
  const generateNameControlFromValue = (nameField: string): string => {
    // This function is kept for compatibility but now delegates to the main function
    return generateNameControl();
  };

  // Helper function to get original value
  const getOriginalValue = (name: string): string => {
    const element = workAssignmentService.getFormElementByName(originalFormElements, name);
    return element?.value || '';
  };

  // Helper function to handle error field highlighting
  const handleErrorClick = (errorFields: string[]) => {
    setHighlightedFields(errorFields);
    // Focus on the first field if it exists
    if (errorFields.length > 0) {
      const firstField = document.getElementById(errorFields[0]);
      if (firstField) {
        firstField.focus();
      }
    }
  };

  // Helper function to clear field highlighting
  const clearFieldHighlight = () => {
    setHighlightedFields([]);
  };

  // Helper function to calculate Days Active from control day
  const calculateDaysActive = (controlDay: string): number => {
    if (!controlDay) return 0;
    
    // Control day format: "2025-106" (year-julian day)
    const [yearStr, julianDayStr] = controlDay.split('-');
    const year = parseInt(yearStr);
    const julianDay = parseInt(julianDayStr);
    
    // Create date from julian day
    const controlDate = new Date(year, 0, julianDay); // January 1st + (julianDay - 1)
    const today = new Date();
    
    // Calculate difference in days
    const diffTime = today.getTime() - controlDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  // Helper function to get DLN from submission header
  const getDLN = (): string => {
    return workRecord?.submissionHeader?.DLN || 'N/A';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header user={mockUser} showBackButton backHref="/" />
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading assigned work...</p>
        </div>
      </div>
    );
  }

  if (noWorkAvailable) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header user={mockUser} showBackButton backHref="/" />
        <div className="p-8 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">No Work Records Available</h1>
            <p className="text-gray-600">{noWorkMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!assignedWork || !workRecord) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header user={mockUser} showBackButton backHref="/" />
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800">No Work Assigned</h1>
          <p className="text-gray-600 mt-2">No assigned work available at this time.</p>
        </div>
      </div>
    );
  }

  const errorItems = convertGMFErrorsToErrorItems(workRecord.gmfAugmentedData.GMFErrors);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={mockUser} showBackButton backHref="/" />
      
      {/* Flash Message */}
      {showFlash && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right">
          <CheckCircle className="w-5 h-5" />
          <span>{flashMessage}</span>
        </div>
      )}
      
      {/* Top Toolbar */}
      <div className="bg-white rounded-xl shadow-sm p-5 mx-4 mt-4 mb-6 border border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <span className="info-badge inline-block bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
              DLN: {getDLN()}
            </span>
            <span className="info-badge inline-block bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
              Form Type: {getFormElementValue('form_id')}
            </span>
            <span className="info-badge inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
              Tax Period: {getFormElementValue('tax_year')}
            </span>
            <span className="info-badge inline-block bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm font-medium border border-orange-200">
              Control Day: {assignedWork.controlDay}
            </span>
            <span className="info-badge inline-block bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-medium border border-red-200">
              Days Active: {calculateDaysActive(assignedWork.controlDay)}
            </span>
          </div>
          <button className="inline-flex items-center gap-2 px-6 py-2 bg-[#0f507e] text-white text-sm font-medium rounded-lg transition-all duration-200 hover:bg-[#0f507e] hover:-translate-y-0.5 shadow-sm">
            View RRD Data
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="lg:grid lg:grid-cols-[40%_60%] gap-4 px-4 pb-4 flex flex-col lg:flex-none">
        {/* Left Sidebar */}
        <div className="flex flex-col gap-4">
          <ErrorSidebar errors={errorItems} onErrorSelect={(error) => handleErrorClick(error.errorFields || [])} />
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">Notes</h3>
            <NotesSection notes={mockNotes} onAddNote={handleAddNote} />
          </div>
        </div>

        {/* Main Form Area */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex flex-col" style={{ marginRight: '1rem' }}>
          <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-gray-200" style={{ display: 'none' }}>
            <h2 className="text-xl font-semibold text-gray-800">Form 4868 - Application for Automatic Extension</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            <form className="space-y-8">
              {/* Taxpayer Information */}
              <FormSection title="Form 4868 - Application for Automatic Extension">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                <FormField 
                    label="First Name" 
                    required
                    originalValue={getOriginalValue('first_name')}
                    currentValue={getFormElementValue('first_name')}
                    showChangeIndicator={true}
                    isHighlighted={highlightedFields.includes('first_name')}
                  >
                    <FormInput
                      id="first_name"
                      value={getFormElementValue('first_name')}
                      onChange={(value) => handleInputChange('first_name', value)}
                      onBlur={clearFieldHighlight}
                      placeholder="First Name"
                    />
                  </FormField>

                  <FormField 
                    label="Last Name" 
                    required
                    originalValue={getOriginalValue('last_name')}
                    currentValue={getFormElementValue('last_name')}
                    showChangeIndicator={true}
                    isHighlighted={highlightedFields.includes('last_name')}
                  >
                    <FormInput
                      id="last_name"
                      value={getFormElementValue('last_name')}
                      onChange={(value) => handleInputChange('last_name', value)}
                      onBlur={clearFieldHighlight}
                      placeholder="Last Name"
                    />
                  </FormField>

                  <FormField 
                    label="Spouse First Name" 
                    required
                    originalValue={getOriginalValue('spouse_first_name')}
                    currentValue={getFormElementValue('spouse_first_name')}
                    showChangeIndicator={true}
                    isHighlighted={highlightedFields.includes('spouse_first_name')}
                  >
                    <FormInput
                      id="spouse_first_name"
                      value={getFormElementValue('spouse_first_name')}
                      onChange={(value) => handleInputChange('spouse_first_name', value)}
                      onBlur={clearFieldHighlight}
                      placeholder="Spouse First Name"
                    />
                  </FormField>

                  <FormField 
                    label="Spouse Last Name" 
                    required
                    originalValue={getOriginalValue('spouse_last_name')}
                    currentValue={getFormElementValue('spouse_last_name')}
                    showChangeIndicator={true}
                    isHighlighted={highlightedFields.includes('spouse_last_name')}
                  >
                    <FormInput
                      id="spouse_last_name"
                      value={getFormElementValue('spouse_last_name')}
                      onChange={(value) => handleInputChange('spouse_last_name', value)}
                      onBlur={clearFieldHighlight}
                      placeholder="Spouse Last Name"
                    />
                  </FormField>

                  <FormField 
                    label="Name(s)" 
                    required
                    originalValue={getOriginalValue('name')}
                    currentValue={getFormElementValue('name')}
                    showChangeIndicator={true}
                    isHighlighted={highlightedFields.includes('name') || highlightedFields.includes('first_name') || highlightedFields.includes('last_name') || highlightedFields.includes('spouse_first_name') || highlightedFields.includes('spouse_last_name')}
                  >
                    <FormInput
                      id="combined_name"
                      value={getFormElementValue('name')}
                      onChange={(value) => handleInputChange('name', value)}
                      onBlur={clearFieldHighlight}
                      placeholder="Name(s)"
                    />
                  </FormField>


                  <FormField 
                    label="Name Control"
                    originalValue={getOriginalValue('name_control')}
                    currentValue={getFormElementValue('name_control') || generateNameControl()}
                    showChangeIndicator={true}
                    isHighlighted={highlightedFields.includes('name_control')}
                  >
                    <FormInput
                      id="name_control"
                      value={getFormElementValue('name_control') || generateNameControl()}
                      onChange={(value) => handleInputChange('name_control', value.toUpperCase().substring(0, 4))}
                      onBlur={clearFieldHighlight}
                      placeholder="4-character name control"
                    />
                  </FormField>
                  <FormField 
                    label="SSN" 
                    required
                    originalValue={getOriginalValue('ssn')}
                    currentValue={getFormElementValue('ssn')}
                    showChangeIndicator={true}
                    isHighlighted={highlightedFields.includes('ssn')}
                  >
                    <FormInput
                      id="ssn"
                      value={getFormElementValue('ssn')}
                      onChange={(value) => handleInputChange('ssn', value)}
                      onBlur={clearFieldHighlight}
                      placeholder="XXX-XX-XXXX"
                      error={!isFormElementEditable('ssn')}
                    />
                  </FormField>

                  <FormField 
                    label="Spouse SSN" 
                    required
                    originalValue={getOriginalValue('spouse_ssn')}
                    currentValue={getFormElementValue('spouse_ssn')}
                    showChangeIndicator={true}
                    isHighlighted={highlightedFields.includes('spouse_ssn')}
                  >
                    <FormInput
                      id="spouse_ssn"
                      value={getFormElementValue('spouse_ssn')}
                      onChange={(value) => handleInputChange('spouse_ssn', value)}
                      onBlur={clearFieldHighlight}
                      placeholder="XXX-XX-XXXX"
                      error={!isFormElementEditable('spouse_ssn')}
                    />
                  </FormField>

                  <FormField label="City" required>
                    <FormInput
                      value={getFormElementValue('city')}
                      onChange={(value) => handleInputChange('city', value)}
                      placeholder="Enter city"
                      error={!isFormElementEditable('city')}
                    />
                  </FormField>
                  <FormField label="State" required>
                    <FormInput
                      value={getFormElementValue('state')}
                      onChange={(value) => handleInputChange('state', value)}
                      placeholder="Enter state"
                      error={!isFormElementEditable('state')}
                    />
                  </FormField>
                  <FormField label="ZIP Code" required>
                    <FormInput
                      value={getFormElementValue('zip_code')}
                      onChange={(value) => handleInputChange('zip_code', value)}
                      placeholder="Enter ZIP code"
                      error={!isFormElementEditable('zip_code')}
                    />
                  </FormField>

                  <FormField label="Total Tax Liability" required>
                    <FormInput
                      type="number"
                      step="0.01"
                      value={getFormElementValue('total_tax_liability')}
                      onChange={(value) => handleInputChange('total_tax_liability', value)}
                      placeholder="0.00"
                      error={!isFormElementEditable('total_tax_liability')}
                    />
                  </FormField>
                  <FormField label="Total Payments" required>
                    <FormInput
                      type="number"
                      step="0.01"
                      value={getFormElementValue('total_payments')}
                      onChange={(value) => handleInputChange('total_payments', value)}
                      placeholder="0.00"
                      error={!isFormElementEditable('total_payments')}
                    />
                  </FormField>
                  <FormField label="Balance Due" required>
                    <FormInput
                      type="number"
                      step="0.01"
                      value={getFormElementValue('balance_due')}
                      onChange={(value) => handleInputChange('balance_due', value)}
                      placeholder="0.00"
                      error={!isFormElementEditable('balance_due')}
                    />
                  </FormField>
                  <FormField label="Amount Paid with Extension">
                    <FormInput
                      type="number"
                      step="0.01"
                      value={getFormElementValue('amount_paid_with_extension')}
                      onChange={(value) => handleInputChange('amount_paid_with_extension', value)}
                      placeholder="0.00"
                      error={!isFormElementEditable('amount_paid_with_extension')}
                    />
                  </FormField>

                  <FormField label="Out of Country">
                    <FormSelect
                      value={getFormElementValue('is_out_of_country')}
                      onChange={(value) => handleInputChange('is_out_of_country', value)}
                      error={!isFormElementEditable('is_out_of_country')}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </FormSelect>
                  </FormField>
                </div>
              </FormSection>
              <FormSection title="">
                <div>
                  <FormField label="Action Code" required>
                    <FormInput
                      onChange={(value) => handleInputChange('action_code', value)}
                      placeholder="Enter action code for suspension"
                    />
                  </FormField>
                </div>
              </FormSection>
            </form>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-start gap-4 pt-6 border-t border-gray-200 mt-6">
            <button 
              type="button"
              className="px-6 py-2 bg-[#0f507e] text-white font-medium rounded-lg transition-all duration-200 hover:bg-[#0f507e] hover:-translate-y-0.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <button 
              type="button"
              className="px-6 py-2 bg-[#0f507e] text-white font-medium rounded-lg transition-all duration-200 hover:bg-[#0f507e] hover:-translate-y-0.5 shadow-sm"
              onClick={() => console.log('Suspend form')}
            >
              Suspend
            </button>
            <button 
              type="button"
              className="px-6 py-2 bg-[#0f507e] text-white font-medium rounded-lg transition-all duration-200 hover:bg-[#0f507e] hover:-translate-y-0.5 shadow-sm"
              onClick={() => console.log('Close out form')}
            >
              Close Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
