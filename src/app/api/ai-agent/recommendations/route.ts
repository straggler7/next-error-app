import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

export const dynamic = 'force-dynamic';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dln, taxPrd } = body;

    if (!dln) {
      return NextResponse.json({ message: 'DLN is required' }, { status: 400 });
    }

    if (!taxPrd) {
      return NextResponse.json({ message: 'taxPrd is required' }, { status: 400 });
    }

    const apiGatewayUrl = process.env.AI_AGENT_API_GATEWAY_URL;
    if (!apiGatewayUrl) {
      return NextResponse.json(
        { message: 'AI agent API Gateway URL not configured (AI_AGENT_API_GATEWAY_URL)' },
        { status: 500 }
      );
    }

    const response = await fetch(apiGatewayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dln, taxPrd }),
      // @ts-ignore — Node.js fetch accepts agent for SSL bypass (corporate proxy)
      agent: httpsAgent,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'API Gateway request failed' }));
      throw new Error(error.message || `API Gateway responded with ${response.status}`);
    }

    const data = await response.json();

    console.log(`AI agent: fetched recommendations for DLN ${dln} / taxPrd ${taxPrd}`);

    return NextResponse.json(data);
  } catch (error) {
    console.error('AI agent recommendations error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch recommendations from AI agent' },
      { status: 500 }
    );
  }
}
