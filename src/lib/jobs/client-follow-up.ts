import prisma from '../prisma';
import { notify } from '../notification-service';

/**
 * Job handler: Client follow-up detection
 * Identifies clients needing attention: dormant, post-claim, new onboarding.
 * Schedule: Daily at 8:30 AM
 */
export async function handleClientFollowUp(): Promise<any> {
  let notifications = 0;

  const owner = await prisma.user.findFirst({ where: { role: 'ADMIN', isActive: true } });
  if (!owner) return { notifications: 0, error: 'No owner found' };

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 1. Dormant clients — no Activity records in 90 days
  const dormantClients = await prisma.client.findMany({
    where: {
      status: 'ACTIVE',
      activities: {
        none: {
          createdAt: { gte: ninetyDaysAgo },
        },
      },
      policies: {
        some: { status: 'ACTIVE' },
      },
    },
    select: { id: true, firstName: true, lastName: true },
    take: 20,
  });

  for (const client of dormantClients) {
    await notify({
      userId: owner.id,
      type: 'FOLLOW_UP',
      title: `Dormant Client: ${client.firstName} ${client.lastName}`,
      message: `No contact in 90+ days. Consider a check-in call or email.`,
      link: `/clients/${client.id}`,
    });
    notifications++;
  }

  // 2. Post-claim check-ins — claims closed in the last 30 days
  const recentlyClosedClaims = await prisma.claim.findMany({
    where: {
      status: 'CLOSED',
      updatedAt: { gte: thirtyDaysAgo },
    },
    include: {
      client: { select: { id: true, firstName: true, lastName: true } },
    },
    take: 20,
  });

  for (const claim of recentlyClosedClaims) {
    // Check if we already notified about this claim
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: owner.id,
        type: 'POST_CLAIM_FOLLOWUP',
        link: `/clients/${claim.client.id}`,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    if (!existingNotification) {
      await notify({
        userId: owner.id,
        type: 'POST_CLAIM_FOLLOWUP',
        title: `Post-Claim Check-in: ${claim.client.firstName} ${claim.client.lastName}`,
        message: `Claim ${claim.claimNumber} was recently closed. Follow up to ensure satisfaction.`,
        link: `/clients/${claim.client.id}`,
      });
      notifications++;
    }
  }

  // 3. New client onboarding — created in last 30 days with no activities
  const newClients = await prisma.client.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      status: 'ACTIVE',
      activities: {
        none: {},
      },
    },
    select: { id: true, firstName: true, lastName: true, createdAt: true },
    take: 20,
  });

  for (const client of newClients) {
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: owner.id,
        type: 'NEW_CLIENT_ONBOARDING',
        link: `/clients/${client.id}`,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    if (!existingNotification) {
      await notify({
        userId: owner.id,
        type: 'NEW_CLIENT_ONBOARDING',
        title: `New Client Onboarding: ${client.firstName} ${client.lastName}`,
        message: `New client added ${client.createdAt.toLocaleDateString()} — schedule a welcome call.`,
        link: `/clients/${client.id}`,
      });
      notifications++;
    }
  }

  return {
    notifications,
    dormant: dormantClients.length,
    postClaim: recentlyClosedClaims.length,
    newClients: newClients.length,
  };
}
