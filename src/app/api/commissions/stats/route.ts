import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const year = Number(request.nextUrl.searchParams.get('year') || new Date().getFullYear());
    if (!Number.isSafeInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'year must be an integer between 2000 and 2100' }, { status: 422 });
    }
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);
    const priorStart = new Date(year - 1, 0, 1);

    const [earned, pending, paid, priorEarned, commissionRows, typeGroups] = await Promise.all([
      prisma.commission.aggregate({
        _sum: { amount: true },
        where: { earnedDate: { gte: startDate, lt: endDate } },
      }),
      prisma.commission.aggregate({
        _sum: { amount: true },
        where: { status: 'PENDING' },
      }),
      prisma.commission.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID', paidDate: { gte: startDate, lt: endDate } },
      }),
      prisma.commission.aggregate({
        _sum: { amount: true },
        where: { earnedDate: { gte: priorStart, lt: startDate } },
      }),
      prisma.commission.findMany({
        where: { earnedDate: { gte: startDate, lt: endDate } },
        select: { earnedDate: true, amount: true, type: true },
      }),
      prisma.commission.groupBy({
        by: ['type'],
        _sum: { amount: true },
        where: { earnedDate: { gte: startDate, lt: endDate } },
      }),
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((month, i) => ({
      month,
      newBusiness: commissionRows
        .filter((commission) => commission.type === 'NEW_BUSINESS' && commission.earnedDate?.getMonth() === i)
        .reduce((sum, commission) => sum + Number(commission.amount), 0),
      renewal: commissionRows
        .filter((commission) => commission.type === 'RENEWAL' && commission.earnedDate?.getMonth() === i)
        .reduce((sum, commission) => sum + Number(commission.amount), 0),
    }));

    const byType = typeGroups.map((group) => ({
      name: group.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()),
      value: Number(group._sum.amount) || 0,
    }));
    const currentTotal = Number(earned._sum.amount) || 0;
    const priorTotal = Number(priorEarned._sum.amount) || 0;
    const growth = priorTotal > 0 ? Math.round(((currentTotal - priorTotal) / priorTotal) * 1000) / 10 : 0;

    return NextResponse.json({
      totalEarned: currentTotal,
      pending: Number(pending._sum.amount) || 0,
      paid: Number(paid._sum.amount) || 0,
      growth,
      monthlyData,
      byType,
    });
  } catch (error) {
    console.error('Commission stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
