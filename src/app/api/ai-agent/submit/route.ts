import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);

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

    const region = process.env.AWS_REGION || 'us-east-1';
    const key = `input/${dln}.json`;
    const tmpFile = join(tmpdir(), `era-agent-${dln}.json`);

    await writeFile(tmpFile, JSON.stringify(eraDto));

    try {
      await execFileAsync('aws', [
        's3', 'cp', tmpFile,
        `s3://${bucket}/${key}`,
        '--region', region,
        '--content-type', 'application/json',
        '--no-verify-ssl',
      ]);
    } finally {
      await unlink(tmpFile).catch(() => {});
    }

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
