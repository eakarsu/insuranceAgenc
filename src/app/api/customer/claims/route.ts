import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCustomerFromCookie } from '@/lib/customer-auth';
import { ClaimGovernanceError } from '@/lib/claims-governance-rules';
import { intakeClaim } from '@/lib/claims-governance';

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
    const { policyId, type, dateOfLoss, description, lossLocation, jurisdiction, estimatedLoss } = body;
    const externalEventId = request.headers.get('idempotency-key') || body.externalEventId;

    if (!externalEventId || !policyId || !type || !dateOfLoss || !description || !jurisdiction) {
      return NextResponse.json({ error: 'Idempotency-Key, policyId, type, dateOfLoss, description, and jurisdiction are required' }, { status: 400 });
    }

    const result = await intakeClaim({
      externalEventId,
      sourceSystem: 'CUSTOMER_PORTAL',
      sourceRecordId: externalEventId,
      clientId: customer.clientId,
      policyId,
      type,
      dateOfLoss,
      description,
      jurisdiction,
      lossLocation,
      estimatedLoss,
    }, {
      id: customer.sub,
      role: 'CUSTOMER',
      isActive: true,
      adjusterLicenseNumber: null,
      adjusterLicenseStates: [],
      adjusterLicenseExpiresAt: null,
    });

    return NextResponse.json({ ...result.claim, idempotent: result.idempotent }, { status: result.idempotent ? 200 : 201 });
  } catch (error) {
    console.error('Customer claims POST error:', error);
    if (error instanceof ClaimGovernanceError) {
      return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: error.status });
    }
    return NextResponse.json({ error: 'Failed to create claim' }, { status: 500 });
  }
}
