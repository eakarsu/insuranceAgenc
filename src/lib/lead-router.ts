import prisma from './prisma';

/**
 * Round-robin / capacity-based auto-assignment of new clients to agents.
 * Assigns to the active agent with the fewest current clients.
 */
export async function autoAssignAgent(): Promise<string> {
  const agents = await prisma.user.findMany({
    where: { role: 'AGENT', isActive: true },
    select: { id: true, name: true },
  });

  if (agents.length === 0) {
    // Fallback to any active user
    const fallback = await prisma.user.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    if (!fallback) throw new Error('No active agents available');
    return fallback.id;
  }

  // Get client counts per agent
  const agentCounts = await Promise.all(
    agents.map(async (agent) => {
      const count = await prisma.client.count({
        where: { agentId: agent.id, status: { in: ['ACTIVE', 'PROSPECT'] } },
      });
      return { id: agent.id, count };
    })
  );

  // Sort by fewest clients (round-robin via capacity)
  agentCounts.sort((a, b) => a.count - b.count);

  return agentCounts[0].id;
}
