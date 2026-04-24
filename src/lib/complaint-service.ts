import prisma from './prisma';
import { createEscalation } from './escalation-service';

const SLA_DAYS: Record<string, number> = {
  REGULATORY: 3,
  PHONE: 5,
  EMAIL: 7,
  PORTAL: 7,
  MAIL: 10,
};

/**
 * Intake a complaint: classify via AI, set SLA, auto-escalate if needed.
 */
export async function intakeComplaint(data: {
  source: string;
  category: string;
  summary: string;
  description: string;
  clientId?: string;
}): Promise<any> {
  // Generate complaint number
  const count = await prisma.complaint.count();
  const complaintNumber = `CMP-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  // Calculate SLA
  const slaDays = SLA_DAYS[data.source] || 7;
  const slaDeadline = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000);

  // AI Classification (using simple heuristics as fallback)
  const { classification, sentiment } = classifyComplaintLocal(data.description, data.category);

  const complaint = await prisma.complaint.create({
    data: {
      complaintNumber,
      source: data.source,
      category: data.category,
      summary: data.summary,
      description: data.description,
      clientId: data.clientId,
      aiClassification: classification,
      aiSentiment: sentiment,
      slaDeadline,
    },
  });

  // Auto-escalate if sentiment is very negative or source is regulatory
  if (sentiment === 'VERY_NEGATIVE' || data.source === 'REGULATORY') {
    await createEscalation({
      type: 'COMPLAINT',
      priority: data.source === 'REGULATORY' ? 'CRITICAL' : 'HIGH',
      title: `Complaint: ${data.summary}`,
      description: `Complaint ${complaintNumber}: ${data.description.substring(0, 500)}`,
      entityType: 'COMPLAINT',
      entityId: complaint.id,
    });
  }

  return complaint;
}

function classifyComplaintLocal(description: string, category: string): { classification: string; sentiment: string } {
  const lower = description.toLowerCase();

  // Sentiment analysis
  const negativeWords = ['terrible', 'awful', 'worst', 'horrible', 'unacceptable', 'disgusted', 'furious', 'lawsuit', 'attorney', 'sue'];
  const mildNegativeWords = ['disappointed', 'frustrated', 'unhappy', 'dissatisfied', 'concerned', 'upset'];

  const negCount = negativeWords.filter(w => lower.includes(w)).length;
  const mildCount = mildNegativeWords.filter(w => lower.includes(w)).length;

  let sentiment = 'NEUTRAL';
  if (negCount >= 2) sentiment = 'VERY_NEGATIVE';
  else if (negCount >= 1 || mildCount >= 2) sentiment = 'NEGATIVE';
  else if (mildCount >= 1) sentiment = 'NEGATIVE';

  // Classification
  let classification = category;
  if (lower.includes('claim') && lower.includes('denied')) classification = 'CLAIMS_DENIAL';
  else if (lower.includes('premium') || lower.includes('price') || lower.includes('bill')) classification = 'BILLING_DISPUTE';
  else if (lower.includes('agent') || lower.includes('representative')) classification = 'AGENT_CONDUCT';
  else if (lower.includes('cancel') || lower.includes('coverage')) classification = 'COVERAGE_ISSUE';

  return { classification, sentiment };
}
