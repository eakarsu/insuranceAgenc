const CANONICAL_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

interface OpenRouterPayload {
  id?: unknown;
  model?: unknown;
  choices?: Array<{ message?: { content?: unknown } }>;
}

export async function requestClaimOperationalReadiness(workflowSummary: string) {
  const baseUrl = (process.env.OPENROUTER_BASE_URL || CANONICAL_OPENROUTER_BASE_URL).replace(/\/$/, '');
  if (baseUrl !== CANONICAL_OPENROUTER_BASE_URL) throw new Error('OPENROUTER_BASE_URL must use the canonical OpenRouter API endpoint');
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const model = process.env.OPENROUTER_MODEL?.trim();
  if (!apiKey || !model) throw new Error('OpenRouter credentials and model must be configured');

  const response = await fetch(`${CANONICAL_OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://127.0.0.1',
      'X-Title': 'Insurance Claim Operations Readiness',
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'You review insurance claim operations only. Never decide coverage, liability, fraud, reserves, or payment. Give concise controls and do not invent evidence.',
        },
        {
          role: 'user',
          content: `Review this de-identified claim workflow: ${workflowSummary}. Return exactly three short controls covering authorization, evidence provenance, and licensed-adjuster review.`,
        },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  const payload = await response.json().catch(() => null) as OpenRouterPayload | null;
  if (!response.ok) throw new Error(`OpenRouter request failed with status ${response.status}`);
  const requestId = typeof payload?.id === 'string' ? payload.id.trim() : '';
  const providerModel = typeof payload?.model === 'string' ? payload.model.trim() : '';
  const result = typeof payload?.choices?.[0]?.message?.content === 'string' ? payload.choices[0].message.content.trim() : '';
  if (!requestId || !providerModel || result.length < 40) throw new Error('OpenRouter response did not include substantive provider evidence');
  return {
    result,
    providerReceipt: { provider: 'openrouter' as const, requestId, model: providerModel, completedAt: new Date().toISOString() },
  };
}
