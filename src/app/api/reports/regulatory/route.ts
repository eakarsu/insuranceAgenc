import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * Generate state-required regulatory reports:
 * - Premium volume by LOB
 * - Claims ratios
 * - Complaint ratios
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const year = parseInt(request.nextUrl.searchParams.get('year') || String(new Date().getFullYear()));
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    // Premium volume by LOB
    const policies = await prisma.policy.findMany({
      where: { effectiveDate: { gte: startDate, lt: endDate } },
      select: { lineOfBusiness: true, premium: true, status: true },
    });

    const premiumByLOB: Record<string, { count: number; totalPremium: number }> = {};
    for (const p of policies) {
      const lob = p.lineOfBusiness;
      if (!premiumByLOB[lob]) premiumByLOB[lob] = { count: 0, totalPremium: 0 };
      premiumByLOB[lob].count++;
      premiumByLOB[lob].totalPremium += Number(p.premium);
    }

    // Claims data
    const claims = await prisma.claim.findMany({
      where: { dateReported: { gte: startDate, lt: endDate } },
      select: { status: true, estimatedLoss: true, paidAmount: true },
    });

    const claimsStats = {
      total: claims.length,
      approved: claims.filter(c => c.status === 'APPROVED' || c.status === 'SETTLED').length,
      denied: claims.filter(c => c.status === 'DENIED').length,
      totalEstimatedLoss: claims.reduce((sum, c) => sum + Number(c.estimatedLoss || 0), 0),
      totalPaidAmount: claims.reduce((sum, c) => sum + Number(c.paidAmount || 0), 0),
    };

    // Loss ratio
    const totalPremium = Object.values(premiumByLOB).reduce((sum, lob) => sum + lob.totalPremium, 0);
    const lossRatio = totalPremium > 0 ? (claimsStats.totalPaidAmount / totalPremium * 100).toFixed(2) : '0';

    // Complaints
    const complaints = await prisma.complaint.count({
      where: { createdAt: { gte: startDate, lt: endDate } },
    });

    const complaintRatio = policies.length > 0
      ? (complaints / policies.length * 100).toFixed(2)
      : '0';

    return NextResponse.json({
      year,
      premiumVolume: premiumByLOB,
      totalPolicies: policies.length,
      totalPremium,
      claims: claimsStats,
      lossRatio: `${lossRatio}%`,
      complaints,
      complaintRatio: `${complaintRatio}%`,
    });
  } catch (error) {
    console.error('Regulatory report error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
