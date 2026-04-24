import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { claim: { claimNumber: { contains: search, mode: 'insensitive' } } },
        { type: { contains: search, mode: 'insensitive' } },
      ];
    }

    const settlements = await prisma.settlement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        claim: {
          select: {
            id: true,
            claimNumber: true,
            client: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Calculate stats
    const allSettlements = await prisma.settlement.findMany();
    const total = allSettlements.reduce((sum, s) => sum + Number(s.amount), 0);
    const paid = allSettlements.filter(s => s.paidDate).reduce((sum, s) => sum + Number(s.amount), 0);
    const pending = total - paid;

    return NextResponse.json({
      settlements: settlements.map(s => ({
        ...s,
        status: s.status || (s.paidDate ? 'PAID' : 'PENDING'),
      })),
      stats: { total, paid, pending },
    });
  } catch (error) {
    console.error('Settlements GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settlements' }, { status: 500 });
  }
}
