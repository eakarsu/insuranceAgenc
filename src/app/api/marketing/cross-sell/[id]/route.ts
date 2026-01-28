import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const recommendation = await prisma.crossSellRecommendation.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            type: true,
            policies: {
              where: { status: 'ACTIVE' },
              select: { id: true, lineOfBusiness: true, premium: true, carrier: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!recommendation) return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    return NextResponse.json(recommendation);
  } catch (error) {
    console.error('Cross-sell GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch recommendation' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const recommendation = await prisma.crossSellRecommendation.update({
      where: { id },
      data: {
        status: body.status,
      },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error('Cross-sell PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update recommendation' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await prisma.crossSellRecommendation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cross-sell DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete recommendation' }, { status: 500 });
  }
}
