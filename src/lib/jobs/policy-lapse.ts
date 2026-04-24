import prisma from '../prisma';
import { notify } from '../notification-service';

/**
 * Job handler: Auto-cancel policies exceeding grace period (15 days overdue).
 */
export async function handlePolicyLapse(): Promise<any> {
  const now = new Date();
  let lapsed = 0;

  // Find overdue payment schedules past grace period
  const pastGrace = await prisma.paymentSchedule.findMany({
    where: {
      status: 'OVERDUE',
      gracePeriodEnd: { lt: now },
    },
    include: {
      policy: {
        include: {
          client: { select: { id: true, firstName: true, lastName: true, email: true } },
          agent: { select: { id: true } },
        },
      },
    },
  });

  for (const schedule of pastGrace) {
    // Only cancel if policy is still active
    if (schedule.policy.status !== 'ACTIVE') continue;

    await prisma.$transaction([
      prisma.policy.update({
        where: { id: schedule.policyId },
        data: {
          status: 'CANCELLED',
          cancelDate: now,
          notes: `Auto-cancelled due to non-payment. Grace period expired ${schedule.gracePeriodEnd?.toLocaleDateString()}.`,
        },
      }),
      prisma.paymentSchedule.update({
        where: { id: schedule.id },
        data: { status: 'CANCELLED' },
      }),
      // Cancel remaining scheduled payments for this policy
      prisma.paymentSchedule.updateMany({
        where: {
          policyId: schedule.policyId,
          status: { in: ['SCHEDULED', 'REMINDED'] },
        },
        data: { status: 'CANCELLED' },
      }),
    ]);

    // Notify agent and client
    await notify({
      userId: schedule.policy.agent?.id,
      clientId: schedule.policy.client?.id,
      type: 'POLICY_LAPSE',
      title: `Policy Cancelled: ${schedule.policy.policyNumber}`,
      message: `Policy ${schedule.policy.policyNumber} has been cancelled due to non-payment.`,
      link: `/policies/${schedule.policyId}`,
      sendEmail: true,
      recipientEmail: schedule.policy.client?.email || undefined,
    });

    lapsed++;
  }

  return { lapsed };
}
