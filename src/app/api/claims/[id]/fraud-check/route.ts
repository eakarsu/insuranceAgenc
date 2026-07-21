import { NextResponse } from 'next/server';

function retired() {
  return NextResponse.json(
    { error: 'Legacy claim fraud mutation is retired; use SUBMIT_FOR_REVIEW through the governed workflow', code: 'RETIRED_UNGROUNDED_BEHAVIOR' },
    { status: 410 },
  );
}

export async function GET() {
  return retired();
}

export async function POST() {
  return retired();
}
