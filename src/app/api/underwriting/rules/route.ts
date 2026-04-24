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
    const lineOfBusiness = searchParams.get('lineOfBusiness') || '';
    const isActive = searchParams.get('isActive');
    const category = searchParams.get('category') || '';

    const where: any = {};
    if (lineOfBusiness) where.lineOfBusiness = lineOfBusiness;
    if (isActive !== null && isActive !== '') where.isActive = isActive === 'true';
    if (category) where.category = category;

    const rules = await prisma.underwritingRule.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('UnderwritingRules GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch underwriting rules' }, { status: 500 });
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
    const { name, description, lineOfBusiness, category, field, operator, value, riskPoints, priority, isActive } = body;

    if (!name || !lineOfBusiness || !category || !field || !operator || !value || riskPoints === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rule = await prisma.underwritingRule.create({
      data: {
        name,
        description: description || null,
        lineOfBusiness,
        category,
        field,
        operator,
        value,
        riskPoints: parseInt(String(riskPoints)),
        priority: priority ? parseInt(String(priority)) : 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('UnderwritingRules POST error:', error);
    return NextResponse.json({ error: 'Failed to create underwriting rule' }, { status: 500 });
  }
}
