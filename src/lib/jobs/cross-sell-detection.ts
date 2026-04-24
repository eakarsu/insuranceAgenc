import prisma from '../prisma';
import { notify } from '../notification-service';

/**
 * Job handler: Cross-sell detection
 * Identifies coverage gaps and recommends additional products.
 * Schedule: Daily at 7:00 AM
 */
export async function handleCrossSellDetection(): Promise<any> {
  let created = 0;

  // Get the owner user for notifications
  const owner = await prisma.user.findFirst({ where: { role: 'ADMIN', isActive: true } });
  if (!owner) return { created: 0, error: 'No owner found' };

  // Get all active clients with their policies
  const clients = await prisma.client.findMany({
    where: { status: 'ACTIVE' },
    include: {
      policies: {
        where: { status: 'ACTIVE' },
        select: { lineOfBusiness: true },
      },
      lifeEvents: {
        where: { isCompleted: false },
        orderBy: { eventDate: 'desc' },
        take: 5,
      },
    },
  });

  // Define cross-sell rules: if client has X but not Y, recommend Y
  const personalRules = [
    { has: 'PERSONAL_AUTO', missing: 'HOMEOWNERS', product: 'Homeowners Insurance', score: 0.7, reason: 'Has auto but no homeowners — bundle discount opportunity' },
    { has: 'HOMEOWNERS', missing: 'UMBRELLA', product: 'Umbrella Insurance', score: 0.65, reason: 'Homeowner without umbrella — liability gap' },
    { has: 'PERSONAL_AUTO', missing: 'UMBRELLA', product: 'Umbrella Insurance', score: 0.6, reason: 'Auto policy without umbrella — liability gap' },
    { has: 'HOMEOWNERS', missing: 'PERSONAL_AUTO', product: 'Personal Auto Insurance', score: 0.7, reason: 'Has homeowners but no auto — bundle discount opportunity' },
    { has: 'PERSONAL_AUTO', missing: 'RENTERS', product: 'Renters Insurance', score: 0.5, reason: 'Auto policy holder may need renters coverage' },
  ];

  const commercialRules = [
    { has: 'GENERAL_LIABILITY', missing: 'COMMERCIAL_PROPERTY', product: 'Commercial Property', score: 0.75, reason: 'Has GL but no property — BOP opportunity' },
    { has: 'COMMERCIAL_PROPERTY', missing: 'GENERAL_LIABILITY', product: 'General Liability', score: 0.75, reason: 'Has property but no GL — BOP opportunity' },
    { has: 'GENERAL_LIABILITY', missing: 'WORKERS_COMP', product: 'Workers Compensation', score: 0.8, reason: 'Business with GL likely needs workers comp' },
    { has: 'GENERAL_LIABILITY', missing: 'CYBER', product: 'Cyber Liability', score: 0.6, reason: 'Modern business cyber risk exposure' },
    { has: 'COMMERCIAL_AUTO', missing: 'GENERAL_LIABILITY', product: 'General Liability', score: 0.7, reason: 'Commercial auto without GL — coverage gap' },
  ];

  const lifeEventTriggers: Record<string, { product: string; score: number; reason: string }> = {
    'MARRIAGE': { product: 'Life Insurance', score: 0.8, reason: 'Recent marriage — life insurance recommended' },
    'NEW_BABY': { product: 'Life Insurance', score: 0.85, reason: 'New baby — life insurance coverage important' },
    'HOME_PURCHASE': { product: 'Homeowners Insurance', score: 0.9, reason: 'New home purchase requires homeowners coverage' },
    'NEW_VEHICLE': { product: 'Personal Auto Insurance', score: 0.9, reason: 'New vehicle needs auto coverage' },
    'BUSINESS_START': { product: 'General Liability', score: 0.85, reason: 'New business needs liability coverage' },
    'RETIREMENT': { product: 'Medicare Supplement', score: 0.7, reason: 'Approaching retirement — Medicare supplement options' },
  };

  for (const client of clients) {
    const activeLobs = client.policies.map((p) => p.lineOfBusiness);
    const currentPolicies = activeLobs.map((l) => l.replace(/_/g, ' '));

    const rules = client.type === 'COMMERCIAL' ? commercialRules : personalRules;

    // Check coverage gap rules
    for (const rule of rules) {
      if (activeLobs.includes(rule.has as any) && !activeLobs.includes(rule.missing as any)) {
        // Check if recommendation already exists and is still pending
        const existing = await prisma.crossSellRecommendation.findFirst({
          where: {
            clientId: client.id,
            recommendedProduct: rule.product,
            status: 'PENDING',
          },
        });

        if (!existing) {
          await prisma.crossSellRecommendation.create({
            data: {
              clientId: client.id,
              recommendedProduct: rule.product,
              score: rule.score,
              reasoning: rule.reason,
              currentPolicies,
              status: 'PENDING',
            },
          });
          created++;
        }
      }
    }

    // Check life event triggers
    for (const event of client.lifeEvents) {
      const trigger = lifeEventTriggers[event.type];
      if (trigger && !activeLobs.some((l) => trigger.product.toUpperCase().replace(/ /g, '_').includes(l))) {
        const existing = await prisma.crossSellRecommendation.findFirst({
          where: {
            clientId: client.id,
            recommendedProduct: trigger.product,
            status: 'PENDING',
          },
        });

        if (!existing) {
          await prisma.crossSellRecommendation.create({
            data: {
              clientId: client.id,
              recommendedProduct: trigger.product,
              score: trigger.score,
              reasoning: `${trigger.reason} (Life event: ${event.title})`,
              currentPolicies,
              status: 'PENDING',
            },
          });
          created++;
        }
      }
    }
  }

  if (created > 0) {
    await notify({
      userId: owner.id,
      type: 'CROSS_SELL',
      title: `${created} New Cross-Sell Opportunities`,
      message: `Detected ${created} new cross-sell recommendations across your client base.`,
      link: '/marketing/cross-sell',
    });
  }

  return { created, clientsAnalyzed: clients.length };
}
