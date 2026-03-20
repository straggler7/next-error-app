import type { FormDef } from "../types";
import {
  ssnField,
  taxPeriodField,
  nameControlField,
  transactionDateField,
} from "../shared/commonFields";

// Form 4868 — Application for Automatic Extension of Time to File
// Migrated from: fieldConfig4868.json + errorConfig4868.json
//
// 4868 is a flat, single-section form — all fields live in one "main" section.
// The single section means the tab nav is hidden; it renders like the old flat layout.

export const form4868: FormDef = {
  formId: "4868",
  formName: "Application for Automatic Extension of Time to File U.S. Individual Income Tax Return",
  series: "4868",
  entityType: "individual",

  sections: [
    {
      id: "main",
      type: "part",
      label: "Form Details",
      title: "Application for Automatic Extension",
      fields: [
        transactionDateField(),
        ssnField(),
        taxPeriodField(),
        nameControlField(),
        {
          id: "mftCd",
          label: "Master File System ID Code (01MFT)",
          type: "text",
          editable: false,
        },
        {
          id: "napEifNameCtrlUndrprt",
          label: "Name Control (01NC_)",
          type: "text",
          editable: false,
        },
        {
          id: "napAccessInd",
          label: "NAP Access Indicator (01NA1)",
          type: "text",
          editable: false,
        },
        {
          id: "napEifResponseInd",
          label: "NAP EIF Response Indicator (01NR1)",
          type: "text",
          editable: false,
        },
        {
          id: "transCd",
          label: "Transaction Code (01TC)",
          type: "text",
          editable: false,
        },
        {
          id: "secondaryTransCd",
          label: "Secondary Transaction Code (01STC)",
          type: "text",
          editable: false,
        },
        {
          id: "docCode",
          label: "Document Code (01DC)",
          type: "text",
          editable: false,
        },
      ],
    },
  ],

  errors: [
    {
      code: "004",
      description: "EIF/NAP Mismatch",
      category: "consistency",
      clearable: true,
      sectionId: "main",
      affectedFieldIds: ["primarySSN", "primaryNameCtrl"],
      irm: {
        cite: "IRM 3.12.32.6.1",
        title: "EIF/NAP Mismatch Resolution",
        content: "The EIF (Electronic Filing Indicator) does not match the NAP (Name Address Profile). Verify the taxpayer's TIN and Name Control against IRS records.",
        steps: [
          "Compare TIN on the return against the EIF record",
          "Verify the Name Control matches the NAP database",
          "If both are correct, enter 'C' to clear this consistency error",
          "If incorrect, update the SSN or Name Control field",
        ],
      },
    },
    {
      code: "005",
      description: "Name Control Mismatch NAP/EIF",
      category: "consistency",
      clearable: true,
      sectionId: "main",
      affectedFieldIds: ["primaryNameCtrl"],
      irm: {
        cite: "IRM 3.12.32.6.2",
        title: "Name Control Mismatch Resolution",
        content: "The Name Control on the return does not match the NAP/EIF record.",
        steps: [
          "Verify the Name Control in field 01NC",
          "Check the taxpayer name against the NAP database",
          "Correct the Name Control if necessary, then resubmit",
        ],
      },
    },
    {
      code: "011",
      description: "NAP Linkage Down",
      category: "system",
      clearable: false,
      affectedFieldIds: [],
    },
    {
      code: "103",
      description: "Invalid Master File Tax Code",
      category: "field",
      clearable: false,
      sectionId: "main",
      affectedFieldIds: ["mftCd"],
    },
    {
      code: "107",
      description: "Tax Period",
      category: "consistency",
      clearable: false,
      sectionId: "main",
      affectedFieldIds: ["taxPrd", "meFReceiptDate"],
    },
    {
      code: "111",
      description: "Tax Period/Transaction Date",
      category: "consistency",
      clearable: true,
      sectionId: "main",
      affectedFieldIds: ["taxPrd", "meFReceiptDate"],
    },
    {
      code: "113",
      description: "Transaction Date",
      category: "field",
      clearable: false,
      sectionId: "main",
      affectedFieldIds: ["meFReceiptDate"],
    },
    {
      code: "135",
      description: "Extended Due Date",
      category: "field",
      clearable: false,
      affectedFieldIds: [],
    },
    {
      code: "01TIN",
      description: "Taxpayer Identification Number",
      category: "field",
      clearable: false,
      sectionId: "main",
      affectedFieldIds: ["primarySSN"],
    },
    {
      code: "01NC",
      description: "Taxpayer Name Control",
      category: "field",
      clearable: false,
      sectionId: "main",
      affectedFieldIds: ["primaryNameCtrl"],
    },
    {
      code: "01TXP",
      description: "Tax Period",
      category: "field",
      clearable: false,
      sectionId: "main",
      affectedFieldIds: ["taxPrd"],
    },
    {
      code: "01TDT",
      description: "Transaction Date",
      category: "field",
      clearable: false,
      sectionId: "main",
      affectedFieldIds: ["meFReceiptDate"],
    },
  ],
};
