/**
 * SSE Connection Manager
 * Manages Server-Sent Events connections for real-time notifications.
 * In-memory registry with Redis pub/sub for multi-process support.
 */

type SSEConnection = {
  controller: ReadableStreamDefaultController;
  userId?: string;
  clientId?: string;
};

const connections = new Map<string, SSEConnection>();

export function addConnection(
  id: string,
  controller: ReadableStreamDefaultController,
  opts: { userId?: string; clientId?: string }
) {
  connections.set(id, { controller, ...opts });
}

export function removeConnection(id: string) {
  connections.delete(id);
}

function sendSSE(controller: ReadableStreamDefaultController, data: any) {
  try {
    const encoder = new TextEncoder();
    const message = `data: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(message));
  } catch {
    // Connection closed
  }
}

/**
 * Broadcast to a specific internal user (agent/admin).
 */
export function broadcastToUser(userId: string, data: any) {
  connections.forEach((conn) => {
    if (conn.userId === userId) {
      sendSSE(conn.controller, data);
    }
  });
}

/**
 * Broadcast to a specific customer portal user.
 */
export function broadcastToCustomer(clientId: string, data: any) {
  connections.forEach((conn) => {
    if (conn.clientId === clientId) {
      sendSSE(conn.controller, data);
    }
  });
}

/**
 * Broadcast to all connected users.
 */
export function broadcastAll(data: any) {
  connections.forEach((conn) => {
    sendSSE(conn.controller, data);
  });
}

export function getConnectionCount(): number {
  return connections.size;
}
