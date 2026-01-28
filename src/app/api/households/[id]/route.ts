import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const household = await prisma.household.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            agent: { select: { id: true, name: true } },
            _count: { select: { policies: true, quotes: true, claims: true } },
          },
        },
      },
    });

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 });
    }

    return NextResponse.json(household);
  } catch (error) {
    console.error('Household GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch household' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const household = await prisma.household.update({
      where: { id: params.id },
      data: {
        name: body.name,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        zipCode: body.zipCode || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(household);
  } catch (error) {
    console.error('Household PUT error:', error);
    return NextResponse.json({ error: 'Failed to update household' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.household.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Household DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete household' }, { status: 500 });
  }
}
