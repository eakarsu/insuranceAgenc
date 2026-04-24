import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

function calculateNextDueDate(frequency: string | null): Date | null {
  if (!frequency) return null;
  const now = new Date();

  switch (frequency) {
    case 'MONTHLY':
      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    case 'QUARTERLY':
      return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
    case 'ANNUAL':
      return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    case 'ONCE':
      return null;
    case 'ON_EVENT':
      return null;
    default:
      return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (status) where.status = status;

    const [checks, total] = await Promise.all([
      prisma.complianceCheck.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          rule: true,
        },
      }),
      prisma.complianceCheck.count({ where }),
    ]);

    return NextResponse.json({
      checks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('ComplianceChecks GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch compliance checks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ruleId, notes, evidence, action } = body;

    // Manual compliance audit trigger
    if (action === 'run-audit') {
      try {
        const { handleComplianceAudit } = await import('@/lib/jobs/compliance-audit');
        const result = await handleComplianceAudit();
        return NextResponse.json({ success: true, ...result });
      } catch (error) {
        console.error('Manual compliance audit error:', error);
        return NextResponse.json({ error: 'Failed to run compliance audit' }, { status: 500 });
      }
    }

    if (!ruleId) {
      return NextResponse.json({ error: 'ruleId is required' }, { status: 400 });
    }

    const rule = await prisma.complianceRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      return NextResponse.json({ error: 'Compliance rule not found' }, { status: 404 });
    }

    const nextDueDate = calculateNextDueDate(rule.frequency);

    const check = await prisma.complianceCheck.create({
      data: {
        ruleId,
        status: 'COMPLIANT',
        checkedAt: new Date(),
        checkedBy: session.user.name || session.user.id,
        notes: notes || null,
        evidence: evidence || null,
        nextDueDate,
      },
      include: {
        rule: true,
      },
    });

    return NextResponse.json(check, { status: 201 });
  } catch (error) {
    console.error('ComplianceChecks POST error:', error);
    return NextResponse.json({ error: 'Failed to create compliance check' }, { status: 500 });
  }
}
