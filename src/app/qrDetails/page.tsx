"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, User, AlertCircle } from "lucide-react";
import Header from "../../components/Header";
import NotesSection from "../../components/NotesSection";
import { mockUser } from "../../data/mockData";
import { FormElement } from "../../services/workAssignmentService";
import { Note } from "../../types";

// Helper to prettify labels from keys like "primarySSN" -> "Primary SSN"
const toLabel = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());

interface QRDetailsData {
  before: any;
  after: any;
  metadata: {
    dln: string;
    serviceCenter: string;
    taxPeriod: string;
    submissionAge: number;
    lastModifiedBy: string;
    lastModifiedDate: string;
    errors: string[];
  };
}

interface ComparisonFieldProps {
  label: string;
  beforeValue: string;
  afterValue: string;
  isModified: boolean;
}

const ComparisonField: React.FC<ComparisonFieldProps> = ({
  label,
  beforeValue,
  afterValue,
  isModified
}) => {
  const displayBeforeValue = beforeValue || 'Not provided';
  const displayAfterValue = afterValue || 'Not provided';
  
  return (
    <div className={`grid grid-cols-2 gap-4 mb-4 p-3 rounded-lg ${
      isModified ? 'bg-orange-50' : 'bg-gray-50'
    }`}>
      <div className="flex-1">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          {label}
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
          &nbsp;
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
};

export default function QRDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dln = searchParams.get('dln');
  
  const [qrData, setQRData] = useState<QRDetailsData | null>(null);
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

  // Load QR details data
  const loadQRDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock API call - in real implementation, this would fetch before/after data
      const response = await fetch(`/api/v1/era/qr-details?dln=${dln}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setQRData(data);
    } catch (err) {
      console.error('Error fetching QR details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load QR details');
      
      // Mock data for development
      setQRData({
        before: {
          name: "Johnson, Michael R",
          address: "1247 Oak Street",
          city: "Springfield",
          zipCode: "62701",
          taxYear: "2025",
          socialSecurityNumber: "",
          spouseSocialSecurityNumber: "987-65-4321",
          totalTaxLiability: "8750.00",
          totalPayments: "1550.00",
          balanceDue: "7200.00",
          amountBeingPaid: "1550.00"
        },
        after: {
          name: "Johnson, Michael R",
          address: "1247 Oak Street, Apt 2B",
          city: "Springfield",
          zipCode: "62701",
          taxYear: "2025",
          socialSecurityNumber: "123-45-6789",
          spouseSocialSecurityNumber: "987-65-4321",
          totalTaxLiability: "9250.00",
          totalPayments: "2050.00",
          balanceDue: "7200.00",
          amountBeingPaid: "2050.00"
        },
        metadata: {
          dln: dln || "00217-102-05701-4",
          serviceCenter: "Austin",
          taxPeriod: "2025",
          submissionAge: 2,
          lastModifiedBy: "1ABCD (Sarah Thompson)",
          lastModifiedDate: "2025-01-03 14:30:15",
          errors: ["01ED - Extended Due Date", "01TIN - Missing TIN"]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dln) {
      loadQRDetails();
    }
  }, [dln]);

  // Compare before and after values to determine if field is modified
  const isFieldModified = (beforeValue: any, afterValue: any): boolean => {
    return beforeValue !== afterValue;
  };

  // Get comparison fields from the data
  const getComparisonFields = () => {
    if (!qrData) return [];

    const fields = [
      { key: 'name', label: 'Name' },
      { key: 'address', label: 'Address' },
      { key: 'city', label: 'City, Town or Post Office' },
      { key: 'zipCode', label: 'Zip Code' },
      { key: 'taxYear', label: 'Tax Year' },
      { key: 'socialSecurityNumber', label: 'Social Security Number' },
      { key: 'spouseSocialSecurityNumber', label: 'Spouse\'s Social Security Number' },
      { key: 'totalTaxLiability', label: 'Total Tax Liability' },
      { key: 'totalPayments', label: 'Total Payments' },
      { key: 'balanceDue', label: 'Balance Due' },
      { key: 'amountBeingPaid', label: 'Amount Being Paid' }
    ];

    return fields.map(field => ({
      ...field,
      beforeValue: qrData.before[field.key] || '',
      afterValue: qrData.after[field.key] || '',
      isModified: isFieldModified(qrData.before[field.key], qrData.after[field.key])
    }));
  };

  const handleQRComplete = async () => {
    try {
      // API call to complete QR
      console.log('QR Complete for DLN:', dln);
      alert('QR Review completed successfully!');
      router.push('/qrInventory');
    } catch (error) {
      console.error('Error completing QR:', error);
      alert('Failed to complete QR review');
    }
  };

  const handleRework = async () => {
    try {
      // API call to request rework
      console.log('Rework requested for DLN:', dln);
      alert('Rework requested successfully!');
      router.push('/qrInventory');
    } catch (error) {
      console.error('Error requesting rework:', error);
      alert('Failed to request rework');
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
                  DLN: {qrData?.metadata.dln}
                </span>
                <span className="inline-block bg-blue-900 text-white px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                  Service Center: {qrData?.metadata.serviceCenter}
                </span>
                <span className="inline-block bg-blue-900 text-white px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                  Tax Period: {qrData?.metadata.taxPeriod}
                </span>
                <span className="inline-block bg-blue-900 text-white px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                  Submission Age: {qrData?.metadata.submissionAge} Days
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Badges Section */}
        {qrData?.metadata.errors && qrData.metadata.errors.length > 0 && (
          <div className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100" style={{display: 'none'}}>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-base font-semibold text-gray-900">Active Errors</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {qrData.metadata.errors.map((error, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-2xl text-sm font-medium hover:bg-red-100 transition-colors duration-200"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form Section (Left 60% / 3 columns) */}
          <div className="lg:col-span-3 bg-white rounded-lg p-6 shadow-sm">
            <div className="mb-6">
              <div className="text-lg font-semibold mb-4 text-gray-700 border-b-2 border-gray-200 pb-2">
                FORM 4868 - Application for Automatic Extension
                <p className="text-sm font-normal mt-2 text-gray-600">
                  Received Date: 2025-09-25 | Tax Period: {qrData?.metadata.taxPeriod}
                </p>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-6 flex items-center gap-2 text-sm text-gray-700">
                <User className="w-4 h-4 text-gray-500" />
                <span>
                  <strong>Last modified by:</strong> {qrData?.metadata.lastModifiedBy} at {qrData?.metadata.lastModifiedDate}
                </span>
              </div>
              
              {/* Comparison Fields */}
              <div>
                {comparisonFields.map((field, index) => (
                  <ComparisonField
                    key={index}
                    label={field.label}
                    beforeValue={field.beforeValue}
                    afterValue={field.afterValue}
                    isModified={field.isModified}
                  />
                ))}
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
