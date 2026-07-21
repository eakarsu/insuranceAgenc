import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';

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

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

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
      success_url: `${process.env.NEXTAUTH_URL}/portal/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/portal/payments`,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      metadata: {
        clientId,
        policyId: policyId || '',
        type: 'payment_link',
      },
    });

    const paymentLinkUrl = stripeSession.url;
    if (!paymentLinkUrl) throw new Error('Stripe did not return a checkout URL');

    const payment = await prisma.payment.create({
      data: {
        amount: normalizedAmount,
        currency: 'usd',
        description: description || null,
        status: 'PENDING',
        stripeSessionId: stripeSession.id,
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
