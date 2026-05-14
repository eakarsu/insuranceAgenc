// Underwriting automation agent (approve/decline/rate + human review).
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';

const hasKey = !!process.env.OPENROUTER_API_KEY;
const openai = hasKey ? new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
}) : null;
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

const decisions = new Map<string, any>();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { action } = body;

  if (action === 'decision') {
    if (!openai) return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
    const { application } = body;
    if (!application) return NextResponse.json({ error: 'application required' }, { status: 400 });
    const r = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'Underwriting agent. Return JSON {"decision":"approve|decline|refer","ratedPremiumUSD":number,"explanation":string,"factors":[string],"needs_human_review":bool}.' },
        { role: 'user', content: JSON.stringify(application).slice(0, 6000) }
      ],
      max_tokens: 800,
      temperature: 0.2
    });
    let parsed: any;
    try { parsed = JSON.parse(r.choices[0].message.content!.match(/\{[\s\S]*\}/)![0]); } catch { parsed = { raw: r.choices[0].message.content }; }
    const id = `uw_${Date.now()}`;
    decisions.set(id, { id, application, decision: parsed, at: new Date(), reviewed: false });
    return NextResponse.json({ id, ...parsed });
  }

  if (action === 'human-review') {
    const { id, override, reviewer } = body;
    const rec = decisions.get(id);
    if (!rec) return NextResponse.json({ error: 'decision not found' }, { status: 404 });
    rec.reviewed = true;
    rec.override = override;
    rec.reviewer = reviewer;
    return NextResponse.json(rec);
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ count: decisions.size, recent: [...decisions.values()].slice(-50) });
}
