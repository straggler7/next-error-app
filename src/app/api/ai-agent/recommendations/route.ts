import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

export const dynamic = 'force-dynamic';

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const dln = searchParams.get('dln');

    if (!dln) {
      return NextResponse.json({ message: 'DLN is required' }, { status: 400 });
    }

    const table = process.env.AI_AGENT_DYNAMO_TABLE;
    if (!table) {
      return NextResponse.json(
        { message: 'AI agent DynamoDB table not configured (AI_AGENT_DYNAMO_TABLE)' },
        { status: 500 }
      );
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: table,
        Key: { dln },
      })
    );

    if (!result.Item) {
      return NextResponse.json({ recommendations: null, status: 'PENDING' });
    }

    const item = result.Item;

    if (item.status === 'ERROR') {
      return NextResponse.json({
        recommendations: null,
        status: 'ERROR',
        message: item.errorMessage || 'Agent processing failed',
      });
    }

    if (item.status !== 'COMPLETE') {
      return NextResponse.json({ recommendations: null, status: item.status || 'PENDING' });
    }

    return NextResponse.json({
      recommendations: item.recommendations || [],
      status: 'COMPLETE',
      analyzedAt: item.analyzedAt,
    });
  } catch (error) {
    console.error('AI agent recommendations error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch recommendations from AI agent' },
      { status: 500 }
    );
  }
}
