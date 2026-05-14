// Voice quote intake (call in, AI quotes in real time).
// TODO: configure credentials — TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN; ASR provider key.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type Session = { id: string; transcript: { role: 'user' | 'assistant'; text: string }[]; profile: any };
const sessions = new Map<string, Session>();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

async function ai(messages: any[], max = 400) {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: max, temperature: 0.4 })
  });
  const d = await r.json();
  return d.choices?.[0]?.message?.content || '';
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { action } = body;

  if (action === 'start') {
    const id = `vq_${Date.now()}`;
    sessions.set(id, { id, transcript: [], profile: {} });
    return NextResponse.json({ sessionId: id });
  }

  if (action === 'utterance') {
    if (!OPENROUTER_API_KEY) return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 503 });
    const s = sessions.get(body.sessionId);
    if (!s) return NextResponse.json({ error: 'session not found' }, { status: 404 });
    s.transcript.push({ role: 'user', text: body.text });
    const reply = await ai([
      { role: 'system', content: 'You are an insurance quote agent. Capture name, address, vehicle/property details, drivers, coverage. Reply concisely.' },
      ...s.transcript.slice(-8).map(t => ({ role: t.role, content: t.text }))
    ]);
    s.transcript.push({ role: 'assistant', text: reply });
    return NextResponse.json({ reply });
  }

  if (action === 'finalize') {
    const s = sessions.get(body.sessionId);
    if (!s) return NextResponse.json({ error: 'session not found' }, { status: 404 });
    if (!OPENROUTER_API_KEY) return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 503 });
    const t = s.transcript.map(x => `${x.role}: ${x.text}`).join('\n');
    const out = await ai([
      { role: 'system', content: 'Return JSON {"name":string,"address":string,"lineOfBusiness":"auto|home|life","details":object,"estimatedAnnualPremiumUSD":number}.' },
      { role: 'user', content: t }
    ]);
    let parsed: any;
    try { parsed = JSON.parse(out.match(/\{[\s\S]*\}/)![0]); } catch { parsed = { raw: out }; }
    s.profile = parsed;
    return NextResponse.json(parsed);
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
