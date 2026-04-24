import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCustomerFromCookie } from '@/lib/customer-auth';

export async function GET(request: NextRequest) {
  try {
    const customer = await getCustomerFromCookie();
    if (!customer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const claims = await prisma.claim.findMany({
      where: { clientId: customer.clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            lineOfBusiness: true,
          },
        },
      },
    });

    return NextResponse.json({ claims });
  } catch (error) {
    console.error('Customer claims GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch claims' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const customer = await getCustomerFromCookie();
    if (!customer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { policyId, type, dateOfLoss, description, lossLocation } = body;

    if (!policyId || !type || !dateOfLoss || !description) {
      return NextResponse.json({ error: 'policyId, type, dateOfLoss, and description are required' }, { status: 400 });
    }

    // Verify the policy belongs to this customer
    const policy = await prisma.policy.findFirst({
      where: {
        id: policyId,
        clientId: customer.clientId,
      },
    });

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    // Generate claim number
    const count = await prisma.claim.count();
    const claimNumber = `CLM-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const claim = await prisma.claim.create({
      data: {
        claimNumber,
        clientId: customer.clientId,
        policyId,
        agentId: policy.agentId,
        type,
        status: 'REPORTED',
        dateOfLoss: new Date(dateOfLoss),
        description,
        lossLocation: lossLocation || null,
      },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            lineOfBusiness: true,
          },
        },
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'CLAIM_REPORTED',
        title: 'Claim reported by customer',
        description: `Customer reported claim ${claimNumber}`,
        userId: policy.agentId,
        clientId: customer.clientId,
        claimId: claim.id,
        policyId,
      },
    });

    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    console.error('Customer claims POST error:', error);
    return NextResponse.json({ error: 'Failed to create claim' }, { status: 500 });
  }
}
