import prisma from '../prisma';
import { notify } from '../notification-service';

/**
 * Job handler: Document/policy expiration check
 * Notifies owner about policies with documents that are expiring soon.
 * Schedule: Daily at 9:30 AM
 */
export async function handleDocumentExpiration(): Promise<any> {
  let notifications = 0;

  const owner = await prisma.user.findFirst({ where: { role: 'ADMIN', isActive: true } });
  if (!owner) return { notifications: 0, error: 'No owner found' };

  const now = new Date();
  const horizons = [
    { days: 30, label: '30 days', urgency: 'INFO' },
    { days: 15, label: '15 days', urgency: 'WARNING' },
    { days: 7, label: '7 days', urgency: 'URGENT' },
  ];

  for (const horizon of horizons) {
    const windowStart = new Date(now.getTime() + (horizon.days - 1) * 24 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + (horizon.days + 1) * 24 * 60 * 60 * 1000);

    // Find active policies expiring within this window that have documents
    const policies = await prisma.policy.findMany({
      where: {
        status: 'ACTIVE',
        expirationDate: { gte: windowStart, lte: windowEnd },
        documents: { some: {} },
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        documents: { select: { id: true, name: true, type: true } },
      },
    });

    for (const policy of policies) {
      const clientName = `${policy.client.firstName} ${policy.client.lastName}`;
      const docCount = policy.documents.length;

      // Check if we already sent this notification recently
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: owner.id,
          type: `DOC_EXPIRATION_${horizon.urgency}`,
          link: `/policies/${policy.id}`,
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!existingNotification) {
        await notify({
          userId: owner.id,
          type: `DOC_EXPIRATION_${horizon.urgency}`,
          title: `Policy Expiring in ${horizon.label}: ${policy.policyNumber}`,
          message: `${clientName}'s ${policy.lineOfBusiness.replace(/_/g, ' ')} policy (${docCount} document${docCount !== 1 ? 's' : ''}) expires ${policy.expirationDate.toLocaleDateString()}.`,
          link: `/policies/${policy.id}`,
        });
        notifications++;
      }
    }
  }

  return { notifications };
}
