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

    // Get policy distribution by line of business
    const policies = await prisma.policy.groupBy({
      by: ['lineOfBusiness'],
      _count: { id: true },
      where: { status: 'ACTIVE' },
    });

    const policyDistribution = policies.map((p) => ({
      name: p.lineOfBusiness.replace(/_/g, ' '),
      value: p._count.id,
    }));

    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
    const policyRows = await prisma.policy.findMany({
      where: {
        OR: [
          { effectiveDate: { gte: yearStart, lt: yearEnd } },
          { createdAt: { gte: yearStart, lt: yearEnd } },
        ],
      },
      select: { premium: true, effectiveDate: true, createdAt: true },
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const premiumTrend = months.slice(0, now.getMonth() + 1).map((month, index) => {
      const premium = policyRows
        .filter((policy) => policy.effectiveDate.getFullYear() === now.getFullYear() && policy.effectiveDate.getMonth() === index)
        .reduce((sum, policy) => sum + Number(policy.premium), 0);
      const newBusiness = policyRows
        .filter((policy) => policy.createdAt.getFullYear() === now.getFullYear() && policy.createdAt.getMonth() === index)
        .reduce((sum, policy) => sum + Number(policy.premium), 0);
      return { month, premium, newBusiness };
    });

    return NextResponse.json({
      policyDistribution,
      premiumTrend,
    });
  } catch (error) {
    console.error('Charts error:', error);
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
  }
}
