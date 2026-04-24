import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret');

/**
 * GDPR: Request data deletion with compliance tracking.
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const clientId = payload.clientId as string;

    const body = await request.json();
    const reason = body.reason || 'Customer requested data deletion';

    // Check for active policies — can't delete if active policies exist
    const activePolicies = await prisma.policy.count({
      where: { clientId, status: 'ACTIVE' },
    });

    if (activePolicies > 0) {
      return NextResponse.json({
        error: 'Cannot process deletion request: active policies exist. Please cancel all policies first.',
        activePolicies,
      }, { status: 400 });
    }

    // Create compliance tracking record
    const complianceRule = await prisma.complianceRule.findFirst({
      where: { name: { contains: 'Record Retention' } },
    });

    if (complianceRule) {
      await prisma.complianceCheck.create({
        data: {
          ruleId: complianceRule.id,
          status: 'PENDING',
          notes: `Data deletion requested by client ${clientId}. Reason: ${reason}. Requires manual review.`,
          checkedBy: 'SYSTEM',
        },
      });
    }

    // Log the request as an activity
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (adminUser) {
      await prisma.activity.create({
        data: {
          type: 'CLIENT_UPDATED',
          title: 'Data Deletion Requested',
          description: `Client ${clientId} requested data deletion. Reason: ${reason}`,
          userId: adminUser.id,
          clientId,
        },
      });
    }

    // Mark client as INACTIVE (soft delete approach for compliance)
    await prisma.client.update({
      where: { id: clientId },
      data: { status: 'INACTIVE', notes: `[DELETION REQUESTED] ${reason}` },
    });

    // Deactivate customer portal access
    await prisma.customerAuth.updateMany({
      where: { clientId },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Data deletion request has been submitted. Your data will be reviewed and processed within 30 days per our retention policy.',
      requestId: `DEL-${Date.now()}`,
    });
  } catch (error) {
    console.error('Data deletion error:', error);
    return NextResponse.json({ error: 'Failed to process deletion request' }, { status: 500 });
  }
}
