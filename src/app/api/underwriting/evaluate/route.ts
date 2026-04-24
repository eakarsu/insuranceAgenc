import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { evaluateUnderwriting } from '@/lib/underwriting';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const decision = searchParams.get('decision') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (decision) where.decision = decision;

    const [results, total] = await Promise.all([
      prisma.underwritingResult.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          quote: {
            include: {
              client: { select: { id: true, firstName: true, lastName: true, businessName: true, type: true } },
            },
          },
        },
      }),
      prisma.underwritingResult.count({ where }),
    ]);

    return NextResponse.json({
      results,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('UnderwritingResults GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch underwriting results' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { quoteId } = body;

    if (!quoteId) {
      return NextResponse.json({ error: 'quoteId is required' }, { status: 400 });
    }

    const decision = await evaluateUnderwriting(quoteId);

    return NextResponse.json(decision, { status: 200 });
  } catch (error: any) {
    console.error('Underwriting evaluate POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to evaluate underwriting' },
      { status: 500 }
    );
  }
}
