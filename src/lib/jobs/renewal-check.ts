import prisma from '../prisma';
import { notify } from '../notification-service';

/**
 * Job handler: Renewal check — 60-day, 30-day, 15-day reminders, auto-bind if autoRenew.
 */
export async function handleRenewalCheck(): Promise<any> {
  const now = new Date();
  let processed = 0;

  const horizons = [
    { days: 60, label: '60-day', action: 'create-renewal-quote' },
    { days: 30, label: '30-day', action: 'send-reminder' },
    { days: 15, label: '15-day', action: 'urgent-reminder' },
    { days: 7, label: '7-day', action: 'auto-bind-check' },
  ];

  for (const horizon of horizons) {
    const windowStart = new Date(now.getTime() + (horizon.days - 1) * 24 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + (horizon.days + 1) * 24 * 60 * 60 * 1000);

    const policies = await prisma.policy.findMany({
      where: {
        status: 'ACTIVE',
        expirationDate: { gte: windowStart, lte: windowEnd },
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        agent: { select: { id: true, name: true } },
        carrier: { select: { id: true, name: true } },
      },
    });

    for (const policy of policies) {
      const clientName = `${policy.client.firstName} ${policy.client.lastName}`;

      if (horizon.action === 'create-renewal-quote') {
        // Check if renewal quote already exists
        const existingRenewal = await prisma.quote.findFirst({
          where: { renewalPolicyId: policy.id, isRenewal: true },
        });

        if (!existingRenewal) {
          // Create renewal quote
          const count = await prisma.quote.count();
          const quoteNumber = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

          await prisma.quote.create({
            data: {
              quoteNumber,
              status: 'QUOTED',
              lineOfBusiness: policy.lineOfBusiness,
              type: `${policy.type} - Renewal`,
              effectiveDate: policy.expirationDate,
              premium: policy.premium,
              totalPremium: policy.premium,
              clientId: policy.clientId,
              carrierId: policy.carrierId,
              agentId: policy.agentId,
              isRenewal: true,
              renewalPolicyId: policy.id,
            },
          });
        }
      }

      // Send notification
      const urgencyMap: Record<string, string> = {
        '60-day': 'RENEWAL',
        '30-day': 'RENEWAL',
        '15-day': 'RENEWAL_URGENT',
        '7-day': 'RENEWAL_CRITICAL',
      };

      await notify({
        userId: policy.agent?.id,
        clientId: policy.client.id,
        type: urgencyMap[horizon.label] || 'RENEWAL',
        title: `${horizon.label} Renewal: ${policy.policyNumber}`,
        message: `${clientName}'s ${policy.lineOfBusiness.replace(/_/g, ' ')} policy expires ${policy.expirationDate.toLocaleDateString()}`,
        link: `/policies/${policy.id}`,
        sendEmail: horizon.days <= 30,
        recipientEmail: policy.client.email || undefined,
      });

      // Auto-bind if within 7 days and autoRenew is true
      if (horizon.action === 'auto-bind-check' && policy.autoRenew) {
        const renewalQuote = await prisma.quote.findFirst({
          where: { renewalPolicyId: policy.id, isRenewal: true, status: 'QUOTED' },
        });

        if (renewalQuote) {
          await prisma.quote.update({
            where: { id: renewalQuote.id },
            data: { status: 'ACCEPTED' },
          });

          // The actual binding happens via bindRenewalPolicy
          await notify({
            userId: policy.agent?.id,
            type: 'RENEWAL_AUTO_BIND',
            title: `Auto-Renewal: ${policy.policyNumber}`,
            message: `Policy ${policy.policyNumber} has been auto-renewed for ${clientName}`,
            link: `/policies/${policy.id}`,
          });
        }
      }

      processed++;
    }
  }

  return { processed };
}
