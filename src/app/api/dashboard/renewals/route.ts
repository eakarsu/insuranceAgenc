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
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const renewals = await prisma.policy.findMany({
      where: {
        status: 'ACTIVE',
        expirationDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      take: 10,
      orderBy: { expirationDate: 'asc' },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
        carrier: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(renewals);
  } catch (error) {
    console.error('Renewals error:', error);
    return NextResponse.json({ error: 'Failed to fetch renewals' }, { status: 500 });
  }
}
