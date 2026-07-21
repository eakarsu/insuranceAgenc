import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCustomerFromAuthorizationHeader } from '@/lib/customer-auth';

export async function GET(request: NextRequest) {
  try {
    const customer = await getCustomerFromAuthorizationHeader(request.headers.get('authorization'));
    if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const clientId = customer.clientId;

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
