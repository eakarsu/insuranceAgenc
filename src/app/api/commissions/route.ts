import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const year = searchParams.get('year') || '';
    const month = searchParams.get('month') || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { policy: { policyNumber: { contains: search, mode: 'insensitive' } } },
        { agent: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) where.status = status;
    if (type) where.type = type;

    // Filter by year/month based on earnedDate
    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 1);
      where.earnedDate = { gte: startDate, lt: endDate };
    } else if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year) + 1, 0, 1);
      where.earnedDate = { gte: startDate, lt: endDate };
    }

    const [commissions, total] = await Promise.all([
      prisma.commission.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          policy: {
            select: {
              id: true, policyNumber: true, lineOfBusiness: true,
              client: { select: { id: true, firstName: true, lastName: true, businessName: true } },
            },
          },
          agent: { select: { id: true, name: true } },
        },
      }),
      prisma.commission.count({ where }),
    ]);

    return NextResponse.json({
      commissions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Commissions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 });
  }
}

/**
 * Batch pay-out: mark multiple EARNED commissions as PAID.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { commissionIds, action } = body;

    if (action === 'batch-pay' && Array.isArray(commissionIds) && commissionIds.length > 0) {
      const result = await prisma.commission.updateMany({
        where: {
          id: { in: commissionIds },
          status: 'EARNED',
        },
        data: {
          status: 'PAID',
          paidDate: new Date(),
        },
      });

      return NextResponse.json({ success: true, paidCount: result.count });
    }

    if (action === 'process') {
      try {
        const { handleCommissionProcess } = await import('@/lib/jobs/commission-process');
        const result = await handleCommissionProcess();
        return NextResponse.json({ success: true, ...result });
      } catch (error) {
        console.error('Commission process error:', error);
        return NextResponse.json({ error: 'Failed to process commissions' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action. Use batch-pay or process.' }, { status: 400 });
  } catch (error) {
    console.error('Commissions POST error:', error);
    return NextResponse.json({ error: 'Failed to process commissions' }, { status: 500 });
  }
}
