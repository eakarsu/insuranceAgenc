import { requestClaimOperationalReadiness } from '@/lib/openrouter-evidence';

describe('OpenRouter provider evidence', () => {
  const originalFetch = global.fetch;

  afterEach(() => { global.fetch = originalFetch; });

  it('requires substantive content and a provider receipt', async () => {
    process.env.OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.OPENROUTER_MODEL = 'test-model';
    global.fetch = jest.fn(async (_input, init) => {
      expect(JSON.stringify(init?.headers)).toContain('Bearer test-key');
      return new Response(JSON.stringify({
        id: 'generation-123', model: 'provider/test-model',
        choices: [{ message: { content: 'Verify authorization; retain evidence provenance; require licensed-adjuster review.' } }],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;
    const evidence = await requestClaimOperationalReadiness('De-identified intake and adjuster handoff workflow');
    expect(evidence.providerReceipt.requestId).toBe('generation-123');
    expect(evidence.result).toContain('evidence provenance');
  });

  it('rejects a noncanonical base URL', async () => {
    process.env.OPENROUTER_BASE_URL = 'https://example.invalid/api/v1';
    await expect(requestClaimOperationalReadiness('De-identified intake and adjuster handoff workflow')).rejects.toThrow('canonical OpenRouter API endpoint');
  });
});
