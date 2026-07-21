export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

function validMailbox(value: string): boolean {
  return /^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/.test(value);
}

/** Deliver mail through the configured, authenticated provider adapter. */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
  const endpointValue = process.env.EMAIL_DELIVERY_ENDPOINT;
  const token = process.env.EMAIL_DELIVERY_TOKEN || '';
  const from = options.from || process.env.EMAIL_FROM || '';
  if (!endpointValue || token.length < 32 || !validMailbox(from)) {
    console.error('[Email] Delivery adapter is not configured');
    return { success: false };
  }
  if (!validMailbox(options.to) || !options.subject.trim() || options.subject.length > 200 || options.html.length > 1_000_000) {
    console.error('[Email] Message failed structural validation');
    return { success: false };
  }
  let endpoint: URL;
  try {
    endpoint = new URL(endpointValue);
  } catch {
    return { success: false };
  }
  if (process.env.NODE_ENV === 'production' && endpoint.protocol !== 'https:') return { success: false };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to: options.to, subject: options.subject, html: options.html, text: options.text }),
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) return { success: false };
    const body = await response.json() as { messageId?: unknown };
    return typeof body.messageId === 'string' ? { success: true, messageId: body.messageId } : { success: false };
  } catch {
    return { success: false };
  } finally {
    clearTimeout(timeout);
  }
}
