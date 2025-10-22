"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, User, AlertCircle } from "lucide-react";
import Header from "../../components/Header";
import NotesSection from "../../components/NotesSection";
import { mockUser } from "../../data/mockData";
import { Note } from "../../types";
import fieldMappings from "../../data/fieldConfig4868.json";
import { QRDetailsService, QRDetailsData } from "../../services/qrDetailsService";
import { QRInventoryRecord } from "../../services/qrInventoryService";

// Helper to prettify labels from keys like "primarySSN" -> "Primary SSN"
const toLabel = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());


interface ComparisonFieldProps {
  fieldKey: string;
  label: string;
  beforeValue: string;
  afterValue: string;
  isModified: boolean;
  isEditable: boolean;
}

const ComparisonField: React.FC<ComparisonFieldProps> = ({
  fieldKey,
  label,
  beforeValue,
  afterValue,
  isModified,
  isEditable
}) => {
  const displayBeforeValue = beforeValue || 'Not provided';
  const displayAfterValue = afterValue || 'Not provided';
  
  if (isEditable) {
    // Show before/after comparison for editable fields
    return (
      <div className={`grid grid-cols-2 gap-4 mb-4 p-3 rounded-lg ${
        isModified ? 'bg-orange-50' : 'bg-gray-50'
      }`}>
        <div className="flex-1">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            {label} (Before)
          </label>
          <input
            type="text"
            className={`w-full px-3 py-2 text-sm bg-white border rounded cursor-not-allowed ${
              isModified 
                ? 'border-2 border-red-300 text-gray-600' 
                : 'border-gray-300 text-gray-600'
            } ${!beforeValue ? 'italic' : ''}`}
            value={displayBeforeValue}
            readOnly
          />
        </div>
        <div className="flex-1">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            {label} (After)
          </label>
          <input
            type="text"
            className={`w-full px-3 py-2 text-sm bg-white border rounded cursor-not-allowed ${
              isModified 
                ? 'border-2 border-green-300 text-gray-900 font-medium' 
                : 'border-gray-300 text-gray-900'
            }`}
            value={displayAfterValue}
            readOnly
          />
        </div>
      </div>
    );
  } else {
    // Show before/after comparison for non-editable fields (system information) as well
    return (
      <div className={`grid grid-cols-2 gap-4 mb-4 p-3 rounded-lg ${
        isModified ? 'bg-blue-50' : 'bg-gray-50'
      }`}>
        <div className="flex-1">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            {label} (Before)
          </label>
          <input
            type="text"
            className={`w-full px-3 py-2 text-sm bg-white border rounded cursor-not-allowed ${
              isModified 
                ? 'border-2 border-blue-300 text-gray-600' 
                : 'border-gray-300 text-gray-600'
            } ${!beforeValue ? 'italic' : ''}`}
            value={displayBeforeValue}
            readOnly
          />
        </div>
        <div className="flex-1">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            {label} (After)
          </label>
          <input
            type="text"
            className={`w-full px-3 py-2 text-sm bg-white border rounded cursor-not-allowed ${
              isModified 
                ? 'border-2 border-blue-300 text-gray-900 font-medium' 
                : 'border-gray-300 text-gray-900'
            }`}
            value={displayAfterValue}
            readOnly
          />
        </div>
      </div>
    );
  }
};

export default function QRDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inventoryId = searchParams.get('inventoryId');
  const dln = searchParams.get('dln');
  const serviceCenter = searchParams.get('serviceCenter');
  const seid = searchParams.get('seid');
  
  const [qrData, setQRData] = useState<QRDetailsData | null>(null);
  const [inventoryRecord, setInventoryRecord] = useState<QRInventoryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      content: 'Initial review completed. SSN field requires verification due to EIF/NAP mismatch.',
      timestamp: '2025-08-28 10:30',
      author: 'Agent Smith'
    },
    {
      id: '2',
      content: 'Contacted taxpayer via phone. Confirmed correct SSN is 123-45-6789. Updating system records.',
      timestamp: '2025-08-28 11:15',
      author: 'Agent Johnson'
    },
    {
      id: '3',
      content: 'QR Review: Address format corrected. SSN verification completed. Ready for final approval.',
      timestamp: '2025-08-28 14:45',
      author: 'Supervisor Davis'
    }
  ]);

  // Helper function to get field value from eraDto-like object
  const getFieldValue = (data: any, fieldKey: string): string => {
    if (!data) return '';
    
    // Get the data source (workRecord or root)
    const dataSource = data?.workRecord || data;
    return (dataSource[fieldKey] || '').toString();
  };

  // Helper function to get field label from fieldMappings
  const getFieldLabel = (fieldKey: string): string => {
    const fieldConfig = (fieldMappings as any)[fieldKey];
    return fieldConfig?.label || toLabel(fieldKey);
  };

  // Helper function to check if field is editable
  const isFieldEditable = (fieldKey: string): boolean => {
    const fieldConfig = (fieldMappings as any)[fieldKey];
    return fieldConfig?.editable || false;
  };

  // Load QR details data
  const loadQRDetails = async () => {
    if (!inventoryId) {
      setError('No inventory ID provided');
      setLoading(false);
      return;
    }

    try {
      console.log('Starting loadQRDetails with inventoryId:', inventoryId);
      setLoading(true);
      setError(null);

      const data = await QRDetailsService.getQRDetails(inventoryId, dln || undefined, serviceCenter || undefined, seid || undefined);
      console.log('API response data:', data);
      setQRData(data);
    } catch (err) {
      console.error('Error fetching QR details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load QR details');
      
      // Load mock data as fallback
      console.log('Loading mock data as fallback...');
      const mockData = QRDetailsService.getMockQRDetails(inventoryId, dln || undefined, serviceCenter || undefined, seid || undefined);
      setQRData(mockData);
    } finally {
      setLoading(false);
    }
  };

  // Load inventory record from sessionStorage
  useEffect(() => {
    const storedRecord = sessionStorage.getItem('selectedQRRecord');
    if (storedRecord) {
      try {
        const parsedRecord = JSON.parse(storedRecord);
        setInventoryRecord(parsedRecord);
        console.log('Loaded inventory record from sessionStorage:', parsedRecord);
      } catch (error) {
        console.error('Error parsing stored inventory record:', error);
      }
    }
  }, []);

  useEffect(() => {
    console.log('QR Details useEffect triggered with params:', { inventoryId, dln, serviceCenter, seid });
    loadQRDetails();
  }, [inventoryId, dln, serviceCenter, seid]);


  // Compare before and after values to determine if field is modified
  const isFieldModified = (beforeValue: any, afterValue: any): boolean => {
    return beforeValue !== afterValue;
  };

  // Get comparison fields from fieldMappings
  const getComparisonFields = () => {
    if (!qrData) return [];

    return Object.keys(fieldMappings).map(fieldKey => {
      const beforeValue = getFieldValue(qrData.before, fieldKey);
      const afterValue = getFieldValue(qrData.after, fieldKey);
      const isEditable = isFieldEditable(fieldKey);
      const isModified = isFieldModified(beforeValue, afterValue);

      return {
        fieldKey,
        label: getFieldLabel(fieldKey),
        beforeValue,
        afterValue,
        isModified,
        isEditable
      };
    });
  };

  const handleQRComplete = async () => {
    try {
      // API call to complete QR
      console.log('QR Complete for inventoryId:', inventoryId);
      alert('QR Review completed successfully!');
      router.push('/qrInventory');
    } catch (error) {
      console.error('Error completing QR:', error);
      alert('Error completing QR review');
    }
  };

  const handleRework = async () => {
    try {
      // API call to rework QR
      console.log('Rework QR for inventoryId:', inventoryId);
      alert('QR sent for rework!');
      router.push('/qrInventory');
    } catch (error) {
      console.error('Error reworking QR:', error);
      alert('Error sending QR for rework');
    }
  };

  const handleAddNote = (content: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      content,
      timestamp: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      author: mockUser.name
    };
    setNotes([newNote, ...notes]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={mockUser} />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Loading QR details...</div>
        </div>
      </div>
    );
  }

  if (error && !qrData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={mockUser} />
        <div className="flex items-center justify-center h-96">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  const comparisonFields = getComparisonFields();

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={mockUser} />
      
      <div className="flex flex-col p-4 mx-auto w-full">
        {/* Top Toolbar */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push('/qrInventory')}
                className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 font-medium text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Inventory
              </button>
            </div>
            
            <div className="flex-1 text-left ml-6">
              <div className="flex flex-wrap gap-3">
                <span className="inline-block bg-blue-900 text-white px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                  DLN: {inventoryRecord?.dln || dln}
                </span>
                <span className="inline-block bg-blue-900 text-white px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                  Service Center: {inventoryRecord?.serviceCenter || serviceCenter}
                </span>
                {inventoryRecord && (
                  <>
                    <span className="inline-block bg-green-900 text-white px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                      Status: {inventoryRecord.status}
                    </span>
                    <span className="inline-block bg-purple-900 text-white px-3 py-1 rounded-full text-sm font-medium border border-purple-200">
                      Form Type: {inventoryRecord.formType}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Badges Section */}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form Section (Left 60% / 3 columns) */}
          <div className="lg:col-span-3 bg-white rounded-lg p-6 shadow-sm">
            <div className="mb-6">
              <div className="text-lg font-semibold mb-4 text-gray-700 border-b-2 border-gray-200 pb-2">
                FORM 4868 - Application for Automatic Extension
                <p className="text-sm font-normal mt-2 text-gray-600">
                  Received Date: 2025-09-25 | Tax Period: {qrData?.after?.workRecord?.taxPrd || qrData?.before?.workRecord?.taxPrd || 'N/A'}
                </p>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-6 flex items-center gap-2 text-sm text-gray-700">
                <User className="w-4 h-4 text-gray-500" />
                <span>
                  <strong>Last modified by:</strong> {inventoryRecord?.seid || seid || 'Unknown'} at {inventoryRecord?.updatedDate || qrData?.metadata.lastModifiedDate}
                </span>
              </div>
              
              {/* Editable Fields - Show Before/After Comparison */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-700 mb-4 border-b border-gray-200 pb-2">
                  Editable Fields
                </h4>
                {comparisonFields
                  .filter(field => field.isEditable)
                  .map((field) => (
                    <ComparisonField
                      key={field.fieldKey}
                      fieldKey={field.fieldKey}
                      label={field.label}
                      beforeValue={field.beforeValue}
                      afterValue={field.afterValue}
                      isModified={field.isModified}
                      isEditable={field.isEditable}
                    />
                  ))}
              </div>

              {/* Non-Editable Fields - System Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-700 mb-4 border-b border-gray-200 pb-2">
                  System Information (Before/After Comparison)
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {comparisonFields
                    .filter(field => !field.isEditable)
                    .map((field) => (
                      <ComparisonField
                        key={field.fieldKey}
                        fieldKey={field.fieldKey}
                        label={field.label}
                        beforeValue={field.beforeValue}
                        afterValue={field.afterValue}
                        isModified={field.isModified}
                        isEditable={field.isEditable}
                      />
                    ))}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="border-t-2 border-gray-200 pt-4 mt-6">
              <div className="flex gap-4">
                <button
                  onClick={handleQRComplete}
                  className="bg-blue-600 text-white px-6 py-3 rounded text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  QR Complete
                </button>
                <button
                  onClick={handleRework}
                  className="bg-blue-600 text-white px-6 py-3 rounded text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  Rework
                </button>
              </div>
            </div>
          </div>

          {/* Notes Section (Right 40%) */}
          <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b-2 border-gray-200 pb-2">
              Resolution Notes
            </h3>
            <NotesSection notes={notes} onAddNote={handleAddNote} />
          </div>
        </div>
      </div>

    </div>
  );
}
