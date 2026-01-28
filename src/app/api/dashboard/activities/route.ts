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

    const activities = await prisma.activity.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
        policy: {
          select: { policyNumber: true },
        },
        quote: {
          select: { quoteNumber: true },
        },
        claim: {
          select: { claimNumber: true },
        },
      },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Activities error:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}
