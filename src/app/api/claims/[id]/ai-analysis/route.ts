import { NextResponse } from 'next/server';

function retired() {
  return NextResponse.json(
    { error: 'Ungrounded claim AI analysis is retired; use recorded evidence and the governed workflow', code: 'RETIRED_UNGROUNDED_BEHAVIOR' },
    { status: 410 },
  );
}

export async function GET() {
  return retired();
}

export async function POST() {
  return retired();
}
