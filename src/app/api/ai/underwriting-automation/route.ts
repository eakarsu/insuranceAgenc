import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Unvalidated underwriting automation is retired; use deterministic rating and governed review', code: 'RETIRED_UNGROUNDED_AI' }, { status: 410 });
}
