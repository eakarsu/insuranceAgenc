import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { client: { firstName: { contains: search, mode: 'insensitive' } } },
        { client: { lastName: { contains: search, mode: 'insensitive' } } },
        { policy: { policyNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, firstName: true, lastName: true, email: true } },
          policy: { select: { id: true, policyNumber: true, lineOfBusiness: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Payments GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const stripe = getStripe();

    const body = await request.json();
    const { clientId, policyId, amount, description } = body;

    if (!clientId || !amount) {
      return NextResponse.json({ error: 'clientId and amount are required' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0 || normalizedAmount > 1_000_000_000) {
      return NextResponse.json({ error: 'amount must be a positive supported monetary value' }, { status: 422 });
    }
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: description || `Insurance Payment - ${client.firstName} ${client.lastName}`,
            },
            unit_amount: Math.round(normalizedAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/payments`,
      metadata: {
        clientId,
        policyId: policyId || '',
      },
    });

    if (!stripeSession.url) throw new Error('Stripe did not return a checkout URL');

    const payment = await prisma.payment.create({
      data: {
        amount: normalizedAmount,
        currency: 'usd',
        description: description || null,
        status: 'PENDING',
        stripeSessionId: stripeSession.id,
        clientId,
        policyId: policyId || null,
        metadata: { createdBy: session.user.id },
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
        policy: { select: { id: true, policyNumber: true } },
      },
    });

    return NextResponse.json({ payment, checkoutUrl: stripeSession.url }, { status: 201 });
  } catch (error) {
    console.error('Payments POST error:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
