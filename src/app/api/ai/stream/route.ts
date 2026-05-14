/**
 * POST /api/ai/stream
 *
 * Streaming SSE variant of the main AI endpoint (/api/ai).
 * Supports all 16 feature types (quote_generator, coverage_analyzer,
 * risk_assessor, renewal_predictor, etc.) with token-by-token streaming
 * via OpenRouter to prevent Vercel's 10s timeout on long AI tasks.
 *
 * Request body: same as /api/ai — { type, prompt, context, imageData? }
 *
 * Response format (text/event-stream):
 *   event: start    — { type, model } metadata
 *   event: token    — { token: string }
 *   event: done     — { text: string, parsed: object | null }
 *   event: error    — { message: string }
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiRateLimiter, SYSTEM_PROMPTS, TEMPERATURE_MAP, parseAIJson } from '@/lib/ai-helpers';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
const VISION_MODEL = process.env.OPENROUTER_VISION_MODEL || OPENROUTER_MODEL;

// Use shared registries
const temperatureMap = TEMPERATURE_MAP;

function encodeSSE(event: string, data: unknown): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function tryParseJson(raw: string): unknown | null {
  // Delegate to shared 3-strategy parser; return null on failure to preserve old behaviour.
  try {
    return parseAIJson(raw);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const userKey = (session.user as any)?.id || (session.user as any)?.email || 'anon';
  const limit = aiRateLimiter(userKey);
  if (!limit.allowed) {
    return new Response(
      JSON.stringify({ error: 'AI rate limit exceeded', resetAt: new Date(limit.resetAt).toISOString() }),
      { status: 429 }
    );
  }

  if (!OPENROUTER_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'OPENROUTER_API_KEY not configured' }),
      { status: 503 }
    );
  }

  const { type, prompt, context, imageData } = await request.json();
  const systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.coverage_analyzer;
  const temperature = temperatureMap[type] ?? 0.4;
  const model = imageData && type === 'document_processor' ? VISION_MODEL : OPENROUTER_MODEL;

  let messages: unknown[];
  if (imageData && type === 'document_processor') {
    messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageData } },
          { type: 'text', text: prompt || 'Analyze this insurance document.' },
        ],
      },
    ];
  } else {
    messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${prompt}\n\nContext: ${JSON.stringify(context)}` },
    ];
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encodeSSE('start', { type, model }));

        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
          },
          body: JSON.stringify({ model, messages, temperature, max_tokens: 5000, stream: true }),
        });

        if (!aiResponse.ok || !aiResponse.body) {
          const errText = await aiResponse.text();
          controller.enqueue(encodeSSE('error', { message: `OpenRouter error: ${errText}` }));
          controller.close();
          return;
        }

        const reader = aiResponse.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
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
              // Skip malformed SSE chunks
            }
          }
        }

        controller.enqueue(encodeSSE('done', {
          text: fullText,
          parsed: tryParseJson(fullText),
        }));
        controller.close();
      } catch (err: any) {
        console.error('[ai/stream] Error:', err);
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
