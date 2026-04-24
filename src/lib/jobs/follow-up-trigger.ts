import prisma from '../prisma';
import { notify } from '../notification-service';

/**
 * Job handler: Process due follow-ups for quotes.
 * Sends notifications to agents for follow-ups that are scheduled and not yet completed.
 */
export async function handleFollowUpTrigger(): Promise<any> {
  const now = new Date();

  const dueFollowUps = await prisma.quoteFollowUp.findMany({
    where: {
      scheduledAt: { lte: now },
      completedAt: null,
    },
    include: {
      quote: {
        include: {
          client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          agent: { select: { id: true, name: true, email: true } },
        },
      },
    },
    take: 50,
  });

  let processed = 0;

  for (const followUp of dueFollowUps) {
    const quote = followUp.quote;
    if (!quote || !quote.agent) continue;

    // Skip if quote is already bound/declined/expired
    if (['BOUND', 'DECLINED', 'EXPIRED'].includes(quote.status)) {
      await prisma.quoteFollowUp.update({
        where: { id: followUp.id },
        data: { completedAt: now, notes: `Auto-closed: quote status is ${quote.status}` },
      });
      continue;
    }

    const clientName = `${quote.client?.firstName} ${quote.client?.lastName}`;

    // Notify agent
    await notify({
      userId: quote.agent.id,
      type: 'FOLLOW_UP',
      title: `Follow-up due: ${quote.quoteNumber}`,
      message: `${followUp.type} follow-up for ${clientName} on quote ${quote.quoteNumber}`,
      link: `/quotes/${quote.id}`,
    });

    // Mark as completed (auto-triggered)
    await prisma.quoteFollowUp.update({
      where: { id: followUp.id },
      data: {
        completedAt: now,
        notes: `${followUp.notes || ''}\n[Auto-triggered: notification sent to ${quote.agent.name}]`.trim(),
      },
    });

    processed++;
  }

  return { processed, total: dueFollowUps.length };
}
