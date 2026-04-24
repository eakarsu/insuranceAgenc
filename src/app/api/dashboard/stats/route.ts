import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run ALL queries in parallel for maximum performance
    const [
      totalClients,
      clientsLastMonth,
      totalPolicies,
      activePolicies,
      policiesLastMonth,
      totalQuotes,
      pendingQuotes,
      quotesLastMonth,
      totalClaims,
      openClaims,
      claimsLastMonth,
      premiumResult,
      commissionResult,
      pendingCommissionResult,
      highRiskClaims,
      aiAnalyzedClaims,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { createdAt: { lt: thisMonth } } }),
      prisma.policy.count(),
      prisma.policy.count({ where: { status: 'ACTIVE' } }),
      prisma.policy.count({ where: { createdAt: { lt: thisMonth } } }),
      prisma.quote.count(),
      prisma.quote.count({ where: { status: { in: ['DRAFT', 'QUOTED', 'PROPOSED'] } } }),
      prisma.quote.count({ where: { createdAt: { lt: thisMonth } } }),
      prisma.claim.count(),
      prisma.claim.count({ where: { status: { in: ['REPORTED', 'UNDER_INVESTIGATION', 'PENDING_DOCUMENTS', 'IN_REVIEW'] } } }),
      prisma.claim.count({ where: { createdAt: { lt: thisMonth } } }),
      prisma.policy.aggregate({ _sum: { premium: true }, where: { status: 'ACTIVE' } }),
      prisma.commission.aggregate({ _sum: { amount: true } }),
      prisma.commission.aggregate({ _sum: { amount: true }, where: { status: 'PENDING' } }),
      prisma.claim.count({ where: { aiRiskScore: { gt: 0.7 } } }),
      prisma.claim.count({ where: { aiRiskScore: { not: null } } }),
    ]);

    const clientChange = clientsLastMonth > 0
      ? Math.round(((totalClients - clientsLastMonth) / clientsLastMonth) * 100)
      : 0;
    const policyChange = policiesLastMonth > 0
      ? Math.round(((totalPolicies - policiesLastMonth) / policiesLastMonth) * 100)
      : 0;
    const quoteChange = quotesLastMonth > 0
      ? Math.round(((totalQuotes - quotesLastMonth) / quotesLastMonth) * 100)
      : 0;
    const claimChange = claimsLastMonth > 0
      ? Math.round(((totalClaims - claimsLastMonth) / claimsLastMonth) * 100)
      : 0;
    const totalPremium = Number(premiumResult._sum.premium) || 0;
    const totalCommissions = Number(commissionResult._sum.amount) || 0;
    const pendingCommissions = Number(pendingCommissionResult._sum.amount) || 0;

    return NextResponse.json({
      clients: { total: totalClients, change: clientChange },
      policies: { total: totalPolicies, active: activePolicies, change: policyChange },
      quotes: { total: totalQuotes, pending: pendingQuotes, change: quoteChange },
      claims: { total: totalClaims, open: openClaims, change: claimChange },
      commissions: { total: totalCommissions, pending: pendingCommissions, change: 8 },
      premium: { total: totalPremium, change: 12 },
      aiMetrics: { highRiskClaims, aiAnalyzedClaims },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
