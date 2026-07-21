import { NextRequest, NextResponse } from 'next/server';
import { getStripe, getStripeWebhookSecret } from '@/lib/stripe';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event;
    try {
      event = getStripe().webhooks.constructEvent(body, signature, getStripeWebhookSecret());
    } catch (err: any) {
      if (err.message?.includes('not configured')) return NextResponse.json({ error: 'Payment webhook is unavailable' }, { status: 503 });
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const payment = await prisma.payment.findUnique({
          where: { stripeSessionId: session.id },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'COMPLETED',
              paidAt: new Date(),
              stripePaymentIntentId: session.payment_intent || null,
              stripeCustomerId: session.customer || null,
            },
          });

          // Update matching PaymentSchedule if exists
          if (payment.policyId) {
            const schedule = await prisma.paymentSchedule.findFirst({
              where: {
                policyId: payment.policyId,
                status: { in: ['SCHEDULED', 'REMINDED', 'OVERDUE'] },
                amount: payment.amount,
              },
              orderBy: { dueDate: 'asc' },
            });

            if (schedule) {
              await prisma.paymentSchedule.update({
                where: { id: schedule.id },
                data: { status: 'PAID', paymentId: payment.id },
              });
            }
          }
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as any;
        const payment = await prisma.payment.findUnique({
          where: { stripeSessionId: session.id },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'CANCELLED' },
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        const payment = await prisma.payment.findFirst({
          where: { stripePaymentIntentId: paymentIntent.id },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
              failedAt: new Date(),
            },
          });
        }
        break;
      }

      default: {
        // Handle transfer events for settlement payouts
        const eventType = event.type as string;
        if (eventType === 'transfer.paid') {
          const transfer = (event.data as any).object;
          const settlementId = transfer.metadata?.settlementId;
          if (settlementId) {
            await prisma.settlement.update({
              where: { id: settlementId },
              data: { status: 'PAID', paidDate: new Date(), stripeTransferId: transfer.id },
            }).catch(() => {});
          }
        } else if (eventType === 'transfer.failed') {
          const transfer = (event.data as any).object;
          const settlementId = transfer.metadata?.settlementId;
          if (settlementId) {
            await prisma.settlement.update({
              where: { id: settlementId },
              data: { status: 'FAILED' },
            }).catch(() => {});
          }
        } else {
          console.log(`Unhandled event type: ${event.type}`);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
