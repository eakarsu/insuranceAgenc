import prisma from '../prisma';
import { notify } from '../notification-service';

/**
 * Job handler: Monitor escalations for SLA breaches.
 * Runs every 15 minutes.
 */
export async function handleEscalationMonitor(): Promise<any> {
  const now = new Date();
  let breached = 0;

  // Find open escalations past SLA deadline
  const overdue = await prisma.escalation.findMany({
    where: {
      status: { in: ['OPEN', 'IN_PROGRESS'] },
      slaDeadline: { lt: now },
    },
  });

  for (const escalation of overdue) {
    // Re-escalate: upgrade priority if not already CRITICAL
    const newPriority = escalation.priority === 'HIGH' ? 'CRITICAL' :
                        escalation.priority === 'MEDIUM' ? 'HIGH' :
                        escalation.priority === 'LOW' ? 'MEDIUM' : 'CRITICAL';

    if (newPriority !== escalation.priority) {
      await prisma.escalation.update({
        where: { id: escalation.id },
        data: {
          priority: newPriority,
          // Extend SLA by 4 hours for re-escalation
          slaDeadline: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        },
      });
    }

    // Notify all managers about SLA breach
    const managers = await prisma.user.findMany({
      where: { role: { in: ['MANAGER', 'ADMIN'] }, isActive: true },
      select: { id: true },
    });

    for (const manager of managers) {
      await notify({
        userId: manager.id,
        type: 'SLA_BREACH',
        title: `SLA Breach: ${escalation.title}`,
        message: `Escalation "${escalation.title}" has breached its SLA deadline. Priority upgraded to ${newPriority}.`,
        link: `/escalations`,
      });
    }

    // Also notify assigned agent
    if (escalation.assignedTo) {
      await notify({
        userId: escalation.assignedTo,
        type: 'SLA_BREACH',
        title: `Urgent: SLA Breach on your escalation`,
        message: `"${escalation.title}" is past its SLA deadline. Please resolve immediately.`,
        link: `/escalations`,
      });
    }

    breached++;
  }

  return { breached, checked: overdue.length };
}
