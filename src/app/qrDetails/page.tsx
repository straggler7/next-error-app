"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, User, AlertCircle } from "lucide-react";
import Header from "../../components/Header";
import Breadcrumbs, { createBreadcrumbs } from "../../components/Breadcrumbs";
import fieldMappings from "../../data/fieldConfig4868.json";
import { QRDetailsService, QRDetailsData } from "../../services/qrDetailsService";
import { QRInventoryRecord } from "../../services/qrInventoryService";
import { useSeid } from "@/hooks/useSeid";

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
}

const ComparisonField: React.FC<ComparisonFieldProps> = ({
  fieldKey,
  label,
  beforeValue,
  afterValue,
  isModified
}) => {
  const displayBeforeValue = beforeValue || 'Not provided';
  const displayAfterValue = afterValue || 'Not provided';
  
  // Simple before/after comparison without editable or error logic
  return (
    <div className={`grid grid-cols-2 gap-2 mb-2 p-2 rounded-lg ${
      isModified ? 'bg-blue-50' : 'bg-gray-50'
    }`}>
      <div className="flex-1">
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          {label} (Before)
        </label>
        <input
          type="text"
          className={`w-full px-3 py-2 text-sm bg-gray-100 border rounded cursor-not-allowed ${
            isModified 
              ? 'border-2 border-blue-300 text-gray-900' 
              : 'border-gray-300 text-gray-900'
          } ${!beforeValue ? 'italic' : ''}`}
          value={displayBeforeValue}
          readOnly
        />
      </div>
      <div className="flex-1">
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          {label} (After)
        </label>
        <input
          type="text"
          className={`w-full px-3 py-2 text-sm bg-gray-100 border rounded cursor-not-allowed ${
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
};

function QRDetailsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inventoryId = searchParams.get('inventoryId');
  const dln = searchParams.get('dln');
  const serviceCenter = searchParams.get('serviceCenter');
  const seid = searchParams.get('seid');
  const currentUserSeid = useSeid();
  
  const [qrData, setQRData] = useState<QRDetailsData | null>(null);
  const [inventoryRecord, setInventoryRecord] = useState<QRInventoryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashMessage, setFlashMessage] = useState<string>("");
  const [showFlash, setShowFlash] = useState(false);
  const [completing, setCompleting] = useState(false);
  const isLoadingRef = useRef(false);
  const [parsedNotes, setParsedNotes] = useState<any[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  // Helper function to get field value from eraDto-like object
  const getFieldValue = (data: any, fieldKey: string): string => {
    if (!data) return '';
    
    // Get the data source (workRecord or root)
    const dataSource = data?.workRecord || data;
    return (dataSource[fieldKey] || '').toString();
  };

  // Helper function to generate notes with additional comments
  const generateNotesWithAdditionalComments = () => {
    // Create new note if there are additional notes
    if (additionalNotes.trim()) {
      const commentsObj = {
        additionalComments: additionalNotes
      };
      
      const newNote = {
        author: seid || 'unknown',
        createdTime: new Date().toISOString(),
        comments: JSON.stringify(commentsObj)
      };
      
      // Add to existing notes (parsedNotes are already normalized when loaded)
      const updatedNotes = [...parsedNotes, newNote];
      // return JSON.stringify(updatedNotes);
      return updatedNotes;
    }
    
    // Return existing notes as string if no additional comments (parsedNotes are already normalized)
    // return parsedNotes.length > 0 ? JSON.stringify(parsedNotes) : JSON.stringify([]);
    return parsedNotes.length > 0 ? parsedNotes : [];
  };

  // Helper function to get field label from fieldMappings
  const getFieldLabel = (fieldKey: string): string => {
    const fieldConfig = (fieldMappings as any)[fieldKey];
    return fieldConfig?.label || toLabel(fieldKey);
  };


  // Load QR details data
  const loadQRDetails = useCallback(async () => {
    if (!inventoryId) {
      setError('No inventory ID provided');
      setLoading(false);
      return;
    }

    // Prevent duplicate calls using ref instead of state
    if (isLoadingRef.current) {
      console.log('Already loading, skipping duplicate call');
      return;
    }

    isLoadingRef.current = true;

    try {
      console.log('Starting loadQRDetails with inventoryId:', inventoryId);
      setLoading(true);
      setError(null);

      const data = await QRDetailsService.getQRDetails(inventoryId, dln || undefined, serviceCenter || undefined, currentUserSeid || undefined);
      console.log('API response data:', data);
      setQRData(data);
      
      // Parse and set notes from QR_HOLD data
      if (data?.QR_HOLD?.notes) {
        try {
          const notesData = typeof data.QR_HOLD.notes === 'string' 
            ? JSON.parse(data.QR_HOLD.notes) 
            : data.QR_HOLD.notes;
          // Ensure all notes have stringified comments
          const normalizedNotes = Array.isArray(notesData) 
            ? notesData.map(note => ({
                ...note,
                comments: typeof note.comments === 'string' ? note.comments : JSON.stringify(note.comments)
              }))
            : [];
          setParsedNotes(normalizedNotes);
          console.log('Notes parsed from QR_HOLD:', notesData);
        } catch (error) {
          console.error('Error parsing notes from QR_HOLD:', error);
          setParsedNotes([]);
        }
      } else {
        setParsedNotes([]);
      }
    } catch (err) {
      console.error('Error fetching QR details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load QR details');
      
      // Load mock data as fallback
      // console.log('Loading mock data as fallback...');
      // const mockData = QRDetailsService.getMockQRDetails(inventoryId, dln || undefined, serviceCenter || undefined, seid || undefined);
      // setQRData(mockData);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [inventoryId, dln, serviceCenter, currentUserSeid]); // Add dependencies for useCallback

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
    if (inventoryId) {
      loadQRDetails();
    }
  }, [inventoryId, dln, serviceCenter, seid, loadQRDetails]); // Include all variables used in the effect


  // Compare before and after values to determine if field is modified
  const isFieldModified = (beforeValue: any, afterValue: any): boolean => {
    return beforeValue !== afterValue;
  };

  // Get comparison fields - simple before/after comparison
  const getComparisonFields = () => {
    if (!qrData) return [];

    // Use fieldMappings for consistent field list
    return Object.keys(fieldMappings).map(fieldKey => {
      const beforeValue = getFieldValue(qrData.NEW, fieldKey);
      const afterValue = getFieldValue(qrData.QR_HOLD, fieldKey);
      const isModified = isFieldModified(beforeValue, afterValue);

      return {
        fieldKey,
        label: getFieldLabel(fieldKey),
        beforeValue,
        afterValue,
        isModified
      };
    });
  };

  const handleQRComplete = async () => {
    if (!inventoryId) {
      setFlashMessage("No inventory ID available.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
      return;
    }

    setCompleting(true);
    try {
      const response = await fetch(`/api/v1/era/qualityreview/${inventoryId}/reviewComplete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'SEID': `${currentUserSeid}`
        },
        body: JSON.stringify({
          inventoryId: inventoryId,
          completedBy: `${currentUserSeid}`,
          completedAt: new Date().toISOString()
          // notes: generateNotesWithAdditionalComments()
        })
      });

      if (response.ok) {
        // Clear additional notes after successful operation
        setAdditionalNotes('');
        
        setFlashMessage('QR Review completed successfully! Returning to inventory...');
        setShowFlash(true);
        
        // Navigate back to QR inventory after showing success message
        setTimeout(() => {
          router.push('/qrInventory');
        }, 2000);
      } else {
        const errorText = await response.text();
        throw new Error(`QR Complete failed: ${errorText}`);
      }
    } catch (error) {
      console.error('Error completing QR:', error);
      setFlashMessage('Error completing QR review. Please try again.');
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
    } finally {
      setCompleting(false);
    }
  };

  const handleRework = async () => {
    if (!inventoryId) {
      setFlashMessage("No inventory ID available.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
      return;
    }

    try {
      // Make GET call to retrieve the inventory item with workRecord
      // const response = await fetch(`/api/v1/era/inventories/items/${inventoryId}`, {
      const response = await fetch(`/api/v1/era/qualityreview/${inventoryId}/rework`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'SEID': `${currentUserSeid}`
        }
      });

      if (response.ok) {
        const inventoryItem = await response.json();
        console.log('Retrieved inventory item for rework:', inventoryItem);
        
        // Extract workRecord from the inventory item response
        const workRecord = inventoryItem.workRecord;
        
        if (workRecord) {
          // Store the entire inventory item as eraDto in sessionStorage for the workRecord page
          sessionStorage.setItem('eraDto', JSON.stringify(inventoryItem));
          
          // Navigate to workRecord page with qrReviewer flag
          const searchParams = new URLSearchParams({
            qrReviewer: 'true'
          });
          
          router.push(`/workRecord?${searchParams.toString()}`);
        } else {
          throw new Error('No work record found in inventory item');
        }
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to retrieve inventory item: ${errorText}`);
      }
    } catch (error) {
      console.error('Error reworking QR:', error);
      setFlashMessage('Error retrieving work record for rework. Please try again.');
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Loading QR details...</div>
        </div>
      </div>
    );
  }

  if (error && !qrData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  const comparisonFields = getComparisonFields();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* <Header user={mockUser} showBackButton backHref="/qrInventory" /> */}
      <Header />
      
      {/* Breadcrumbs */}
      <div className="px-4 pt-4 pb-2">
        <Breadcrumbs items={createBreadcrumbs.qrDetails()} />
      </div>
      
      {showFlash && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right">
          <span>{flashMessage}</span>
        </div>
      )}
      <div className="flex flex-col p-4 mx-auto w-full">
        {/* Top Toolbar */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-left">
              <div className="flex flex-wrap gap-3">
                <span className="inline-block bg-blue-900 text-white px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                  DLN: {inventoryRecord?.dln || dln}
                </span>
                <span className="inline-block bg-blue-900 text-white px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                  Service Center: {inventoryRecord?.serviceCenter || serviceCenter}
                </span>
                {inventoryRecord && (
                  <>
                    <span className="inline-block bg-blue-900 text-white px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                      Status: {inventoryRecord.status}
                    </span>
                    <span className="inline-block bg-blue-900 text-white px-3 py-1 rounded-full text-sm font-medium border border-purple-200">
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
                  Received Date: 2025-09-25 | Tax Period: {qrData?.QR_HOLD?.workRecord?.taxPrd || qrData?.NEW?.workRecord?.taxPrd || 'N/A'}
                </p>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-6 flex items-center gap-2 text-sm text-gray-700">
                <User className="w-4 h-4 text-gray-500" />
                <span>
                  {/* <strong>Last modified by:</strong> {inventoryRecord?.seid || seid || 'Unknown'} at {inventoryRecord?.updatedDate || qrData?.metadata.lastModifiedDate} */}
                </span>
              </div>
              
              {/* All Fields - Show Before/After Comparison */}
              <div className="grid grid-cols-1 gap-2">
                {comparisonFields.map((field) => (
                  <ComparisonField
                    key={field.fieldKey}
                    fieldKey={field.fieldKey}
                    label={field.label}
                    beforeValue={field.beforeValue}
                    afterValue={field.afterValue}
                    isModified={field.isModified}
                  />
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="border-t-2 border-gray-200 pt-4 mt-4">
              <div className="flex gap-4">
                <button
                  onClick={handleQRComplete}
                  disabled={completing}
                  className={`px-6 py-3 rounded text-sm font-medium transition-colors duration-200 ${
                    completing
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {completing ? 'Completing...' : 'QR Complete'}
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
          <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm flex flex-col max-h-[600px] min-w-0 overflow-hidden">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b-2 border-gray-200 pb-2 flex-shrink-0">
              Notes
            </h3>
            
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Additional Notes Input */}
              <div className="additional-notes-input mb-4 flex-shrink-0" style={{ display: 'none' }}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Additional Notes:
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Enter additional notes here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="notes-content overflow-y-auto flex-1 space-y-4">
                {parsedNotes.length === 0 ? (
                  <div className="text-gray-500 text-sm">No notes available</div>
                ) : (
                  parsedNotes.map((note: any, index: number) => (
                    <div key={index} className="note-entry border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="note-header mb-2">
                        <div className="text-sm font-medium text-gray-700">
                          Author: {note.author || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Created At: {note.createdTime ? new Date(note.createdTime).toLocaleString() : 'Unknown'}
                        </div>
                      </div>
                      
                      {note.comments && (() => {
                        try {
                          const parsedComments = typeof note.comments === 'string' ? JSON.parse(note.comments) : note.comments;
                          
                          // Handle case where parsedComments is a plain string
                          if (typeof parsedComments === 'string') {
                            return (
                              <div className="note-comments">
                                <div className="text-sm text-gray-700 whitespace-pre-line">
                                  {parsedComments}
                                </div>
                              </div>
                            );
                          }
                          
                          // Handle case where parsedComments is an object with properties
                          return (
                            <div className="note-comments">
                              {parsedComments.fieldChanges && parsedComments.fieldChanges.length > 0 && (
                                <div className="field-changes mb-3">
                                  <div className="text-sm font-medium text-gray-600 mb-1">Field Changes:</div>
                                  <div className="ml-4 space-y-1">
                                    {parsedComments.fieldChanges.map((change: any, changeIndex: number) => (
                                      <div key={changeIndex} className="text-xs text-gray-600">
                                        <span className="font-medium">{change.fieldName}:</span> {change.beforeValue} → {change.afterValue}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {parsedComments.additionalComments && (
                                <div className="additional-comments">
                                  <div className="text-sm font-medium text-gray-600 mb-1">Additional Comments:</div>
                                  <div className="text-sm text-gray-700 whitespace-pre-line ml-4">
                                    {parsedComments.additionalComments}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        } catch (error) {
                          console.error('Error parsing comments:', error);
                          return (
                            <div className="text-xs text-red-500">
                              Error displaying comments
                            </div>
                          );
                        }
                      })()}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function QRDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <QRDetailsPageContent />
    </Suspense>
  );
}
