import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Ungrounded document extraction is retired; ingest verified evidence through the governed claim workflow', code: 'RETIRED_UNGROUNDED_AI' }, { status: 410 });
}
