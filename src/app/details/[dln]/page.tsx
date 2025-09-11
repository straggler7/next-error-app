'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Save } from 'lucide-react';
import Header from '../../../components/Header';
import ErrorSidebar from '../../../components/ErrorSidebar';
import FormSection, { FormField, FormInput, FormSelect, FormTextarea } from '../../../components/FormSection';
import NotesSection from '../../../components/NotesSection';
import { mockUser, mockSubmissions } from '../../../data/mockData';
import { SubmissionRecord, ErrorItem, Note } from '../../../types';

export default function DetailsPage() {
  const params = useParams();
  const dln = params.dln as string;

  // Find the record by DLN
  const record = mockSubmissions.find(r => r.dln === dln);

  // Mock form data state
  const [formData, setFormData] = useState<Partial<SubmissionRecord>>({
    ...record,
    taxpayerName: 'John Smith',
    ssnEin: '123-45-6789',
    address: '123 Main St, Anytown, ST 12345',
    taxYear: 2024,
    filingStatus: 'single',
    extensionType: 'automatic',
    estimatedTaxLiability: 5000,
    taxPaid: 4500,
    balanceDue: 500,
    paymentMethod: 'ach',
    bankAccount: '****1234',
    routingNumber: '021000021',
    receivedDate: '2024-04-15',
    processedDate: '2024-04-16',
    confirmationNumber: 'CNF123456789'
  });
  
  
  if (!record) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header user={mockUser} showBackButton backHref="/" />
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Record Not Found</h1>
          <p className="text-gray-600 mt-2">The requested DLN could not be found.</p>
        </div>
      </div>
    );
  }


  // Mock errors data
  const mockErrors: ErrorItem[] = [
    {
      id: 'err-004',
      code: 'Error Code 004',
      description: 'Invalid taxpayer identification number format',
      status: 'active',
      irm: {
        title: 'IRM 3.12.179 - TIN Validation',
        content: 'Verify the taxpayer identification number format and validate against IRS records.',
        steps: [
          'Check TIN format (XXX-XX-XXXX for SSN, XX-XXXXXXX for EIN)',
          'Validate against master file records',
          'Confirm with taxpayer if discrepancy exists'
        ]
      }
    },
    {
      id: 'err-107',
      code: 'Error Code 107',
      description: 'Missing or invalid filing status',
      status: 'active',
      irm: {
        title: 'IRM 3.12.180 - Filing Status Verification',
        content: 'Ensure the filing status is properly indicated and matches taxpayer circumstances.',
        steps: [
          'Review filing status selection',
          'Verify marital status if applicable',
          'Confirm dependent information for Head of Household'
        ]
      }
    }
  ];

  // Mock notes data
  const mockNotes: Note[] = [
    {
      id: 'note-1',
      timestamp: '2024-08-12 10:30 AM',
      content: 'Initial review completed. TIN format appears incorrect.',
      author: 'Sarah Thompson'
    },
    {
      id: 'note-2',
      timestamp: '2024-08-11 2:15 PM',
      content: 'Received additional documentation from taxpayer.',
      author: 'System'
    }
  ];

  const handleInputChange = (field: keyof SubmissionRecord, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddNote = (content: string) => {
    console.log('Adding note:', content);
    // In a real app, this would make an API call
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={mockUser} showBackButton backHref="/" />
      
      {/* Top Toolbar */}
      <div className="bg-white rounded-xl shadow-sm p-5 mx-4 mt-4 mb-6 border border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="inline-block bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold border border-purple-200">
              Submission ID: {record.id}
            </span>
            <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
              DLN: {record.dln}
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
          <ErrorSidebar errors={mockErrors} />
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">Notes</h3>
            <NotesSection notes={mockNotes} onAddNote={handleAddNote} />
          </div>
        </div>

        {/* Main Form Area */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex flex-col">
          <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Error Resolution Form</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            <form className="space-y-8">
              {/* Taxpayer Information */}
              <FormSection title="Taxpayer Information">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField label="Taxpayer Name" required>
                    <FormInput
                      value={formData.taxpayerName}
                      onChange={(value) => handleInputChange('taxpayerName', value)}
                      placeholder="Enter taxpayer name"
                    />
                  </FormField>
                  <FormField label="SSN/EIN" required>
                    <FormInput
                      value={formData.ssnEin}
                      onChange={(value) => handleInputChange('ssnEin', value)}
                      placeholder="XXX-XX-XXXX"
                    />
                  </FormField>
                  <FormField label="Address" required>
                    <FormInput
                      value={formData.address}
                      onChange={(value) => handleInputChange('address', value)}
                      placeholder="Enter complete address"
                    />
                  </FormField>
                </div>
              </FormSection>

              {/* Filing Information */}
              <FormSection title="Filing Information">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField label="Tax Year">
                    <FormInput
                      type="number"
                      value={formData.taxYear?.toString()}
                      onChange={(value) => handleInputChange('taxYear', parseInt(value) || 0)}
                      placeholder="2024"
                    />
                  </FormField>
                  <FormField label="Filing Status">
                    <FormSelect
                      value={formData.filingStatus}
                      onChange={(value) => handleInputChange('filingStatus', value)}
                    >
                      <option value="">Select status</option>
                      <option value="single">Single</option>
                      <option value="married_joint">Married Filing Jointly</option>
                      <option value="married_separate">Married Filing Separately</option>
                      <option value="head_of_household">Head of Household</option>
                      <option value="qualifying_widow">Qualifying Widow(er)</option>
                    </FormSelect>
                  </FormField>
                  <FormField label="Form Type">
                    <FormInput
                      value={formData.formType}
                      onChange={(value) => handleInputChange('formType', value)}
                      placeholder="Form 1040"
                    />
                  </FormField>
                  <FormField label="DLN">
                    <FormInput
                      value={formData.dln}
                      onChange={(value) => handleInputChange('dln', value)}
                      placeholder="Document Locator Number"
                    />
                  </FormField>
                </div>
              </FormSection>

              {/* Tax Liability and Payment */}
              <FormSection title="Tax Liability and Payment">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField label="Estimated Tax Liability">
                    <FormInput
                      type="number"
                      value={formData.estimatedTaxLiability?.toString()}
                      onChange={(value) => handleInputChange('estimatedTaxLiability', parseFloat(value) || 0)}
                      placeholder="0.00"
                    />
                  </FormField>
                  <FormField label="Tax Paid">
                    <FormInput
                      type="number"
                      value={formData.taxPaid?.toString()}
                      onChange={(value) => handleInputChange('taxPaid', parseFloat(value) || 0)}
                      placeholder="0.00"
                    />
                  </FormField>
                  <FormField label="Payment Method">
                    <FormSelect
                      value={formData.paymentMethod}
                      onChange={(value) => handleInputChange('paymentMethod', value)}
                    >
                      <option value="">Select method</option>
                      <option value="electronic">Electronic</option>
                      <option value="check">Check</option>
                      <option value="money_order">Money Order</option>
                      <option value="credit_card">Credit Card</option>
                    </FormSelect>
                  </FormField>
                </div>
              </FormSection>

              {/* Banking Information */}
              <FormSection title="Banking Information">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField label="Bank Account Number">
                    <FormInput
                      value={formData.bankAccount}
                      onChange={(value) => handleInputChange('bankAccount', value)}
                      placeholder="Account number"
                    />
                  </FormField>
                  <FormField label="Routing Number">
                    <FormInput
                      value={formData.routingNumber}
                      onChange={(value) => handleInputChange('routingNumber', value)}
                      placeholder="9-digit routing number"
                    />
                  </FormField>
                </div>
              </FormSection>

              {/* Processing Status */}
              <FormSection title="Processing Status">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField label="Received Date">
                    <FormInput
                      type="date"
                      value={formData.receivedDate}
                      onChange={(value) => handleInputChange('receivedDate', value)}
                    />
                  </FormField>
                  <FormField label="Processed Date">
                    <FormInput
                      type="date"
                      value={formData.processedDate}
                      onChange={(value) => handleInputChange('processedDate', value)}
                    />
                  </FormField>
                  <FormField label="Status">
                    <FormSelect
                      value={formData.status}
                      onChange={(value) => handleInputChange('status', value)}
                    >
                      <option value="">Select status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </FormSelect>
                  </FormField>
                  <FormField label="Notes">
                    <FormTextarea
                      value={typeof formData.notes === 'string' ? formData.notes : ''}
                      onChange={(value) => handleInputChange('notes', value)}
                      placeholder="Additional notes..."
                      rows={3}
                    />
                  </FormField>
                </div>
              </FormSection>
            </form>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-6">
            <button 
              type="button"
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 hover:bg-blue-700 hover:-translate-y-0.5 shadow-sm"
              onClick={() => console.log('Submit form')}
            >
              Submit
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
