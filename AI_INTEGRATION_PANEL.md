# AI Assistant Dialog — Implementation Reference

## Overview

A floating AI chat dialog (`AIAssistantDialog`) accessible from the work record page via a floating action button. Supports two modes:

- **Plan Mode** — conversational IRM guidance and Q&A
- **Agent Mode** — submits the work record to an AWS Strands agent, polls for recommendations, and surfaces proposed field corrections with confidence scores for user review

AWS infrastructure (S3 trigger, Strands agent, DynamoDB write) is owned by a separate team. This app only handles the **input (S3 upload)** and **output (DynamoDB poll)** sides.

---

## End-to-End Agent Flow

```
User clicks AI button
        │
        ▼
AIAssistantDialog opens (Agent Mode)
        │
        ▼
POST /api/ai-agent/submit  ──►  S3: input/{dln}.json
        │                             │
        │                       (triggers Strands agent)
        │                             │
        ▼                             ▼
GET /api/ai-agent/recommendations  ◄──  DynamoDB: item.dln
  (polls every 3 s, up to 60 s)
        │
        ▼
recommendations[] mapped to FieldChange[]
        │
        ▼
User reviews: Approve / Deny / Rework
        │
        ▼
onApplyFixes() updates eraDto in workRecord/page.tsx
```

### Status sequence shown to user

| `agentStatus` | Loading text |
|---|---|
| `submitting` | Submitting to AI agent… |
| `waiting` | Waiting for analysis… |
| `idle` / `error` | Analyzing… / error message |

---

## Relevant Files

### UI

| File | Role |
|---|---|
| `src/components/AIAssistantDialog.tsx` | Main dialog — modes, chat, field-change table, Approve/Deny/Rework actions |
| `src/components/AIFloatingButton.tsx` | FAB that opens the dialog |
| `src/app/workRecord/page.tsx` | Renders the dialog; passes `formData`, `dln`, errors, and `onApplyFixes` |

### API Routes (server-side, AWS SDK — never exposed to browser)

| File | Method | Purpose |
|---|---|---|
| `src/app/api/ai-agent/submit/route.ts` | `POST` | Accepts `{ eraDto, dln }`, uploads `input/{dln}.json` to S3 |
| `src/app/api/ai-agent/recommendations/route.ts` | `GET ?dln=` | Reads DynamoDB item by `dln`; returns `{ recommendations, status }` |

### Client Service

| File | Exports |
|---|---|
| `src/services/aiAgentService.ts` | `submitWorkRecord(eraDto, dln)`, `pollForRecommendations(dln, options?)` |

---

## Environment Variables

Add to `.env.local` (see `.env.example` for full template):

```bash
AWS_REGION=us-east-1
AI_AGENT_S3_BUCKET=<your-input-bucket>
AI_AGENT_DYNAMO_TABLE=<your-recommendations-table>
```

AWS credentials are resolved from the standard SDK chain (`~/.aws/credentials`, instance profile, env vars). Never hardcode them.

---

## Key Interfaces

### Props — `AIAssistantDialog`

```typescript
interface AIAssistantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formData?: Record<string, any>;   // eraDto passed from workRecord page
  dln?: string;                     // getDLN() from workRecord page
  currentError?: {
    code: string;
    description: string;
    fieldMappings?: string[];
  };
  allErrors?: Array<{
    code: string;
    description: string;
    fieldMappings?: string[];
  }>;
  onApplyFixes?: (fixes: ErrorFix[]) => void;
}
```

### DynamoDB Item Expected Shape

```json
{
  "dln": "20261234567890",
  "status": "COMPLETE",
  "recommendations": [
    {
      "field": "taxPrd",
      "currentValue": "202411",
      "proposedValue": "202412",
      "confidenceScore": 0.95,
      "reason": "Tax period mismatch based on MeF receipt date"
    }
  ],
  "analyzedAt": "2026-04-12T10:00:00Z"
}
```

`status` values: `PENDING` | `COMPLETE` | `ERROR`

### `AgentRecommendation` (from `aiAgentService.ts`)

```typescript
interface AgentRecommendation {
  field: string;
  currentValue: string;
  proposedValue: string;
  confidenceScore: number;  // 0.0–1.0
  reason?: string;
}
```

---

## Dialog Behavior

### On open (Agent Mode)
1. Welcome message shown
2. `submitWorkRecord(formData, dln)` called immediately
3. `pollForRecommendations(dln)` starts polling (3 s interval, 60 s timeout)
4. On success → `FieldChange[]` populates the review table
5. On timeout/error → error message shown with Rework option

### User actions
- **Approve** — calls `onApplyFixes()`, updates `eraDto` in `workRecord/page.tsx`
- **Deny** — modal collects feedback; changes discarded
- **Rework** — re-submits to S3 and re-polls DynamoDB from scratch

### Plan Mode
- Q&A only; simulated IRM guidance via `generateCombinedResponse()`
- No AWS calls; keywords `analyze / fix / check` in chat switch to real agent flow

---

## Confidence Score Display

| Score | Color | Badge |
|---|---|---|
| ≥ 90% | Green | — |
| ≥ 75% | Yellow | — |
| < 75% | Orange | "Manual Review" |

---

## Dependencies

```json
"@aws-sdk/client-s3": "^3.758.0",
"@aws-sdk/client-dynamodb": "^3.758.0",
"@aws-sdk/lib-dynamodb": "^3.758.0"
```

---

## Testing Checklist

- [ ] Dialog opens and immediately submits to S3 (`POST /api/ai-agent/submit` returns 200)
- [ ] Polling shows "Waiting for analysis…" until DynamoDB item is ready
- [ ] `COMPLETE` item populates field-change table correctly
- [ ] `ERROR` status from DynamoDB shows error message in chat
- [ ] 60 s timeout displays timeout message with Rework option
- [ ] Approve applies all selected changes to the form fields
- [ ] Deny modal submits feedback and discards changes
- [ ] Rework re-submits and re-polls successfully
- [ ] Dialog close aborts ongoing polling (no state updates after unmount)
- [ ] Plan Mode Q&A still works independently of agent flow
- [ ] Missing `dln` shows a clear "Cannot start analysis" message
