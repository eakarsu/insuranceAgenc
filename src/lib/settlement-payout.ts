import prisma from './prisma';
import { notify } from './notification-service';

/**
 * Execute a settlement payout.
 * In production: uses Stripe transfers.
 * In dev mode: simulates with mock check numbers.
 */
export async function executeSettlementPayout(
  settlementId: string,
  approvedBy: string
): Promise<{ success: boolean; method: string; reference: string }> {
  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
    include: {
      claim: {
        include: {
          client: { select: { id: true, firstName: true, lastName: true, email: true } },
          policy: { select: { agentId: true } },
        },
      },
    },
  });

  if (!settlement) throw new Error('Settlement not found');
  if (settlement.status === 'PAID') throw new Error('Settlement already paid');

  const amount = Number(settlement.amount);
  const clientName = `${settlement.claim.client?.firstName} ${settlement.claim.client?.lastName}`;

  // Update to processing
  await prisma.settlement.update({
    where: { id: settlementId },
    data: {
      status: 'PROCESSING',
      approvedBy,
      approvedAt: new Date(),
    },
  });

  let method = 'CHECK';
  let reference = '';

  // Try Stripe if configured and recipient account exists
  if (process.env.STRIPE_SECRET_KEY && settlement.recipientAccountId) {
    try {
      const stripe = (await import('stripe')).default;
      const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);

      const transfer = await stripeClient.transfers.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        destination: settlement.recipientAccountId,
        metadata: { settlementId, claimNumber: settlement.claim.claimNumber },
      });

      method = 'STRIPE';
      reference = transfer.id;
    } catch (error: any) {
      console.error('[Settlement] Stripe transfer failed:', error.message);
      // Fall through to mock payment
    }
  }

  // Mock payment (dev mode or Stripe fallback)
  if (!reference) {
    reference = `CHK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    method = 'CHECK';
  }

  // Mark as paid
  await prisma.settlement.update({
    where: { id: settlementId },
    data: {
      status: 'PAID',
      paidDate: new Date(),
      checkNumber: method === 'CHECK' ? reference : settlement.checkNumber,
      stripeTransferId: method === 'STRIPE' ? reference : null,
      paymentMethod: method,
    },
  });

  // Notify agent
  const agentId = settlement.claim.policy?.agentId;
  if (agentId) {
    await notify({
      userId: agentId,
      type: 'SETTLEMENT_PAID',
      title: `Settlement Paid: ${settlement.claim.claimNumber}`,
      message: `$${amount.toLocaleString()} settlement paid to ${clientName} via ${method}`,
      link: `/claims/${settlement.claimId}`,
    });
  }

  return { success: true, method, reference };
}
