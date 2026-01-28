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
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { referringClient: { firstName: { contains: search, mode: 'insensitive' } } },
        { referringClient: { lastName: { contains: search, mode: 'insensitive' } } },
        { referredClient: { firstName: { contains: search, mode: 'insensitive' } } },
        { referredClient: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const referrals = await prisma.referral.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        referringClient: { select: { id: true, firstName: true, lastName: true } },
        referredClient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Calculate stats
    const total = referrals.length;
    const converted = referrals.filter(r => r.status === 'CONVERTED').length;
    const pending = referrals.filter(r => r.status === 'PENDING').length;

    return NextResponse.json({
      referrals: referrals.map(r => ({
        ...r,
        rewardStatus: r.rewardGiven ? 'PAID' : 'PENDING',
      })),
      stats: { total, converted, pending },
    });
  } catch (error) {
    console.error('Referrals GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { referringClientId, referredFirstName, referredLastName, referredEmail, referredPhone, status } = body;

    // Create the new referred client first (assigned to current agent)
    const referredClient = await prisma.client.create({
      data: {
        firstName: referredFirstName,
        lastName: referredLastName,
        email: referredEmail || null,
        phone: referredPhone || null,
        type: 'PERSONAL',
        status: 'PROSPECT',
        source: 'REFERRAL',
        agentId: session.user.id,
      },
    });

    // Create the referral
    const referral = await prisma.referral.create({
      data: {
        referringClientId,
        referredClientId: referredClient.id,
        status: status || 'PENDING',
        rewardGiven: false,
      },
      include: {
        referringClient: { select: { id: true, firstName: true, lastName: true } },
        referredClient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Create activity for the referral
    await prisma.activity.create({
      data: {
        type: 'CLIENT_CREATED',
        title: 'New referral added',
        description: `${referredFirstName} ${referredLastName} was referred by client`,
        userId: session.user.id,
        clientId: referredClient.id,
      },
    });

    return NextResponse.json(referral, { status: 201 });
  } catch (error) {
    console.error('Referrals POST error:', error);
    return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });
  }
}
