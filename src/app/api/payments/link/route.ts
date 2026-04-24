import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import stripe from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const isPlaceholder = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder';

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    let stripeSessionId: string | null = null;
    let paymentLinkUrl: string;

    if (!isPlaceholder) {
      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: description || `Insurance Payment - ${client.firstName} ${client.lastName}`,
              },
              unit_amount: Math.round(Number(amount) * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/portal/payments/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/portal/payments`,
        expires_at: Math.floor(expiresAt.getTime() / 1000),
        metadata: {
          clientId,
          policyId: policyId || '',
          type: 'payment_link',
        },
      });

      stripeSessionId = stripeSession.id;
      paymentLinkUrl = stripeSession.url || '';
    } else {
      stripeSessionId = `mock_link_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      paymentLinkUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/portal/payments/pay?session=${stripeSessionId}`;
    }

    const payment = await prisma.payment.create({
      data: {
        amount: Number(amount),
        currency: 'usd',
        description: description || null,
        status: 'PENDING',
        stripeSessionId,
        clientId,
        policyId: policyId || null,
        paymentLinkUrl,
        paymentLinkExpiresAt: expiresAt,
        metadata: { createdBy: session.user.id, type: 'payment_link' },
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
        policy: { select: { id: true, policyNumber: true } },
      },
    });

    return NextResponse.json({ payment, paymentLinkUrl }, { status: 201 });
  } catch (error) {
    console.error('Payment link POST error:', error);
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 });
  }
}
