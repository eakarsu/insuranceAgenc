// Multimodal claims fraud detector (text + photos + patterns).
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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!openai) return NextResponse.json({ error: 'AI not configured' }, { status: 503 });

  const { claim, photoUrls = [] } = await req.json();
  if (!claim) return NextResponse.json({ error: 'claim required' }, { status: 400 });

  const photoEval: any[] = [];
  for (const url of photoUrls.slice(0, 4)) {
    const r = await openai.chat.completions.create({
      model: VISION,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Inspect for fraud signs (pre-existing damage, staged photo, EXIF mismatch). Return JSON {"suspicion":0-1,"reasons":[string]}.' },
          { type: 'image_url', image_url: { url } }
        ] as any
      }],
      max_tokens: 400
    });
    try { photoEval.push(JSON.parse(r.choices[0].message.content!.match(/\{[\s\S]*\}/)![0])); }
    catch { photoEval.push({ raw: r.choices[0].message.content }); }
  }

  const textEval = await openai.chat.completions.create({
    model: VISION,
    messages: [
      { role: 'system', content: 'Return JSON {"suspicion":0-1,"signals":[string],"recommended_action":"approve|investigate|deny"}.' },
      { role: 'user', content: JSON.stringify(claim).slice(0, 6000) }
    ],
    max_tokens: 500
  });
  let tParsed: any;
  try { tParsed = JSON.parse(textEval.choices[0].message.content!.match(/\{[\s\S]*\}/)![0]); }
  catch { tParsed = { raw: textEval.choices[0].message.content }; }

  const photoAvg = photoEval.filter((p: any) => typeof p.suspicion === 'number')
    .reduce((s, p) => s + p.suspicion, 0) / Math.max(1, photoEval.length);
  const overall = ((tParsed.suspicion || 0) * 0.6 + (photoAvg || 0) * 0.4);
  return NextResponse.json({
    overallSuspicion: Number(overall.toFixed(2)),
    textEvaluation: tParsed,
    photoEvaluations: photoEval,
    recommendation: overall > 0.6 ? 'investigate' : overall > 0.3 ? 'monitor' : 'approve'
  });
}
