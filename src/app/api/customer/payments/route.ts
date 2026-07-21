import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCustomerFromCookie } from '@/lib/customer-auth';
import { getStripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const customer = await getCustomerFromCookie();
    if (!customer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payments = await prisma.payment.findMany({
      where: { clientId: customer.clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            lineOfBusiness: true,
          },
        },
      },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Customer payments GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const customer = await getCustomerFromCookie();
    if (!customer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, policyId, amount } = body;
    const stripe = getStripe();

    // If paymentId is provided, use the existing payment record
    if (paymentId) {
      const existingPayment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!existingPayment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      if (existingPayment.clientId !== customer.clientId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      if (existingPayment.status !== 'PENDING') {
        return NextResponse.json({ error: 'Payment is not in a payable state' }, { status: 400 });
      }

      const client = await prisma.client.findUnique({
        where: { id: customer.clientId },
        select: { firstName: true, lastName: true },
      });

      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: existingPayment.currency,
              product_data: {
                name: existingPayment.description || `Insurance Payment - ${client?.firstName} ${client?.lastName}`,
              },
              unit_amount: Math.round(Number(existingPayment.amount) * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL}/portal/payments/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/portal/payments`,
        metadata: {
          clientId: customer.clientId,
          policyId: existingPayment.policyId || '',
          paymentId: existingPayment.id,
        },
      });

      if (!stripeSession.url) throw new Error('Stripe did not return a checkout URL');
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          stripeSessionId: stripeSession.id,
          status: 'PROCESSING',
        },
      });

      return NextResponse.json({ paymentId: existingPayment.id, checkoutUrl: stripeSession.url });
    }

    // If policyId and amount are provided, create a new payment
    if (!policyId || !amount) {
      return NextResponse.json({ error: 'Either paymentId, or policyId and amount are required' }, { status: 400 });
    }

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0 || normalizedAmount > 1_000_000_000) {
      return NextResponse.json({ error: 'amount must be a positive supported monetary value' }, { status: 422 });
    }

    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
    });

    if (!policy || policy.clientId !== customer.clientId) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    const payment = await prisma.payment.create({
      data: {
        amount: normalizedAmount,
        currency: 'usd',
        description: `Payment for policy ${policy.policyNumber}`,
        status: 'PENDING',
        clientId: customer.clientId,
        policyId,
      },
    });

    const client = await prisma.client.findUnique({
      where: { id: customer.clientId },
      select: { firstName: true, lastName: true },
    });

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Payment for policy ${policy.policyNumber} - ${client?.firstName} ${client?.lastName}`,
            },
            unit_amount: Math.round(normalizedAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/portal/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/portal/payments`,
      metadata: {
        clientId: customer.clientId,
        policyId,
        paymentId: payment.id,
      },
    });

    if (!stripeSession.url) throw new Error('Stripe did not return a checkout URL');
    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeSessionId: stripeSession.id, status: 'PROCESSING' },
    });

    return NextResponse.json({ paymentId: payment.id, checkoutUrl: stripeSession.url }, { status: 201 });
  } catch (error) {
    console.error('Customer payments POST error:', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}
