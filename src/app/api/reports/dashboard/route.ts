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

    const cached = await getCached(cacheKeys.reportDashboard);
    if (cached) return NextResponse.json(cached);

    const [
      totalClaims,
      openClaims,
      closedClaims,
      highRiskClaims,
      aiAnalyzedCount,
      claimsByType,
      claimsByStatus,
      lossAggregations,
    ] = await Promise.all([
      // Total claims
      prisma.claim.count(),

      // Open claims (active statuses)
      prisma.claim.count({
        where: {
          status: {
            in: ['REPORTED', 'UNDER_INVESTIGATION', 'PENDING_DOCUMENTS', 'IN_REVIEW', 'APPROVED', 'REOPENED'],
          },
        },
      }),

      // Closed claims
      prisma.claim.count({
        where: {
          status: { in: ['CLOSED', 'SETTLED', 'DENIED'] },
        },
      }),

      // High risk claims (aiRiskScore > 0.7)
      prisma.claim.count({
        where: {
          aiRiskScore: { gt: 0.7 },
        },
      }),

      // AI analyzed count (aiRiskScore is not null)
      prisma.claim.count({
        where: {
          aiRiskScore: { not: null },
        },
      }),

      // Claims grouped by type
      prisma.claim.groupBy({
        by: ['type'],
        _count: { id: true },
      }),

      // Claims grouped by status
      prisma.claim.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // Sum aggregations for estimated loss and paid amount
      prisma.claim.aggregate({
        _sum: {
          estimatedLoss: true,
          paidAmount: true,
        },
      }),
    ]);

    const result = {
      totalClaims,
      openClaims,
      closedClaims,
      highRiskClaims,
      aiAnalyzedCount,
      claimsByType: claimsByType.map((item) => ({
        type: item.type,
        count: item._count.id,
      })),
      claimsByStatus: claimsByStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
      totalEstimatedLoss: Number(lossAggregations._sum.estimatedLoss) || 0,
      totalPaidAmount: Number(lossAggregations._sum.paidAmount) || 0,
    };

    await setCache(cacheKeys.reportDashboard, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Reports dashboard GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}
