import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eraDto, dln } = body;

    if (!dln) {
      return NextResponse.json({ message: 'DLN is required' }, { status: 400 });
    }

    if (!eraDto) {
      return NextResponse.json({ message: 'eraDto payload is required' }, { status: 400 });
    }

    const bucket = process.env.AI_AGENT_S3_BUCKET;
    if (!bucket) {
      return NextResponse.json(
        { message: 'AI agent S3 bucket not configured (AI_AGENT_S3_BUCKET)' },
        { status: 500 }
      );
    }

    const key = `input/${dln}.json`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(eraDto),
        ContentType: 'application/json',
      })
    );

    console.log(`AI agent: submitted work record for DLN ${dln} → s3://${bucket}/${key}`);

    return NextResponse.json({ submitted: true, dln, key });
  } catch (error) {
    console.error('AI agent submit error:', error);
    return NextResponse.json(
      { message: 'Failed to submit work record to AI agent' },
      { status: 500 }
    );
  }
}
