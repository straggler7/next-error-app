import type { FormDef } from "../types";
import { einField, taxPeriodField } from "../shared/commonFields";

// Form 940 — Employer's Annual Federal Unemployment (FUTA) Tax Return
// 94X series — multi-section form with 7 parts + optional schedules

export const form940: FormDef = {
  formId: "940",
  formName: "Employer's Annual Federal Unemployment (FUTA) Tax Return",
  series: "94X",
  entityType: "employer",

  sections: [
    // ─── Part 1: Tell Us About Your Return ──────────────────────────────────
    {
      id: "part1",
      type: "part",
      label: "Part 1",
      title: "Tell Us About Your Return",
      fields: [
        einField({ id: "ein", label: "Employer Identification Number (EIN)", editable: false }),
        taxPeriodField({ id: "taxYr", label: "Tax Year", lineNumber: undefined }),
        {
          id: "returnType",
          label: "Type of Return",
          type: "select",
          editable: true,
          helpText: "Check all that apply",
          options: [
            { value: "", label: "Select return type" },
            { value: "amended", label: "Amended" },
            { value: "successor", label: "Successor employer" },
            { value: "noPayments", label: "No payments to employees in 2024" },
            { value: "finalReturn", label: "Final: Business closed or stopped paying wages" },
          ],
        },
        {
          id: "multiStateEmployer",
          label: "Multi-State Employer",
          lineNumber: "1b",
          type: "checkbox",
          editable: true,
          helpText: "Check if you paid wages in more than one state",
          options: [{ value: "true", label: "Yes, paid wages in more than one state" }],
        },
        {
          id: "creditReductionState",
          label: "Credit Reduction State",
          lineNumber: "2",
          type: "checkbox",
          editable: true,
          helpText: "Check if you paid wages in a credit reduction state. See instructions and Schedule A (Form 940).",
          options: [{ value: "true", label: "Yes, paid wages in a credit reduction state" }],
        },
      ],
    },

    // ─── Part 2: Determine FUTA Tax Before Adjustments ──────────────────────
    {
      id: "part2",
      type: "part",
      label: "Part 2",
      title: "Determine Your FUTA Tax Before Adjustments",
      instructions: "If any line does not apply, leave it blank. See instructions before completing Part 2.",
      fields: [
        {
          id: "totalPayments",
          label: "Total payments to all employees",
          lineNumber: "3",
          type: "currency",
          editable: true,
          span: 1,
          validation: {
            required: true,
            pattern: "^\\d+(\\.\\d{1,2})?$",
            messages: {
              required: "Total payments is required",
              pattern: "Enter a valid dollar amount (e.g., 45000.00)",
            },
          },
        },
        {
          id: "fringeExempt",
          label: "Payments exempt — Fringe benefits",
          lineNumber: "4a",
          type: "currency",
          editable: true,
        },
        {
          id: "groupTermLifeExempt",
          label: "Payments exempt — Group-term life insurance",
          lineNumber: "4b",
          type: "currency",
          editable: true,
        },
        {
          id: "retirementPensionExempt",
          label: "Payments exempt — Retirement/pension",
          lineNumber: "4c",
          type: "currency",
          editable: true,
        },
        {
          id: "dependentCareExempt",
          label: "Payments exempt — Dependent care",
          lineNumber: "4d",
          type: "currency",
          editable: true,
        },
        {
          id: "otherExempt",
          label: "Payments exempt — Other",
          lineNumber: "4e",
          type: "currency",
          editable: true,
        },
        {
          id: "totalExemptPayments",
          label: "Total exempt payments (add lines 4a–4e)",
          lineNumber: "4f",
          type: "calculated",
          editable: false,
          formula: "part2.fringeExempt + part2.groupTermLifeExempt + part2.retirementPensionExempt + part2.dependentCareExempt + part2.otherExempt",
          dependsOn: ["fringeExempt", "groupTermLifeExempt", "retirementPensionExempt", "dependentCareExempt", "otherExempt"],
        },
        {
          id: "paymentsOverThreshold",
          label: "Total payments made to each employee in excess of $7,000",
          lineNumber: "5",
          type: "currency",
          editable: true,
          helpText: "For each employee, any amounts over $7,000 are excluded from FUTA wages",
        },
        {
          id: "subtotal",
          label: "Subtotal (line 4f + line 5)",
          lineNumber: "6",
          type: "calculated",
          editable: false,
          formula: "part2.totalExemptPayments + part2.paymentsOverThreshold",
          dependsOn: ["totalExemptPayments", "paymentsOverThreshold"],
        },
        {
          id: "taxableWages",
          label: "Total taxable FUTA wages (line 3 − line 6)",
          lineNumber: "7",
          type: "calculated",
          editable: false,
          formula: "part2.totalPayments - part2.subtotal",
          dependsOn: ["totalPayments", "subtotal"],
        },
        {
          id: "futaTaxBefore",
          label: "FUTA tax before adjustments (line 7 × .006)",
          lineNumber: "8",
          type: "calculated",
          editable: false,
          formula: "part2.taxableWages * 0.006",
          dependsOn: ["taxableWages"],
        },
      ],
    },

    // ─── Part 3: Determine Your Adjustments ─────────────────────────────────
    {
      id: "part3",
      type: "part",
      label: "Part 3",
      title: "Determine Your Adjustments",
      instructions: "If ANY of the taxable FUTA wages you paid were excluded from state unemployment tax, OR you paid ANY state unemployment tax late (after the due date), complete lines 9, 10, and 11.",
      fields: [
        {
          id: "allExcludedFromStateUnempl",
          label: "All taxable FUTA wages excluded from state unemployment tax — multiply line 7 × .054",
          lineNumber: "9",
          type: "currency",
          editable: true,
          helpText: "If this applies, enter the amount; otherwise leave blank",
        },
        {
          id: "someExcludedFromStateUnempl",
          label: "Some taxable FUTA wages excluded from state unemployment tax",
          lineNumber: "10",
          type: "currency",
          editable: true,
          helpText: "See the instructions for line 10 before completing this line",
        },
        {
          id: "creditReductionAmount",
          label: "Credit reduction — if you paid wages subject to the unemployment tax laws of a credit reduction state",
          lineNumber: "11",
          type: "currency",
          editable: true,
          helpText: "Enter the total from Schedule A (Form 940)",
          condition: {
            fieldId: "creditReductionState",
            operator: "eq",
            value: "true",
          },
        },
      ],
    },

    // ─── Part 4: Determine FUTA Tax and Balance ──────────────────────────────
    {
      id: "part4",
      type: "part",
      label: "Part 4",
      title: "Determine Your FUTA Tax and Balance Due or Overpayment",
      fields: [
        {
          id: "totalFutaAfterAdjustments",
          label: "Total FUTA tax after adjustments (lines 8 + 9 + 10 + 11)",
          lineNumber: "12",
          type: "calculated",
          editable: false,
          formula: "part2.futaTaxBefore + part3.allExcludedFromStateUnempl + part3.someExcludedFromStateUnempl + part3.creditReductionAmount",
          dependsOn: ["futaTaxBefore", "allExcludedFromStateUnempl", "someExcludedFromStateUnempl", "creditReductionAmount"],
        },
        {
          id: "futaDeposited",
          label: "FUTA tax deposited for the year, including any overpayment applied from a prior year",
          lineNumber: "13",
          type: "currency",
          editable: true,
        },
        {
          id: "balanceDue",
          label: "Balance due (if line 12 is more than line 13, enter the excess on line 14)",
          lineNumber: "14",
          type: "calculated",
          editable: false,
          formula: "part4.totalFutaAfterAdjustments - part4.futaDeposited",
          dependsOn: ["totalFutaAfterAdjustments", "futaDeposited"],
        },
        {
          id: "overpayment",
          label: "Overpayment (if line 13 is more than line 12, enter the excess on line 15)",
          lineNumber: "15",
          type: "currency",
          editable: true,
        },
        {
          id: "overpaymentDisposition",
          label: "Apply overpayment to next return / Send a refund",
          type: "radio",
          editable: true,
          condition: { fieldId: "overpayment", operator: "truthy" },
          options: [
            { value: "apply", label: "Apply to next return" },
            { value: "refund", label: "Send a refund" },
          ],
        },
      ],
    },

    // ─── Part 5: FUTA Tax Liability by Quarter ───────────────────────────────
    {
      id: "part5",
      type: "part",
      label: "Part 5",
      title: "Report Your FUTA Tax Liability by Quarter Only if Line 12 Is More Than $500",
      instructions: "If not required to complete this section, leave it blank.",
      fields: [
        {
          id: "liabilityQ1",
          label: "1st quarter (Jan 1 – Mar 31)",
          lineNumber: "16a",
          type: "currency",
          editable: true,
        },
        {
          id: "liabilityQ2",
          label: "2nd quarter (Apr 1 – Jun 30)",
          lineNumber: "16b",
          type: "currency",
          editable: true,
        },
        {
          id: "liabilityQ3",
          label: "3rd quarter (Jul 1 – Sep 30)",
          lineNumber: "16c",
          type: "currency",
          editable: true,
        },
        {
          id: "liabilityQ4",
          label: "4th quarter (Oct 1 – Dec 31)",
          lineNumber: "16d",
          type: "currency",
          editable: true,
        },
        {
          id: "totalLiability",
          label: "Total tax liability for the year (lines 16a + 16b + 16c + 16d = line 12)",
          lineNumber: "17",
          type: "calculated",
          editable: false,
          formula: "part5.liabilityQ1 + part5.liabilityQ2 + part5.liabilityQ3 + part5.liabilityQ4",
          dependsOn: ["liabilityQ1", "liabilityQ2", "liabilityQ3", "liabilityQ4"],
        },
      ],
    },

    // ─── Part 6: Third-Party Designee ────────────────────────────────────────
    {
      id: "part6",
      type: "part",
      label: "Part 6",
      title: "May We Speak With Your Third-Party Designee?",
      instructions: "Do you want to allow an employee, a paid tax preparer, or another person to discuss this return with the IRS?",
      fields: [
        {
          id: "designeeYesNo",
          label: "Third-Party Designee",
          type: "radio",
          editable: true,
          options: [
            { value: "yes", label: "Yes. Complete the following" },
            { value: "no", label: "No" },
          ],
        },
        {
          id: "designeeName",
          label: "Designee's name",
          type: "text",
          editable: true,
          condition: { fieldId: "designeeYesNo", operator: "eq", value: "yes" },
        },
        {
          id: "designeePhone",
          label: "Phone number",
          type: "text",
          editable: true,
          condition: { fieldId: "designeeYesNo", operator: "eq", value: "yes" },
        },
        {
          id: "designeePin",
          label: "Personal identification number (PIN)",
          type: "text",
          editable: true,
          condition: { fieldId: "designeeYesNo", operator: "eq", value: "yes" },
        },
      ],
    },

    // ─── Part 7: Sign Here ────────────────────────────────────────────────────
    {
      id: "part7",
      type: "part",
      label: "Part 7",
      title: "Sign Here",
      instructions: "You MUST complete both pages of this form and SIGN it.",
      fields: [
        {
          id: "signerName",
          label: "Print your name here",
          type: "text",
          editable: false,
        },
        {
          id: "signerTitle",
          label: "Print your title here",
          type: "text",
          editable: false,
        },
        {
          id: "bestDaytimePhone",
          label: "Best daytime phone",
          type: "text",
          editable: false,
        },
        {
          id: "paidPreparerName",
          label: "Paid preparer name",
          type: "text",
          editable: false,
        },
        {
          id: "paidPreparerPtin",
          label: "Paid preparer PTIN",
          type: "text",
          editable: false,
        },
      ],
    },

    // ─── Schedule A: Multi-State Employer ────────────────────────────────────
    {
      id: "scheduleA",
      type: "schedule",
      label: "Schedule A",
      title: "Multi-State Employer and Credit Reduction Information",
      instructions: "Complete Schedule A only if you were required to pay state unemployment tax in more than one state, or if you paid wages in any credit reduction state.",
      condition: {
        fieldId: "multiStateEmployer",
        operator: "eq",
        value: "true",
      },
      fields: [
        {
          id: "schedAStateCode",
          label: "State abbreviation",
          type: "text",
          editable: true,
          validation: {
            pattern: "^[A-Z]{2}$",
            messages: { pattern: "Enter a valid 2-letter state code" },
          },
        },
        {
          id: "schedATaxableWages",
          label: "Taxable FUTA wages paid in state",
          type: "currency",
          editable: true,
        },
        {
          id: "schedACreditReductionRate",
          label: "Credit reduction rate",
          type: "text",
          editable: false,
        },
        {
          id: "schedACreditReductionAmount",
          label: "Credit reduction amount",
          type: "calculated",
          editable: false,
          formula: "scheduleA.schedATaxableWages * scheduleA.schedACreditReductionRate",
          dependsOn: ["schedATaxableWages", "schedACreditReductionRate"],
        },
      ],
    },
  ],

  errors: [
    {
      code: "R03",
      description: "Total Wages Mismatch",
      category: "consistency",
      clearable: false,
      sectionId: "part2",
      affectedFieldIds: ["totalPayments"],
      irm: {
        cite: "IRM 3.12.32.6.3",
        title: "FUTA Total Wages Verification",
        content: "The total payments on Line 3 do not match the expected aggregate. Verify the total against all employee W-2 wages.",
        steps: [
          "Compare Line 3 to the sum of Box 1 wages from all Form W-2s",
          "Check for any payments that should be included but are missing",
          "If the discrepancy is due to exempt payments, ensure they are properly recorded on Lines 4a–4e",
          "Correct Line 3 and resubmit",
        ],
      },
    },
    {
      code: "R07",
      description: "Invalid FUTA Tax Amount",
      category: "math",
      clearable: false,
      sectionId: "part2",
      affectedFieldIds: ["futaTaxBefore", "taxableWages"],
      irm: {
        cite: "IRM 3.12.32.6.4",
        title: "FUTA Tax Calculation Error",
        content: "The FUTA tax on Line 8 does not equal Line 7 multiplied by the FUTA rate (.006).",
        steps: [
          "Verify Line 7 (Total taxable FUTA wages) is correct",
          "Recalculate: Line 8 = Line 7 × .006",
          "If wages exceed $7,000 per employee, ensure excess is excluded on Line 5",
        ],
      },
    },
    {
      code: "F11",
      description: "State Unemployment Tax Excluded — Adjustment Required",
      category: "field",
      clearable: true,
      sectionId: "part3",
      affectedFieldIds: ["allExcludedFromStateUnempl"],
      irm: {
        cite: "IRM 3.12.32.7.1",
        title: "State Unemployment Tax Exclusion",
        content: "Wages were excluded from state unemployment tax. Line 9 adjustment must be verified.",
        steps: [
          "Confirm the employer was not required to pay state unemployment tax",
          "Verify the Line 9 amount equals Line 7 × .054",
          "If correct, enter C to clear this error",
        ],
      },
    },
    {
      code: "Q16",
      description: "Quarterly Liability Total Mismatch",
      category: "math",
      clearable: false,
      sectionId: "part5",
      affectedFieldIds: ["totalLiability", "liabilityQ1", "liabilityQ2", "liabilityQ3", "liabilityQ4"],
      irm: {
        cite: "IRM 3.12.32.8.1",
        title: "Quarterly Liability Reconciliation",
        content: "The sum of quarterly liabilities (Line 17) does not match Line 12 (Total FUTA tax after adjustments).",
        steps: [
          "Add up lines 16a through 16d",
          "Verify the total matches Line 12",
          "Correct any quarterly amount that is out of balance",
        ],
      },
    },
  ],
};
