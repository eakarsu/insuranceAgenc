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
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get client stats
    const totalClients = await prisma.client.count();
    const clientsLastMonth = await prisma.client.count({
      where: { createdAt: { lt: thisMonth } },
    });
    const clientChange = clientsLastMonth > 0
      ? Math.round(((totalClients - clientsLastMonth) / clientsLastMonth) * 100)
      : 0;

    // Get policy stats
    const totalPolicies = await prisma.policy.count();
    const activePolicies = await prisma.policy.count({
      where: { status: 'ACTIVE' },
    });
    const policiesLastMonth = await prisma.policy.count({
      where: { createdAt: { lt: thisMonth } },
    });
    const policyChange = policiesLastMonth > 0
      ? Math.round(((totalPolicies - policiesLastMonth) / policiesLastMonth) * 100)
      : 0;

    // Get quote stats
    const totalQuotes = await prisma.quote.count();
    const pendingQuotes = await prisma.quote.count({
      where: { status: { in: ['DRAFT', 'QUOTED', 'PROPOSED'] } },
    });
    const quotesLastMonth = await prisma.quote.count({
      where: { createdAt: { lt: thisMonth } },
    });
    const quoteChange = quotesLastMonth > 0
      ? Math.round(((totalQuotes - quotesLastMonth) / quotesLastMonth) * 100)
      : 0;

    // Get claim stats
    const totalClaims = await prisma.claim.count();
    const openClaims = await prisma.claim.count({
      where: { status: { in: ['REPORTED', 'UNDER_INVESTIGATION', 'PENDING_DOCUMENTS', 'IN_REVIEW'] } },
    });
    const claimsLastMonth = await prisma.claim.count({
      where: { createdAt: { lt: thisMonth } },
    });
    const claimChange = claimsLastMonth > 0
      ? Math.round(((totalClaims - claimsLastMonth) / claimsLastMonth) * 100)
      : 0;

    // Get premium stats
    const premiumResult = await prisma.policy.aggregate({
      _sum: { premium: true },
      where: { status: 'ACTIVE' },
    });
    const totalPremium = Number(premiumResult._sum.premium) || 0;

    // Get commission stats
    const commissionResult = await prisma.commission.aggregate({
      _sum: { amount: true },
    });
    const pendingCommissionResult = await prisma.commission.aggregate({
      _sum: { amount: true },
      where: { status: 'PENDING' },
    });
    const totalCommissions = Number(commissionResult._sum.amount) || 0;
    const pendingCommissions = Number(pendingCommissionResult._sum.amount) || 0;

    return NextResponse.json({
      clients: { total: totalClients, change: clientChange },
      policies: { total: totalPolicies, active: activePolicies, change: policyChange },
      quotes: { total: totalQuotes, pending: pendingQuotes, change: quoteChange },
      claims: { total: totalClaims, open: openClaims, change: claimChange },
      commissions: { total: totalCommissions, pending: pendingCommissions, change: 8 },
      premium: { total: totalPremium, change: 12 },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
