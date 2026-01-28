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

    // Generate mock premium trend data (in production, aggregate from actual data)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const premiumTrend = months.slice(0, currentMonth + 1).map((month, index) => ({
      month,
      premium: 50000 + Math.random() * 30000,
      newBusiness: 10000 + Math.random() * 15000,
    }));

    return NextResponse.json({
      policyDistribution,
      premiumTrend,
    });
  } catch (error) {
    console.error('Charts error:', error);
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
  }
}
