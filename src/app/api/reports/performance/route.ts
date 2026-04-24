import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getCached, setCache, cacheKeys } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cached = await getCached(cacheKeys.reportPerformance);
    if (cached) return NextResponse.json(cached);

    // Get all agents
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
      select: { id: true, name: true },
    });

    // Calculate the start of the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Build performance data for each agent
    const agentPerformance = await Promise.all(
      agents.map(async (agent) => {
        const [totalClaims, closedClaims, claimsThisMonth] = await Promise.all([
          // Total claims assigned to this agent
          prisma.claim.count({
            where: { agentId: agent.id },
          }),

          // Closed claims (CLOSED or SETTLED)
          prisma.claim.count({
            where: {
              agentId: agent.id,
              status: { in: ['CLOSED', 'SETTLED'] },
            },
          }),

          // Claims processed this month
          prisma.claim.count({
            where: {
              agentId: agent.id,
              createdAt: { gte: startOfMonth },
            },
          }),
        ]);

        const completionRate = totalClaims > 0
          ? Math.round((closedClaims / totalClaims) * 100 * 100) / 100
          : 0;

        return {
          agentId: agent.id,
          agentName: agent.name,
          totalClaims,
          closedClaims,
          completionRate,
          claimsThisMonth,
        };
      })
    );

    const result = { agentPerformance };
    await setCache(cacheKeys.reportPerformance, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Performance report GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch performance metrics' }, { status: 500 });
  }
}
