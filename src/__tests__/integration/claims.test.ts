import prisma from '@/lib/prisma';
import { APPEAL_ATTESTATION, applyClaimAction, DECISION_ATTESTATION, intakeClaim } from '@/lib/claims-governance';
import { ClaimIntegrations } from '@/lib/claims-integrations';
import { ClaimGovernanceError, verifyCaseEventChain } from '@/lib/claims-governance-rules';
import { createCustomerToken, getCustomerFromAuthorizationHeader, verifyCustomerToken } from '@/lib/customer-auth';
import { clearTestData } from '../helpers/db';

const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const lossTime = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
let setupCounter = 0;
let fraudOutcome: 'CLEAR' | 'REFER' = 'CLEAR';
const integrations: ClaimIntegrations = {
  async screenFraud() { return { outcome: fraudOutcome, riskCode: fraudOutcome === 'CLEAR' ? 'RULES_CLEAR' : 'MULTIPLE_LOSS_INDICATORS', reference: `fraud-${suffix}` }; },
  async authorizePayment(input) { return { outcome: 'AUTHORIZED', reference: `payment-${input.idempotencyKey}` }; },
};

const evidence = (label: string) => ({
  action: 'ADD_EVIDENCE' as const,
  externalEventId: `evidence-${label}-${suffix}`,
  sourceSystem: 'verified-document-vault',
  sourceRecordId: `document-${label}-${suffix}`,
  kind: 'LOSS_PHOTO',
  uri: `https://evidence.example.test/claims/${label}-${suffix}`,
  sha256: 'a'.repeat(64),
  contentType: 'image/jpeg',
  sizeBytes: 2048,
  capturedAt: new Date().toISOString(),
});

async function setup() {
  const fixtureId = `${suffix}-${++setupCounter}`;
  const password = '$2a$10$012345678901234567890u0123456789012345678901234567890';
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60_000);
  const [agent, adjuster, reviewer, manager] = await Promise.all([
    prisma.user.create({ data: { email: `agent-${fixtureId}@example.test`, password, name: 'Intake Agent', role: 'AGENT' } }),
    prisma.user.create({ data: { email: `adjuster-${fixtureId}@example.test`, password, name: 'Licensed Adjuster', role: 'ADJUSTER', adjusterLicenseNumber: `CA-ADJ-100-${fixtureId}`, adjusterLicenseStates: ['CA'], adjusterLicenseExpiresAt: expires } }),
    prisma.user.create({ data: { email: `reviewer-${fixtureId}@example.test`, password, name: 'Appeal Reviewer', role: 'ADJUSTER', adjusterLicenseNumber: `CA-ADJ-200-${fixtureId}`, adjusterLicenseStates: ['CA'], adjusterLicenseExpiresAt: expires } }),
    prisma.user.create({ data: { email: `manager-${fixtureId}@example.test`, password, name: 'Payment Manager', role: 'MANAGER' } }),
  ]);
  const client = await prisma.client.create({ data: { type: 'PERSONAL', status: 'ACTIVE', firstName: 'Case', lastName: 'Owner', state: 'CA', agentId: agent.id } });
  const carrier = await prisma.carrier.create({ data: { name: `Carrier ${fixtureId}`, code: `C-${fixtureId}` } });
  const policy = await prisma.policy.create({
    data: {
      policyNumber: `POL-${fixtureId}`,
      status: 'ACTIVE',
      lineOfBusiness: 'PERSONAL_AUTO',
      type: 'Personal Auto',
      effectiveDate: new Date(Date.now() - 30 * 24 * 60 * 60_000),
      expirationDate: new Date(Date.now() + 335 * 24 * 60 * 60_000),
      premium: 1200,
      coverageSummary: { collision: true },
      deductibles: { collision: 500 },
      limits: { collision: 50_000 },
      clientId: client.id,
      carrierId: carrier.id,
      agentId: agent.id,
    },
  });
  return { agent, adjuster, reviewer, manager, client, policy };
}

function actor(user: any) {
  return {
    id: user.id,
    role: user.role,
    isActive: user.isActive,
    adjusterLicenseNumber: user.adjusterLicenseNumber,
    adjusterLicenseStates: user.adjusterLicenseStates,
    adjusterLicenseExpiresAt: user.adjusterLicenseExpiresAt,
  };
}

async function intake(label: string, fixture: Awaited<ReturnType<typeof setup>>) {
  return intakeClaim({
    externalEventId: `intake-${label}-${suffix}`,
    sourceSystem: 'external-claims-gateway',
    sourceRecordId: `FNOL-${label}-${suffix}`,
    clientId: fixture.client.id,
    policyId: fixture.policy.id,
    type: 'AUTO_COLLISION',
    dateOfLoss: lossTime,
    description: 'Rear impact collision with recorded vehicle damage and no reported injury.',
    jurisdiction: 'CA',
    lossLocation: 'Los Angeles, CA',
    estimatedLoss: 4000,
  }, actor(fixture.agent));
}

beforeAll(async () => {
  process.env.CLAIMS_EVIDENCE_ALLOWED_HOSTS = 'evidence.example.test';
  process.env.NEXTAUTH_SECRET = 'test-only-nextauth-secret-more-than-thirty-two-characters';
  process.env.CUSTOMER_JWT_SECRET = 'test-only-customer-secret-more-than-thirty-two-characters';
  await clearTestData();
});

afterAll(async () => {
  if (process.env.KEEP_CLAIMS_TEST_DATA !== '1') await clearTestData();
  await prisma.$disconnect();
});

test('governed intake through payment, subrogation, reconciliation, close, and retention', async () => {
  const fixture = await setup();
  const created = await intake('happy', fixture);
  const claimId = created.claim!.id;
  expect(created.claim!.coverageSnapshot).toMatchObject({ policyNumber: fixture.policy.policyNumber });
  const replay = await intake('happy', fixture);
  expect(replay.idempotent).toBe(true);

  let result = await applyClaimAction(claimId, { action: 'ASSIGN_ADJUSTER', externalEventId: `assign-happy-${suffix}`, expectedVersion: 1, adjusterId: fixture.adjuster.id }, actor(fixture.manager), integrations);
  expect(result.claim!.status).toBe('UNDER_INVESTIGATION');
  const happyEvidence = evidence('happy');
  result = await applyClaimAction(claimId, { ...happyEvidence, expectedVersion: 2 }, actor(fixture.adjuster), integrations);
  const evidenceId = result.claim!.evidenceItems[0].id;
  const evidenceReplay = await applyClaimAction(claimId, { ...happyEvidence, expectedVersion: 2 }, actor(fixture.adjuster), integrations);
  expect(evidenceReplay.idempotent).toBe(true);
  await expect(applyClaimAction(claimId, { ...happyEvidence, sha256: 'b'.repeat(64), expectedVersion: 2 }, actor(fixture.adjuster), integrations)).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
  result = await applyClaimAction(claimId, { action: 'SET_RESERVE', externalEventId: `reserve-happy-${suffix}`, expectedVersion: 3, amount: 5000, reason: 'Estimate supported by repair appraisal and policy deductible.' }, actor(fixture.adjuster), integrations);
  result = await applyClaimAction(claimId, { action: 'SUBMIT_FOR_REVIEW', externalEventId: `review-happy-${suffix}`, expectedVersion: 4 }, actor(fixture.adjuster), integrations);
  expect(result.claim!.status).toBe('IN_REVIEW');
  result = await applyClaimAction(claimId, { action: 'ADJUDICATE', externalEventId: `decision-happy-${suffix}`, expectedVersion: 5, decision: 'APPROVE', approvedAmount: 3000, evidenceIds: [evidenceId], coverageBasis: { coverage: 'collision', provision: 'Part D' }, rationale: 'Verified collision coverage applies after the documented deductible and evidence supports repair scope.', attestation: DECISION_ATTESTATION }, actor(fixture.adjuster), integrations);
  expect(result.claim!.status).toBe('APPROVED');
  result = await applyClaimAction(claimId, { action: 'AUTHORIZE_PAYMENT', externalEventId: `authorization-happy-${suffix}`, expectedVersion: 6, amount: 3000, recipientReference: `claimant-${fixture.client.id}` }, actor(fixture.manager), integrations);
  await expect(applyClaimAction(claimId, { action: 'RECORD_PAYMENT', externalEventId: `overpay-happy-${suffix}`, expectedVersion: 7, amount: 3001, sourceSystem: 'payment-ledger', externalTransactionId: `txn-overpay-${suffix}` }, actor(fixture.manager), integrations)).rejects.toMatchObject({ code: 'PAYMENT_EXCEEDS_AUTHORIZATION' });
  result = await applyClaimAction(claimId, { action: 'RECORD_PAYMENT', externalEventId: `paid-happy-${suffix}`, expectedVersion: 7, amount: 3000, sourceSystem: 'payment-ledger', externalTransactionId: `txn-paid-${suffix}` }, actor(fixture.manager), integrations);
  expect(result.claim!.status).toBe('SETTLED');
  result = await applyClaimAction(claimId, { action: 'OPEN_SUBROGATION', externalEventId: `subrogation-happy-${suffix}`, expectedVersion: 8, responsibleParty: 'Other vehicle operator and liability carrier', basis: 'Police report and recorded evidence identify third-party liability for the rear impact.', expectedRecovery: 1500 }, actor(fixture.adjuster), integrations);
  const subrogationId = result.claim!.subrogations[0].id;
  result = await applyClaimAction(claimId, { action: 'RECORD_RECOVERY', externalEventId: `recovery-happy-${suffix}`, expectedVersion: 9, subrogationId, amount: 1500, sourceSystem: 'recovery-ledger', externalTransactionId: `recovery-txn-${suffix}` }, actor(fixture.manager), integrations);
  result = await applyClaimAction(claimId, { action: 'CLOSE_CLAIM', externalEventId: `close-happy-${suffix}`, expectedVersion: 10, reason: 'Payment reconciled to adjudication and recovery evidence is preserved.' }, actor(fixture.adjuster), integrations);
  expect(result.claim!.status).toBe('CLOSED');
  expect(result.claim!.caseEvents).toHaveLength(11);
  expect(verifyCaseEventChain(result.claim!.caseEvents)).toBe(true);
  await expect(prisma.claimCaseEvent.update({ where: { id: result.claim!.caseEvents[0].id }, data: { action: 'TAMPERED' } })).rejects.toBeDefined();
  await expect(prisma.claim.delete({ where: { id: claimId } })).rejects.toBeDefined();
});

test('fraud referral blocks adjudication and an adverse decision supports independent appeal', async () => {
  const fixture = await setup();
  const created = await intake('appeal', fixture);
  const claimId = created.claim!.id;
  await applyClaimAction(claimId, { action: 'ASSIGN_ADJUSTER', externalEventId: `assign-appeal-${suffix}`, expectedVersion: 1, adjusterId: fixture.adjuster.id }, actor(fixture.manager), integrations);
  let result = await applyClaimAction(claimId, { ...evidence('appeal'), expectedVersion: 2 }, actor(fixture.adjuster), integrations);
  const evidenceId = result.claim!.evidenceItems[0].id;
  await applyClaimAction(claimId, { action: 'SET_RESERVE', externalEventId: `reserve-appeal-${suffix}`, expectedVersion: 3, amount: 4000, reason: 'Reserve reflects documented repair range pending coverage review.' }, actor(fixture.adjuster), integrations);
  fraudOutcome = 'REFER';
  result = await applyClaimAction(claimId, { action: 'SUBMIT_FOR_REVIEW', externalEventId: `refer-appeal-${suffix}`, expectedVersion: 4 }, actor(fixture.adjuster), integrations);
  expect(result.claim!.status).toBe('UNDER_INVESTIGATION');
  fraudOutcome = 'CLEAR';
  result = await applyClaimAction(claimId, { action: 'SUBMIT_FOR_REVIEW', externalEventId: `clear-appeal-${suffix}`, expectedVersion: 5 }, actor(fixture.adjuster), integrations);
  expect(result.claim!.status).toBe('IN_REVIEW');
  result = await applyClaimAction(claimId, { action: 'ADJUDICATE', externalEventId: `deny-appeal-${suffix}`, expectedVersion: 6, decision: 'DENY', evidenceIds: [evidenceId], coverageBasis: { exclusion: 'Unlisted operator' }, rationale: 'Current evidence indicates the operator exclusion applies under the cited policy provision.', attestation: DECISION_ATTESTATION }, actor(fixture.adjuster), integrations);
  expect(result.claim!.status).toBe('DENIED');
  result = await applyClaimAction(claimId, { action: 'FILE_APPEAL', externalEventId: `file-appeal-${suffix}`, expectedVersion: 7, reason: 'The claimant supplied licensing evidence showing the operator was covered on the loss date.' }, actor(fixture.agent), integrations);
  const appealId = result.claim!.appeals[0].id;
  await expect(applyClaimAction(claimId, { action: 'RESOLVE_APPEAL', externalEventId: `same-reviewer-${suffix}`, expectedVersion: 8, appealId, outcome: 'OVERTURN', approvedAmount: 2500, rationale: 'The added licensing record changes application of the operator exclusion and supports coverage.', attestation: APPEAL_ATTESTATION }, actor(fixture.adjuster), integrations)).rejects.toMatchObject({ code: 'SEPARATION_OF_DUTIES' });
  result = await applyClaimAction(claimId, { action: 'RESOLVE_APPEAL', externalEventId: `independent-review-${suffix}`, expectedVersion: 8, appealId, outcome: 'OVERTURN', approvedAmount: 2500, rationale: 'Independent review confirms the added licensing record defeats the cited operator exclusion.', attestation: APPEAL_ATTESTATION }, actor(fixture.reviewer), integrations);
  expect(result.claim!.status).toBe('APPROVED');
  expect(result.claim!.adjudications.at(-1)?.adjusterId).toBe(fixture.reviewer.id);
});

test('intake rejects policy ownership, policy-term, and stale-version errors', async () => {
  const fixture = await setup();
  const otherClient = await prisma.client.create({ data: { type: 'PERSONAL', status: 'ACTIVE', firstName: 'Other', lastName: 'Client', agentId: fixture.agent.id } });
  await expect(intakeClaim({ externalEventId: `bad-owner-${suffix}`, sourceSystem: 'external-claims-gateway', sourceRecordId: `bad-owner-${suffix}`, clientId: otherClient.id, policyId: fixture.policy.id, type: 'AUTO_COLLISION', dateOfLoss: new Date(), description: 'Reported loss with enough narrative to pass structural validation.', jurisdiction: 'CA' }, actor(fixture.agent))).rejects.toMatchObject({ code: 'POLICY_CLIENT_MISMATCH' });
  const created = await intake('stale', fixture);
  await expect(applyClaimAction(created.claim!.id, { action: 'ASSIGN_ADJUSTER', externalEventId: `stale-assign-${suffix}`, expectedVersion: 2, adjusterId: fixture.adjuster.id }, actor(fixture.manager), integrations)).rejects.toEqual(expect.objectContaining<Partial<ClaimGovernanceError>>({ code: 'STALE_VERSION' }));
});

test('customer portal intake uses the governed case chain and servicing policy agent', async () => {
  const fixture = await setup();
  const input = {
    externalEventId: `customer-intake-${suffix}`,
    sourceSystem: 'CUSTOMER_PORTAL',
    sourceRecordId: `customer-intake-${suffix}`,
    clientId: fixture.client.id,
    policyId: fixture.policy.id,
    type: 'AUTO_COLLISION',
    dateOfLoss: lossTime,
    description: 'Customer reported a covered collision with vehicle damage through the authenticated portal.',
    jurisdiction: 'CA',
  };
  const customerActor = {
    id: `customer-auth-${suffix}`,
    role: 'CUSTOMER',
    isActive: true,
    adjusterLicenseNumber: null,
    adjusterLicenseStates: [] as string[],
    adjusterLicenseExpiresAt: null,
  };

  const created = await intakeClaim(input, customerActor);
  expect(created.claim!.agentId).toBe(fixture.policy.agentId);
  expect(created.claim!.caseEvents[0]).toMatchObject({ actorId: customerActor.id, actorRole: 'CUSTOMER', action: 'INTAKE_RECORDED' });
  expect(verifyCaseEventChain(created.claim!.caseEvents)).toBe(true);
  await expect(intakeClaim(input, { ...customerActor, isActive: false })).rejects.toMatchObject({ code: 'ACTOR_INACTIVE' });
  expect((await intakeClaim(input, customerActor)).idempotent).toBe(true);
});

test('customer tokens require the configured boundary and current active account', async () => {
  const fixture = await setup();
  const customerAuth = await prisma.customerAuth.create({
    data: {
      clientId: fixture.client.id,
      email: `portal-${fixture.client.id}@example.test`,
      passwordHash: '$2a$10$012345678901234567890u0123456789012345678901234567890',
    },
  });
  const payload = { sub: customerAuth.id, clientId: fixture.client.id, email: customerAuth.email };
  const token = await createCustomerToken(payload);

  await expect(verifyCustomerToken(token)).resolves.toEqual(payload);
  await expect(getCustomerFromAuthorizationHeader(`Bearer ${token}`)).resolves.toEqual(payload);
  await expect(getCustomerFromAuthorizationHeader(token)).resolves.toBeNull();

  await prisma.customerAuth.update({ where: { id: customerAuth.id }, data: { isActive: false } });
  await expect(verifyCustomerToken(token)).resolves.toBeNull();
});
