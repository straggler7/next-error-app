"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import ErrorSidebar from "../../components/ErrorSidebar";
import FormSection, { FormField, FormInput } from "../../components/FormSection";
import NotesSection from "../../components/NotesSection";
import { mockUser } from "../../data/mockData";
import { ErrorItem, Note } from "../../types";
import ersDto from "../../data/ersDto.json";

// Helper to prettify labels from keys like "primarySSN" -> "Primary SSN"
const toLabel = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());

export default function Form4868ERSPage() {
  const workRecord = ersDto?.workRecord ?? {} as any;

  // Build error items from errReasonCdsMap
  const errorItems: ErrorItem[] = useMemo(() => {
    const map = workRecord?.errReasonCdsMap || {};
    const entries = Object.entries(map) as [string, string][];
    return entries.map(([key, val], idx) => ({
      id: key,
      code: key,
      type: "FIELD",
      description: val || key,
      status: "active",
      errorFields: [],
      irm: {
        title: `IRM 3.12.${180 + idx} - Error Resolution`,
        content: val || key,
        steps: [
          "Review the error description",
          "Correct the identified issue",
          "Validate the correction",
        ],
      },
    }));
  }, [workRecord]);

  // Editable fields list from ersDto
  const editableFieldKeys: string[] = useMemo(() => {
    const ef = workRecord?.editableFields || {};
    const keys = Object.keys(ef);
    // Ensure TaxPeriodEndDt is present as required
    if (!keys.includes("TaxPeriodEndDt")) keys.unshift("TaxPeriodEndDt");
    return keys;
  }, [workRecord]);

  // Map DTO keys to actual WorkRecord property names (handle typos/mismatches)
  const dtoToRecordKey: Record<string, string> = {
    TaxPeriodEndDt: ("taxPeriodEndDt" in workRecord)
      ? "taxPeriodEndDt"
      : ("TaxPeriodEndDt" in workRecord ? "TaxPeriodEndDt" : "taxPeriodEndDt"),
    primaryNameContro1Txt: "primaryNameControlTxt", // DTO appears to have a "1" instead of "l"
    nameLine1Txt: "nameLine1Txt",
    primarySSN: "primarySSN",
  };

  // Build initial values and original snapshot
  const initialValues = useMemo(() => {
    const values: Record<string, string> = {};
    for (const key of editableFieldKeys) {
      const recordKey = dtoToRecordKey[key] || key;
      const v = (workRecord as any)?.[recordKey];
      values[key] = v ?? "";
    }
    return values;
  }, [editableFieldKeys, workRecord]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [originalValues, setOriginalValues] = useState<Record<string, string>>({});
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setValues(initialValues);
    setOriginalValues(initialValues);
  }, [initialValues]);

  const getDLN = () => workRecord?.dln || "N/A";

  const handleInputChange = (fieldKey: string, val: string) => {
    setValues((prev) => ({ ...prev, [fieldKey]: val }));
  };

  const clearFieldHighlight = () => {
    setHighlightedFields([]);
    setSelectedErrorId(null);
  };

  const handleErrorClick = (error: ErrorItem) => {
    if (selectedErrorId === error.id) {
      setHighlightedFields([]);
      setSelectedErrorId(null);
    } else {
      setHighlightedFields(error.errorFields || []);
      setSelectedErrorId(error.id);
    }
  };

  const mockNotes: Note[] = [];

  const [flashMessage, setFlashMessage] = useState<string>("");
  const [showFlash, setShowFlash] = useState(false);

  const handleSubmit = async () => {
    setHighlightedFields([]);
    setSubmitting(true);
    try {
      // For now, just simulate success
      setFlashMessage("Form submitted successfully");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={mockUser} showBackButton backHref="/" />

      {showFlash && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right">
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
          </div>
          <button className="inline-flex items-center gap-2 px-6 py-2 bg-[#0f507e] text-white text-sm font-medium rounded-lg transition-all duration-200 hover:bg-[#0f507e] hover:-translate-y-0.5 shadow-sm">
            View RRD Data
          </button>
        </div>
      </div>

      {/* Layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-[25%_75%] gap-4 px-4 pb-4">
        {/* Left Sidebar */}
        <div className="flex flex-col gap-4">
          <ErrorSidebar errors={errorItems} onErrorSelect={handleErrorClick} selectedErrorId={selectedErrorId} />
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">Notes</h3>
            <NotesSection notes={mockNotes} onAddNote={(content) => console.log("Add note:", content)} />
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex flex-col" style={{ height: "fit-content" }}>
          <div className="flex-1 overflow-y-auto">
            <form className="space-y-8">
              <FormSection 
                title="Form 4868 - Application for Automatic Extension"
                metadata={{
                  receivedDate: workRecord?.transDt ? new Date(workRecord.transDt).toLocaleDateString() : undefined,
                  taxPeriod: workRecord?.taxPrd,
                }}
              >
                <div className="space-y-8 px-1">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Editable Fields</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                      {editableFieldKeys.map((key) => (
                        <FormField
                          key={key}
                          label={key === "TaxPeriodEndDt" ? "Tax Period End Date" : toLabel(key)}
                          originalValue={originalValues[key] ?? ""}
                          currentValue={values[key] ?? ""}
                          showChangeIndicator={true}
                          isHighlighted={highlightedFields.includes(key)}
                        >
                          <FormInput
                            id={key}
                            value={values[key] ?? ""}
                            onChange={(v) => handleInputChange(key, v)}
                            placeholder={`Enter ${key === "TaxPeriodEndDt" ? "YYYY-MM-DD" : toLabel(key)}`}
                            onBlur={() => clearFieldHighlight()}
                          />
                        </FormField>
                      ))}
                    </div>
                  </div>
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
          <div className="flex justify-start gap-4 pt-4 border-t border-gray-200 mt-4">
            <button
              type="button"
              className="px-6 py-2 bg-[#0f507e] text-white font-medium rounded-lg transition-all duration-200 hover:bg-[#0f507e] hover:-translate-y-0.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                clearFieldHighlight();
                handleSubmit();
              }}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-[#0f507e] text-white font-medium rounded-lg transition-all duration-200 hover:bg-[#0f507e] hover:-translate-y-0.5 shadow-sm"
              onClick={() => {
                clearFieldHighlight();
                console.log("Suspend form");
              }}
            >
              Suspend
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-[#0f507e] text-white font-medium rounded-lg transition-all duration-200 hover:bg-[#0f507e] hover:-translate-y-0.5 shadow-sm"
              onClick={() => {
                clearFieldHighlight();
                console.log("Close out form");
              }}
            >
              Close Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
