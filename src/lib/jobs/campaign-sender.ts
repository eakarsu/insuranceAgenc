import prisma from '../prisma';
import { sendEmail } from '../email';
import { sendSMS } from '../sms';
import { renderTemplate, buildClientVariables } from '../template-renderer';

/**
 * Job handler: Send campaigns that are SCHEDULED and due.
 * Also handles direct campaign sends via queue.
 */
export async function handleCampaignSender(data: { campaignId?: string }): Promise<any> {
  if (data.campaignId) {
    return sendCampaign(data.campaignId);
  }

  // Check for scheduled campaigns that are due
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { lte: new Date() },
    },
  });

  let processed = 0;
  for (const campaign of campaigns) {
    await sendCampaign(campaign.id);
    processed++;
  }

  return { processed };
}

async function sendCampaign(campaignId: string): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      createdBy: { select: { name: true, email: true } },
      recipients: {
        where: { sentAt: null },
        include: {
          client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, businessName: true } },
        },
      },
    },
  });

  if (!campaign) return;

  // Mark as SENDING
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'SENDING' },
  });

  let sentCount = 0;

  for (const recipient of campaign.recipients) {
    const client = recipient.client;
    const variables = buildClientVariables(client, campaign.createdBy);

    try {
      if ((campaign.type === 'EMAIL' || campaign.type === 'NEWSLETTER' || campaign.type === 'RENEWAL_REMINDER' || campaign.type === 'CROSS_SELL') && client.email) {
        const subject = renderTemplate(campaign.subject || '', variables);
        const html = renderTemplate(campaign.content || '', variables).replace(/\n/g, '<br>');
        await sendEmail({ to: client.email, subject, html });
      }

      if (campaign.type === 'SMS' && client.phone) {
        const body = renderTemplate(campaign.content || '', variables);
        await sendSMS({ to: client.phone, body });
      }

      // Mark recipient as sent
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: { sentAt: new Date(), status: 'SENT' },
      });

      sentCount++;
    } catch (error) {
      console.error(`[Campaign] Failed to send to ${client.email || client.phone}:`, error);
    }
  }

  // Mark campaign as SENT
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: 'SENT',
      sentAt: new Date(),
      recipientCount: sentCount,
    },
  });
}
