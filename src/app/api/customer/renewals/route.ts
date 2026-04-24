import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret');

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const clientId = payload.clientId as string;
    if (!clientId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // Find renewal quotes for this client
    const renewalQuotes = await prisma.quote.findMany({
      where: {
        clientId,
        isRenewal: true,
        status: { in: ['QUOTED', 'PROPOSED'] },
      },
      include: {
        carrier: { select: { name: true } },
      },
      orderBy: { effectiveDate: 'asc' },
    });

    // Also get policies nearing expiration
    const now = new Date();
    const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const expiringPolicies = await prisma.policy.findMany({
      where: {
        clientId,
        status: 'ACTIVE',
        expirationDate: { gte: now, lte: sixtyDays },
      },
      include: { carrier: { select: { name: true } } },
      orderBy: { expirationDate: 'asc' },
    });

    return NextResponse.json({ renewalQuotes, expiringPolicies });
  } catch (error) {
    console.error('Customer renewals error:', error);
    return NextResponse.json({ error: 'Failed to fetch renewals' }, { status: 500 });
  }
}
