/**
 * POST /api/underwriting/evaluate/stream
 *
 * Streaming SSE variant of the underwriting analysis endpoint.
 * Runs the deterministic rule-based evaluation first, then streams
 * an AI-generated narrative analysis token-by-token via OpenRouter.
 * Prevents Vercel's 10-second timeout for complex underwriting analysis.
 *
 * Response format:
 *   event: start      — decision summary payload (JSON)
 *   event: token      — streamed text chunk
 *   event: done       — final assembled text
 *   event: error      — error message
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { evaluateUnderwriting } from '@/lib/underwriting';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';

function encodeSSE(event: string, data: unknown): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json();
  const { quoteId } = body;

  if (!quoteId) {
    return new Response(JSON.stringify({ error: 'quoteId is required' }), { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Run the deterministic rule-based underwriting engine
        const decision = await evaluateUnderwriting(quoteId);

        // Emit the structured decision immediately so the UI can render it
        controller.enqueue(encodeSSE('start', {
          decision: decision.decision,
          riskScore: decision.riskScore,
          maxScore: decision.maxScore,
          factors: decision.factors,
        }));

        // Step 2: Stream AI narrative analysis via OpenRouter
        if (!OPENROUTER_API_KEY) {
          controller.enqueue(encodeSSE('done', {
            text: `Underwriting decision: ${decision.decision}. Risk score: ${decision.riskScore}/${decision.maxScore}. ${decision.factors.length} risk factors triggered.`,
          }));
          controller.close();
          return;
        }

        const factorSummary = decision.factors.length > 0
          ? decision.factors
              .map((f) => `- ${f.ruleName}: +${f.riskPoints} pts (${f.detail})`)
              .join('\n')
          : '- No risk factors triggered';

        const systemPrompt = `You are a senior insurance underwriter at InsureFlow. You explain underwriting decisions in clear, professional language suitable for both agents and clients. Be concise (3–5 sentences) but thorough.`;

        const userMessage = `Explain this underwriting result:

Decision: ${decision.decision}
Risk Score: ${decision.riskScore} / ${decision.maxScore}

Risk Factors Triggered:
${factorSummary}

Provide a professional narrative explaining why this decision was reached and what it means for the applicant. If REFERRED or DECLINED, suggest what the applicant could do to improve their insurability.`;

        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
          },
          body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            temperature: 0.3,
            max_tokens: 600,
            stream: true,
          }),
        });

        if (!aiResponse.ok || !aiResponse.body) {
          const errText = await aiResponse.text();
          console.error('[underwriting/stream] OpenRouter error:', errText);
          controller.enqueue(encodeSSE('done', {
            text: `Decision: ${decision.decision}. Risk score: ${decision.riskScore}/${decision.maxScore}.`,
          }));
          controller.close();
          return;
        }

        // Stream SSE tokens from OpenRouter to the client
        const reader = aiResponse.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') continue;

            try {
              const parsed = JSON.parse(payload);
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                fullText += token;
                controller.enqueue(encodeSSE('token', { token }));
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }

        controller.enqueue(encodeSSE('done', { text: fullText }));
        controller.close();
      } catch (err: any) {
        console.error('[underwriting/stream] Error:', err);
        controller.enqueue(encodeSSE('error', { message: err.message || 'Stream failed' }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
