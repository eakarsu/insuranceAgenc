import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || '';
    const state = searchParams.get('state') || '';
    const severity = searchParams.get('severity') || '';
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (category) where.category = category;
    if (state) where.state = state;
    if (severity) where.severity = severity;
    if (isActive !== null && isActive !== '') where.isActive = isActive === 'true';

    const rules = await prisma.complianceRule.findMany({
      where,
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { checks: true } },
      },
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('ComplianceRules GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch compliance rules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, category, state, lineOfBusiness, requirement, frequency, dueDate, severity } = body;

    if (!name || !category || !requirement) {
      return NextResponse.json({ error: 'Missing required fields: name, category, requirement' }, { status: 400 });
    }

    const rule = await prisma.complianceRule.create({
      data: {
        name,
        description: description || null,
        category,
        state: state || null,
        lineOfBusiness: lineOfBusiness || null,
        requirement,
        frequency: frequency || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        severity: severity || 'MEDIUM',
        isActive: true,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('ComplianceRules POST error:', error);
    return NextResponse.json({ error: 'Failed to create compliance rule' }, { status: 500 });
  }
}
