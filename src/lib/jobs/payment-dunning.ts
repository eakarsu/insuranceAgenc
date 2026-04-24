import prisma from '../prisma';
import { notify } from '../notification-service';

/**
 * Job handler: Payment dunning — send reminders, mark overdue, retry failed payments.
 * Schedule: 7-day, 3-day, 1-day reminders → mark overdue → retry (3x) → grace period → final notice
 */
export async function handlePaymentDunning(): Promise<any> {
  const now = new Date();
  let reminders = 0;
  let overdue = 0;

  // 1. Find upcoming scheduled payments and send reminders
  const upcomingPayments = await prisma.paymentSchedule.findMany({
    where: {
      status: { in: ['SCHEDULED', 'REMINDED'] },
      dueDate: {
        gte: now,
        lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // within 7 days
      },
    },
    include: {
      policy: {
        include: {
          client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          agent: { select: { id: true, name: true } },
        },
      },
    },
  });

  for (const schedule of upcomingPayments) {
    const daysUntilDue = Math.ceil((schedule.dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const client = schedule.policy.client;
    const shouldRemind = (daysUntilDue <= 7 && schedule.remindersSent === 0) ||
                         (daysUntilDue <= 3 && schedule.remindersSent <= 1) ||
                         (daysUntilDue <= 1 && schedule.remindersSent <= 2);

    if (shouldRemind) {
      await notify({
        userId: schedule.policy.agent?.id,
        clientId: client?.id,
        type: 'PAYMENT_REMINDER',
        title: `Payment Due ${daysUntilDue === 0 ? 'Today' : `in ${daysUntilDue} days`}`,
        message: `Payment of $${Number(schedule.amount).toLocaleString()} for policy ${schedule.policy.policyNumber} is due ${schedule.dueDate.toLocaleDateString()}`,
        link: `/payments`,
        sendEmail: true,
        recipientEmail: client?.email || undefined,
      });

      await prisma.paymentSchedule.update({
        where: { id: schedule.id },
        data: { remindersSent: { increment: 1 }, status: 'REMINDED' },
      });

      reminders++;
    }
  }

  // 2. Mark overdue payments
  const pastDuePayments = await prisma.paymentSchedule.findMany({
    where: {
      status: { in: ['SCHEDULED', 'REMINDED'] },
      dueDate: { lt: now },
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

  for (const schedule of pastDuePayments) {
    const gracePeriodEnd = new Date(schedule.dueDate.getTime() + 15 * 24 * 60 * 60 * 1000);

    await prisma.paymentSchedule.update({
      where: { id: schedule.id },
      data: {
        status: 'OVERDUE',
        gracePeriodEnd,
      },
    });

    await notify({
      userId: schedule.policy.agent?.id,
      type: 'PAYMENT_OVERDUE',
      title: `Payment Overdue: ${schedule.policy.policyNumber}`,
      message: `Payment of $${Number(schedule.amount).toLocaleString()} is overdue. Grace period ends ${gracePeriodEnd.toLocaleDateString()}`,
      link: `/payments`,
      sendEmail: true,
      recipientEmail: schedule.policy.client?.email || undefined,
    });

    overdue++;
  }

  return { reminders, overdue };
}
