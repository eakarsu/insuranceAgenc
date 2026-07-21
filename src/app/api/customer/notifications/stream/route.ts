import { NextRequest } from 'next/server';
import { addConnection, removeConnection } from '@/lib/sse-manager';
import { verifyCustomerToken } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Authenticate via JWT token in query params
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  let clientId: string;
  try {
    const customer = await verifyCustomerToken(token);
    if (!customer) throw new Error('Invalid customer token');
    clientId = customer.clientId;
  } catch {
    return new Response('Invalid token', { status: 401 });
  }

  const connectionId = `customer-${clientId}-${Date.now()}`;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`));

      addConnection(connectionId, controller, { clientId });

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(keepAlive);
        }
      }, 30000);

      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        removeConnection(connectionId);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
