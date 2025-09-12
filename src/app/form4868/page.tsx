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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flashMessage, setFlashMessage] = useState<string>('');
  const [showFlash, setShowFlash] = useState(false);
  const [noWorkAvailable, setNoWorkAvailable] = useState(false);
  const [noWorkMessage, setNoWorkMessage] = useState<string>('');

  // Convert GMF errors to ErrorItem format for sidebar
  const convertGMFErrorsToErrorItems = (gmfErrors: GMFError[]): ErrorItem[] => {
    return gmfErrors.map((error, index) => ({
      id: `err-${error.Id}`,
      code: `Error Code ${error.Id}`,
      description: error.Description,
      status: 'active' as const,
      irm: {
        title: `IRM 3.12.${180 + index} - Error Resolution`,
        content: `Resolve the following error: ${error.Description}`,
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

  const loadAssignedWork = async () => {
    setLoading(true);
    try {
      // Step 1: Get assigned work
      const workResponse = await workAssignmentService.getAssignedWork();
      
      if (!workResponse.hasWork) {
        setNoWorkAvailable(true);
        setNoWorkMessage(workResponse.message || 'No work records available to assign at this time.');
        return;
      }
      
      setAssignedWork(workResponse.work!);
      setNoWorkAvailable(false);
      
      // Step 2: Get work record using payloadId
      const record = await workAssignmentService.getWorkRecord(workResponse.work!.payloadId);
      setWorkRecord(record);
      setFormElements([...record.gmfAugmentedData.FormElements]);
    } catch (error) {
      console.error('Error loading assigned work:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldName: string, value: string) => {
    setFormElements(prev => 
      workAssignmentService.updateFormElementValue(prev, fieldName, value)
    );
  };

  const handleSubmit = async () => {
    if (!assignedWork || !workRecord) return;

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
          // Step 1: Get new assigned work
          const newWorkResponse = await workAssignmentService.getAssignedWork();
          
          if (!newWorkResponse.hasWork) {
            setNoWorkAvailable(true);
            setNoWorkMessage(newWorkResponse.message || 'No more work records available to assign.');
            setFlashMessage('Form submitted successfully - No more work available');
            return;
          }
          
          setAssignedWork(newWorkResponse.work!);
          setNoWorkAvailable(false);
          
          // Step 2: Get work record using new payloadId
          const newRecord = await workAssignmentService.getWorkRecord(newWorkResponse.work!.payloadId);
          setWorkRecord(newRecord);
          setFormElements([...newRecord.gmfAugmentedData.FormElements]);
          
          // Update flash message to indicate new record fetched
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
          <div className="flex items-center gap-4">
            <span className="inline-block bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold border border-purple-200">
              Form: {getFormElementValue('form_id')}
            </span>
            <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
              Tax Year: {getFormElementValue('tax_year')}
            </span>
            <span className="inline-block bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
              Process ID: {assignedWork.processId}
            </span>
            <span className="inline-block bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm font-medium border border-orange-200">
              Control Day: {assignedWork.controlDay}
            </span>
          </div>
          <button className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:bg-blue-700 hover:-translate-y-0.5 shadow-sm">
            View RRD Data
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="lg:grid lg:grid-cols-[40%_60%] gap-4 px-4 pb-4 flex flex-col lg:flex-none">
        {/* Left Sidebar */}
        <div className="flex flex-col gap-4 lg:h-[calc(100vh-200px)]">
          <ErrorSidebar errors={errorItems} />
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">Notes</h3>
            <NotesSection notes={mockNotes} onAddNote={handleAddNote} />
          </div>
        </div>

        {/* Main Form Area */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex flex-col">
          <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Form 4868 - Application for Automatic Extension</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            <form className="space-y-8">
              {/* Taxpayer Information */}
              <FormSection title="Taxpayer Information">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField label="First Name" required>
                    <FormInput
                      value={getFormElementValue('first_name')}
                      onChange={(value) => handleInputChange('first_name', value)}
                      placeholder="Enter first name"
                      error={!isFormElementEditable('first_name')}
                    />
                  </FormField>
                  <FormField label="Last Name" required>
                    <FormInput
                      value={getFormElementValue('last_name')}
                      onChange={(value) => handleInputChange('last_name', value)}
                      placeholder="Enter last name"
                      error={!isFormElementEditable('last_name')}
                    />
                  </FormField>
                  <FormField label="SSN" required>
                    <FormInput
                      value={getFormElementValue('ssn')}
                      onChange={(value) => handleInputChange('ssn', value)}
                      placeholder="XXX-XX-XXXX"
                      error={!isFormElementEditable('ssn')}
                    />
                  </FormField>
                  <FormField label="Tax Year" required>
                    <FormInput
                      type="number"
                      value={getFormElementValue('tax_year')}
                      onChange={(value) => handleInputChange('tax_year', value)}
                      placeholder="2024"
                      error={!isFormElementEditable('tax_year')}
                    />
                  </FormField>
                </div>
              </FormSection>

              {/* Address Information */}
              <FormSection title="Address Information">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField label="Street Address" required>
                    <FormInput
                      value={getFormElementValue('street')}
                      onChange={(value) => handleInputChange('street', value)}
                      placeholder="Enter street address"
                      error={!isFormElementEditable('street')}
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
                </div>
              </FormSection>

              {/* Tax Information */}
              <FormSection title="Tax Information">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                </div>
              </FormSection>

              {/* Filing Status */}
              <FormSection title="Filing Status">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            </form>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-6">
            <button 
              type="button"
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 hover:bg-blue-700 hover:-translate-y-0.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <button 
              type="button"
              className="px-6 py-2 bg-yellow-600 text-white font-medium rounded-lg transition-all duration-200 hover:bg-yellow-700 hover:-translate-y-0.5 shadow-sm"
              onClick={() => console.log('Suspend form')}
            >
              Suspend
            </button>
            <button 
              type="button"
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg transition-all duration-200 hover:bg-green-700 hover:-translate-y-0.5 shadow-sm"
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
