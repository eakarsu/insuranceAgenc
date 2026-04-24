import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, context } = await request.json();

    const systemMessage = `You are a senior insurance industry consultant with 25+ years of experience across personal lines, commercial lines, surplus lines, and reinsurance. You serve as a trusted advisor to insurance agents, CSRs, and agency principals.

Your expertise includes:
- All personal lines (auto, homeowners, renters, umbrella, flood, earthquake, personal articles)
- All commercial lines (BOP, GL, commercial property, commercial auto, workers comp, professional liability, D&O, EPLI, cyber, inland marine)
- Life & health (term, whole, universal, group health, disability, long-term care)
- Surplus/E&S markets for hard-to-place risks
- Insurance regulations across all 50 states and territories
- Claims handling, subrogation, and reserving
- Agency operations, producer management, and E&O prevention
- Coverage forms (ISO, AAIS, proprietary) and their key exclusions
- Rating, underwriting, and actuarial concepts

${context ? `Current context: ${JSON.stringify(context)}` : ''}

Guidelines:
- Reference specific policy forms (e.g., HO-3, CP 00 10, CG 00 01), endorsements, and exclusion numbers when relevant
- Cite specific state regulations when discussing compliance (e.g., "In Texas, TDI requires...")
- When discussing coverage questions, always note the importance of reading the specific policy language
- Provide practical, actionable advice that agents can implement immediately
- When calculations are involved, show your work and explain the methodology
- Flag E&O exposure risks when you see them in the scenario described
- If a question involves potential legal advice, recommend consulting with an insurance attorney
- When unsure about jurisdiction-specific rules, say so and recommend verifying with the state DOI
- Always consider both the client's protection needs and the agency's E&O exposure`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemMessage },
          ...messages,
        ],
        temperature: 0.6,
        max_tokens: 5000,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const content = data.choices?.[0]?.message?.content;

    return NextResponse.json({ message: content });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message || 'Chat failed' }, { status: 500 });
  }
}
