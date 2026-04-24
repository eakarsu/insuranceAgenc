import prisma from './prisma';
import { notify } from './notification-service';

const SLA_HOURS: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 24,
  MEDIUM: 48,
  LOW: 72,
};

/**
 * Create an escalation with SLA calculation and auto-assignment.
 */
export async function createEscalation(data: {
  type: string;
  priority: string;
  title: string;
  description: string;
  entityType?: string;
  entityId?: string;
}): Promise<any> {
  // Calculate SLA deadline
  const hours = SLA_HOURS[data.priority] || 48;
  const slaDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);

  // Auto-assign to agent with fewest open escalations
  const agents = await prisma.user.findMany({
    where: { role: { in: ['AGENT', 'MANAGER'] }, isActive: true },
    select: { id: true, name: true },
  });

  let assignedTo: string | null = null;
  if (agents.length > 0) {
    const agentCounts = await Promise.all(
      agents.map(async (agent) => {
        const count = await prisma.escalation.count({
          where: { assignedTo: agent.id, status: { in: ['OPEN', 'IN_PROGRESS'] } },
        });
        return { id: agent.id, name: agent.name, count };
      })
    );

    agentCounts.sort((a, b) => a.count - b.count);
    assignedTo = agentCounts[0].id;
  }

  const escalation = await prisma.escalation.create({
    data: {
      type: data.type,
      priority: data.priority,
      title: data.title,
      description: data.description,
      slaDeadline,
      assignedTo,
      entityType: data.entityType,
      entityId: data.entityId,
    },
  });

  // Notify assigned agent
  if (assignedTo) {
    await notify({
      userId: assignedTo,
      type: 'ESCALATION',
      title: `[${data.priority}] ${data.title}`,
      message: data.description.substring(0, 200),
      link: `/escalations`,
    });
  }

  return escalation;
}
