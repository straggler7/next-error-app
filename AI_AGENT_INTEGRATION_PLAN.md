# AI Agent Integration Plan

## Architecture Overview

```
UI (AIAssistantDialog)
  ↓ calls
aiAgentService.ts  (client-side service)
  ↓ calls
Next.js API Routes (server-side, holds AWS credentials safely)
  ↓ calls
AWS S3 (PUT work record JSON)  →  Strands Agent triggers
AWS DynamoDB (GET recommendations, keyed by DLN)
```

This follows existing project conventions:
- Services in `src/services/` for client-side logic
- API routes in `src/app/api/` for server-side/secrets-holding operations
- Existing proxy pattern in `src/app/api/[...pages]/route.ts` for backend, but AWS SDK calls need **dedicated routes** to avoid exposing credentials to the browser

---

## Step-by-Step Plan

### Step 1 — Environment Variables

Add to `.env.local`:

```env
AWS_REGION=us-east-1
AI_AGENT_S3_BUCKET=your-bucket-name
AI_AGENT_DYNAMO_TABLE=your-table-name
```

AWS credentials should come from **IAM role** (if deployed) or `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (local dev only).

---

### Step 2 — New API Routes (Server Side)

**`src/app/api/ai-agent/submit/route.ts`**
- Method: `POST`
- Accepts: `{ eraDto, dln }`
- Action: Uses AWS SDK v3 `@aws-sdk/client-s3` to `PutObject` with key `{dln}.json`
- Returns: `{ submitted: true, dln }`

**`src/app/api/ai-agent/recommendations/route.ts`**
- Method: `GET`
- Accepts: `?dln={dln}` query param
- Action: Uses AWS SDK v3 `@aws-sdk/lib-dynamodb` to `GetItem` with key `{ dln }`
- Returns: `{ recommendations: FieldChange[] | null }` — null means agent hasn't responded yet

---

### Step 3 — New Service: `src/services/aiAgentService.ts`

```ts
submitWorkRecord(eraDto: Record<string, any>, dln: string): Promise<void>
pollForRecommendations(
  dln: string,
  options?: { intervalMs?: number; timeoutMs?: number }
): Promise<FieldChange[]>
```

- `submitWorkRecord` → calls `/api/ai-agent/submit`
- `pollForRecommendations` → polls `/api/ai-agent/recommendations?dln=xxx` with configurable interval (default 3s) and timeout (default 60s), resolves when DynamoDB returns a non-null result

---

### Step 4 — DynamoDB Response Mapping

The agent recommendations stored in DynamoDB need to be mapped to the existing `FieldChange[]` format. The mapping function lives in `aiAgentService.ts`.

Expected DynamoDB item structure (agreed with AWS team):

```json
{
  "dln": "string",
  "recommendations": [
    {
      "field": "taxPrd",
      "currentValue": "202411",
      "proposedValue": "202412",
      "confidenceScore": 0.95
    }
  ],
  "status": "COMPLETE | PENDING | ERROR"
}
```

---

### Step 5 — Update `AIAssistantDialog.tsx`

Replace the `useEffect` that calls `simulateAgentResponse("analyze all")` with the real flow:

```ts
// 1. Submit
await aiAgentService.submitWorkRecord(formData, dln);
// status message: "Submitted to AI agent, waiting for analysis..."

// 2. Poll
const changes = await aiAgentService.pollForRecommendations(dln);

// 3. setFieldChanges(changes) — existing UI stays unchanged
```

The `simulateAgentResponse`, `simulatePlanResponse`, and `simulateRework` functions can remain temporarily for the **chat/Q&A** flow, but the **auto-analysis on open** and the **Rework** button will switch to the real API.

---

### Step 6 — Error & Loading States in Dialog

New states to add to `AIAssistantDialog`:
- `agentStatus: 'idle' | 'submitting' | 'waiting' | 'timeout' | 'error'`
- Drives the loading message text:
  - `"Submitting to AI agent..."`
  - `"Waiting for analysis..."`
  - `"Analysis complete"`
- Timeout message after 60s: `"Agent analysis timed out. Try again or use manual mode."`

---

## New File Summary

| File | Action | Purpose |
|---|---|---|
| `src/app/api/ai-agent/submit/route.ts` | **Create** | S3 PutObject server route |
| `src/app/api/ai-agent/recommendations/route.ts` | **Create** | DynamoDB GetItem polling route |
| `src/services/aiAgentService.ts` | **Create** | Client-facing service (submit + poll) |
| `src/components/AIAssistantDialog.tsx` | **Modify** | Replace simulation with service calls |
| `.env.local` | **Modify** | Add AWS env vars |

---

## Package to Add

```
@aws-sdk/client-s3
@aws-sdk/client-dynamodb
@aws-sdk/lib-dynamodb
```

---

## Key Questions to Confirm Before Implementation

1. **DynamoDB item structure**: What exact shape does the Strands agent write? Specifically the field names and the `recommendations` array schema.
2. **S3 key format**: Is `{dln}.json` the agreed key, or is there a prefix like `input/{dln}.json`?
3. **Auth for AWS**: IAM role (ECS/Lambda) or explicit keys for local dev?
4. **Rework flow**: Does clicking "Rework" re-submit to S3 (triggering a new agent run), or hit a separate endpoint?
