import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const policy = await prisma.policy.findUnique({
      where: { id },
      include: { client: true, carrier: true },
    });

    if (!policy) return NextResponse.json({ error: 'Policy not found' }, { status: 404 });

    // Create renewal quote
    const count = await prisma.quote.count();
    const quoteNumber = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const renewalQuote = await prisma.quote.create({
      data: {
        quoteNumber,
        status: 'QUOTED',
        lineOfBusiness: policy.lineOfBusiness,
        type: `${policy.type} - Renewal`,
        effectiveDate: policy.expirationDate,
        premium: policy.premium,
        totalPremium: policy.premium,
        clientId: policy.clientId,
        carrierId: policy.carrierId,
        agentId: session.user.id,
        isRenewal: true,
        renewalPolicyId: policy.id,
      },
      include: { client: { select: { firstName: true, lastName: true } } },
    });

    await prisma.activity.create({
      data: {
        type: 'POLICY_RENEWED',
        title: 'Renewal quote created',
        description: `Created renewal quote ${quoteNumber} for policy ${policy.policyNumber}`,
        userId: session.user.id,
        clientId: policy.clientId,
        policyId: policy.id,
        quoteId: renewalQuote.id,
      },
    });

    return NextResponse.json(renewalQuote, { status: 201 });
  } catch (error: any) {
    console.error('Policy renew error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
