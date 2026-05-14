// ACORD form auto-ingest / auto-output.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';

const hasKey = !!process.env.OPENROUTER_API_KEY;
const openai = hasKey ? new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
}) : null;
const VISION = process.env.OPENROUTER_VISION_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

// Canonical ACORD field map (subset; expand as needed).
const ACORD_FIELDS_BY_FORM: Record<string, string[]> = {
  '25': ['certificateHolder', 'insured', 'policyNumber', 'effectiveDate', 'expirationDate', 'limits'],
  '125': ['applicant', 'producer', 'effectiveDate', 'business', 'mailingAddress', 'phone'],
  '140': ['property', 'buildingValue', 'contentsValue', 'occupancy', 'construction']
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!openai) return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
  const body = await req.json();
  const { action } = body;

  if (action === 'ingest') {
    const { imageUrl, formNumber = '25' } = body;
    if (!imageUrl) return NextResponse.json({ error: 'imageUrl required' }, { status: 400 });
    const fields = ACORD_FIELDS_BY_FORM[formNumber] || ACORD_FIELDS_BY_FORM['25'];
    const r = await openai.chat.completions.create({
      model: VISION,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `Extract these fields from this ACORD ${formNumber}: ${fields.join(', ')}. Return JSON.` },
          { type: 'image_url', image_url: { url: imageUrl } }
        ] as any
      }],
      max_tokens: 800
    });
    let parsed: any;
    try { parsed = JSON.parse(r.choices[0].message.content!.match(/\{[\s\S]*\}/)![0]); } catch { parsed = { raw: r.choices[0].message.content }; }
    return NextResponse.json({ formNumber, parsed });
  }

  if (action === 'render') {
    const { formNumber, data } = body;
    if (!formNumber || !data) return NextResponse.json({ error: 'formNumber and data required' }, { status: 400 });
    const r = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: `Render a plain-text ACORD ${formNumber} from the data. Use clear field labels.` },
        { role: 'user', content: JSON.stringify(data) }
      ],
      max_tokens: 1500
    });
    return NextResponse.json({ formNumber, text: r.choices[0]?.message?.content });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
