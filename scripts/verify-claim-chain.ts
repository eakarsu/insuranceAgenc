import prisma from '../src/lib/prisma';
import { verifyCaseEventChain } from '../src/lib/claims-governance-rules';

async function main() {
  const claimId = process.env.CLAIM_ID;
  if (!claimId) throw new Error('CLAIM_ID is required');
  const events = await prisma.claimCaseEvent.findMany({ where: { claimId }, orderBy: { sequence: 'asc' } });
  if (!events.length) throw new Error(`No governed events found for claim ${claimId}`);
  if (!verifyCaseEventChain(events)) throw new Error(`Claim event chain failed for ${claimId}`);
  console.log(`verified ${events.length} claim events for ${claimId}`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
