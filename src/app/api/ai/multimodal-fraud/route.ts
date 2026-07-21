import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Ungrounded fraud scoring is retired; review submission uses the typed fraud adapter', code: 'RETIRED_UNGROUNDED_AI' }, { status: 410 });
}
