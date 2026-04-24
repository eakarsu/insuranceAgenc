import prisma from './prisma';
import { sendEmail } from './email';
import { sendSMS } from './sms';
import { renderTemplate, buildClientVariables } from './template-renderer';
import { broadcastToUser, broadcastToCustomer } from './sse-manager';

export interface NotificationPayload {
  userId?: string;       // Agent/internal user
  clientId?: string;     // Customer portal user
  type: string;
  title: string;
  message: string;
  link?: string;
  // Optional: also send email/SMS
  sendEmail?: boolean;
  sendSMS?: boolean;
  emailSubject?: string;
  emailHtml?: string;
  smsBody?: string;
  recipientEmail?: string;
  recipientPhone?: string;
}

export async function notify(payload: NotificationPayload): Promise<void> {
  // 1. Create DB notification for agent users
  if (payload.userId) {
    const notification = await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        link: payload.link,
      },
    });

    // Broadcast via SSE to agent dashboard
    broadcastToUser(payload.userId, {
      type: 'notification',
      data: notification,
    });
  }

  // 2. Broadcast via SSE to customer portal
  if (payload.clientId) {
    broadcastToCustomer(payload.clientId, {
      type: 'notification',
      data: {
        type: payload.type,
        title: payload.title,
        message: payload.message,
        link: payload.link,
      },
    });
  }

  // 3. Send email if requested
  if (payload.sendEmail && payload.recipientEmail) {
    await sendEmail({
      to: payload.recipientEmail,
      subject: payload.emailSubject || payload.title,
      html: payload.emailHtml || `<p>${payload.message}</p>`,
    });
  }

  // 4. Send SMS if requested
  if (payload.sendSMS && payload.recipientPhone) {
    await sendSMS({
      to: payload.recipientPhone,
      body: payload.smsBody || `${payload.title}: ${payload.message}`,
    });
  }
}

/**
 * Send a templated notification using an EmailTemplate from the database.
 */
export async function notifyWithTemplate(
  templateType: string,
  variables: Record<string, string>,
  options: {
    userId?: string;
    clientId?: string;
    recipientEmail?: string;
    recipientPhone?: string;
    link?: string;
    sendEmail?: boolean;
    sendSMS?: boolean;
  }
): Promise<void> {
  const template = await prisma.emailTemplate.findFirst({
    where: { type: templateType, status: 'ACTIVE' },
    orderBy: { usageCount: 'desc' },
  });

  if (!template) {
    console.warn(`[Notify] No active template found for type: ${templateType}`);
    return;
  }

  const subject = renderTemplate(template.subject, variables);
  const html = renderTemplate(template.content, variables).replace(/\n/g, '<br>');

  // Increment usage count
  await prisma.emailTemplate.update({
    where: { id: template.id },
    data: { usageCount: { increment: 1 } },
  });

  await notify({
    userId: options.userId,
    clientId: options.clientId,
    type: templateType,
    title: subject,
    message: renderTemplate(template.content, variables).substring(0, 200),
    link: options.link,
    sendEmail: options.sendEmail,
    sendSMS: options.sendSMS,
    emailSubject: subject,
    emailHtml: html,
    recipientEmail: options.recipientEmail,
    recipientPhone: options.recipientPhone,
    smsBody: renderTemplate(template.content, variables).substring(0, 160),
  });
}
