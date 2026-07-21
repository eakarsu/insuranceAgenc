import { randomUUID } from 'crypto';
import { ClaimStatus, Prisma } from '@prisma/client';
import prisma from './prisma';
import {
  assertActionAllowed,
  assertLicensedAdjuster,
  assertPolicyCoverage,
  assertReconciled,
  assertRoles,
  ClaimGovernanceError,
  ClaimWorkflowAction,
  sha256,
  stableJson,
  validateEvidence,
} from './claims-governance-rules';
import { ClaimIntegrations, runtimeClaimIntegrations } from './claims-integrations';
import { getClaimsRuntimeConfig } from './claims-runtime-config';

export const DECISION_ATTESTATION = 'I attest this claim decision is based on verified policy terms and recorded evidence';
export const APPEAL_ATTESTATION = 'I attest this appeal received an independent licensed review of the complete case record';

export interface ClaimActor {
  id: string;
  role: string;
  isActive: boolean;
  adjusterLicenseNumber: string | null;
  adjusterLicenseStates: string[];
  adjusterLicenseExpiresAt: Date | null;
}

export interface ClaimIntakeInput {
  externalEventId: string;
  sourceSystem: string;
  sourceRecordId: string;
  clientId: string;
  policyId: string;
  type: string;
  dateOfLoss: string | Date;
  description: string;
  jurisdiction: string;
  lossLocation?: string | null;
  estimatedLoss?: number | string | null;
}

export interface ClaimActionInput {
  action: ClaimWorkflowAction;
  externalEventId: string;
  expectedVersion: number;
  [key: string]: unknown;
}

function text(value: unknown, name: string, min = 1, max = 5000): string {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
    throw new ClaimGovernanceError(422, 'INVALID_INPUT', `${name} must contain ${min}-${max} characters`);
  }
  return value.trim();
}

function money(value: unknown, name: string, allowZero = false): number {
  const parsed = typeof value === 'string' && value.trim() ? Number(value) : Number(value);
  if (!Number.isFinite(parsed) || parsed < (allowZero ? 0 : 0.01) || parsed > 1_000_000_000) {
    throw new ClaimGovernanceError(422, 'INVALID_INPUT', `${name} is outside the supported monetary range`);
  }
  return Math.round(parsed * 100) / 100;
}

function eventId(value: unknown): string {
  return text(value, 'externalEventId', 8, 160);
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(stableJson(value)) as Prisma.InputJsonValue;
}

function asRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

async function appendCaseEvent(
  tx: Prisma.TransactionClient,
  input: {
    claimId: string;
    action: string;
    fromStatus: ClaimStatus | null;
    toStatus: ClaimStatus | null;
    actor: ClaimActor;
    externalEventId: string;
    requestHash: string;
    payload: Record<string, unknown>;
  },
) {
  const prior = await tx.claimCaseEvent.findFirst({ where: { claimId: input.claimId }, orderBy: { sequence: 'desc' } });
  const sequence = (prior?.sequence || 0) + 1;
  const previousHash = prior?.eventHash || 'GENESIS';
  const occurredAt = new Date();
  const payload = { requestHash: input.requestHash, ...input.payload };
  const payloadHash = sha256(stableJson(payload));
  const eventHash = sha256(stableJson({
    sequence,
    action: input.action,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    actorId: input.actor.id,
    actorRole: input.actor.role,
    externalEventId: input.externalEventId,
    payloadHash,
    previousHash,
    occurredAt: occurredAt.toISOString(),
  }));
  return tx.claimCaseEvent.create({
    data: {
      claimId: input.claimId,
      sequence,
      action: input.action,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      actorId: input.actor.id,
      actorRole: input.actor.role,
      externalEventId: input.externalEventId,
      payload: asJson(payload),
      payloadHash,
      previousHash,
      eventHash,
      occurredAt,
    },
  });
}

export async function getGovernedClaim(claimId: string) {
  return prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, businessName: true } },
      policy: { include: { carrier: true } },
      agent: { select: { id: true, name: true, email: true } },
      documents: { orderBy: { uploadedAt: 'desc' } },
      communications: { orderBy: { createdAt: 'desc' } },
      settlements: { orderBy: { createdAt: 'desc' } },
      activities: { take: 20, orderBy: { createdAt: 'desc' } },
      fraudAssessments: { orderBy: { createdAt: 'desc' } },
      evidenceItems: { orderBy: { createdAt: 'asc' } },
      reserveEntries: { orderBy: { createdAt: 'asc' } },
      adjudications: { orderBy: { createdAt: 'asc' } },
      appeals: { include: { decision: true }, orderBy: { createdAt: 'asc' } },
      subrogations: { include: { recoveryEntries: true }, orderBy: { createdAt: 'asc' } },
      financialEntries: { orderBy: { createdAt: 'asc' } },
      integrationEvents: { orderBy: { occurredAt: 'asc' } },
      caseEvents: { orderBy: { sequence: 'asc' } },
    },
  });
}

export async function intakeClaim(input: ClaimIntakeInput, actor: ClaimActor) {
  assertRoles(actor.role, ['ADMIN', 'MANAGER', 'ADJUSTER', 'AGENT', 'CSR', 'CUSTOMER']);
  if (!actor.isActive) throw new ClaimGovernanceError(401, 'ACTOR_INACTIVE', 'The intake actor is inactive');
  const normalized = {
    externalEventId: eventId(input.externalEventId),
    sourceSystem: text(input.sourceSystem, 'sourceSystem', 2, 100),
    sourceRecordId: text(input.sourceRecordId, 'sourceRecordId', 2, 160),
    clientId: text(input.clientId, 'clientId', 8, 100),
    policyId: text(input.policyId, 'policyId', 8, 100),
    type: text(input.type, 'type', 2, 100),
    dateOfLoss: new Date(input.dateOfLoss),
    description: text(input.description, 'description', 20, 10_000),
    jurisdiction: text(input.jurisdiction, 'jurisdiction', 2, 2).toUpperCase(),
    lossLocation: input.lossLocation ? text(input.lossLocation, 'lossLocation', 3, 500) : null,
    estimatedLoss: input.estimatedLoss == null ? null : money(input.estimatedLoss, 'estimatedLoss'),
  };
  if (Number.isNaN(normalized.dateOfLoss.getTime()) || normalized.dateOfLoss.getTime() > Date.now() + 5 * 60_000) {
    throw new ClaimGovernanceError(422, 'INVALID_DATE_OF_LOSS', 'Date of loss is invalid or future-dated');
  }
  if (!/^[A-Z]{2}$/.test(normalized.jurisdiction)) {
    throw new ClaimGovernanceError(422, 'INVALID_JURISDICTION', 'Jurisdiction must be a two-letter state code');
  }
  const requestHash = sha256(stableJson({ ...normalized, dateOfLoss: normalized.dateOfLoss.toISOString() }));

  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${normalized.externalEventId}))`;
    const replay = await tx.claim.findUnique({ where: { intakeEventId: normalized.externalEventId } });
    if (replay) {
      if (replay.intakePayloadHash !== requestHash) {
        throw new ClaimGovernanceError(409, 'IDEMPOTENCY_CONFLICT', 'Intake event was already used with different content');
      }
      return { claimId: replay.id, idempotent: true };
    }
    const policy = await tx.policy.findUnique({ where: { id: normalized.policyId }, include: { carrier: true } });
    if (!policy) throw new ClaimGovernanceError(404, 'POLICY_NOT_FOUND', 'Policy was not found');
    assertPolicyCoverage(policy, normalized.clientId, normalized.dateOfLoss);
    const coverageSnapshot = {
      policyNumber: policy.policyNumber,
      status: policy.status,
      lineOfBusiness: policy.lineOfBusiness,
      effectiveDate: policy.effectiveDate.toISOString(),
      expirationDate: policy.expirationDate.toISOString(),
      cancelDate: policy.cancelDate?.toISOString() || null,
      coverageSummary: policy.coverageSummary,
      deductibles: policy.deductibles,
      limits: policy.limits,
      carrier: { id: policy.carrier.id, code: policy.carrier.code, name: policy.carrier.name },
      capturedAt: new Date().toISOString(),
    };
    const claim = await tx.claim.create({
      data: {
        claimNumber: `CLM-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 12).toUpperCase()}`,
        clientId: normalized.clientId,
        policyId: normalized.policyId,
        agentId: actor.role === 'CUSTOMER' ? policy.agentId : actor.id,
        type: normalized.type,
        status: 'REPORTED',
        dateOfLoss: normalized.dateOfLoss,
        description: normalized.description,
        lossLocation: normalized.lossLocation,
        estimatedLoss: normalized.estimatedLoss,
        jurisdiction: normalized.jurisdiction,
        intakeEventId: normalized.externalEventId,
        intakePayloadHash: requestHash,
        sourceSystem: normalized.sourceSystem,
        sourceRecordId: normalized.sourceRecordId,
        coverageSnapshot: asJson(coverageSnapshot),
      },
    });
    await tx.claimIntegrationEvent.create({
      data: {
        claimId: claim.id,
        externalEventId: normalized.externalEventId,
        direction: 'INBOUND',
        adapter: 'CLAIMS_INTAKE',
        operation: 'REPORT_CLAIM',
        sourceRecordId: normalized.sourceRecordId,
        payloadHash: requestHash,
        outcome: 'ACCEPTED',
        responseRef: claim.claimNumber,
      },
    });
    await appendCaseEvent(tx, {
      claimId: claim.id,
      action: 'INTAKE_RECORDED',
      fromStatus: null,
      toStatus: 'REPORTED',
      actor,
      externalEventId: normalized.externalEventId,
      requestHash,
      payload: { sourceSystem: normalized.sourceSystem, sourceRecordId: normalized.sourceRecordId, coverageSnapshot },
    });
    return { claimId: claim.id, idempotent: false };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  return { claim: await getGovernedClaim(result.claimId), idempotent: result.idempotent };
}

function assertAssigned(claim: { assignedAdjusterId: string | null }, actor: ClaimActor): void {
  if (actor.role === 'ADJUSTER' && claim.assignedAdjusterId !== actor.id) {
    throw new ClaimGovernanceError(403, 'NOT_ASSIGNED', 'Only the assigned adjuster may perform this action');
  }
}

async function replayResult(claimId: string, externalEventId: string, requestHash: string) {
  const event = await prisma.claimCaseEvent.findUnique({ where: { externalEventId } });
  if (!event) return null;
  if (event.claimId !== claimId || asRecord(event.payload).requestHash !== requestHash) {
    throw new ClaimGovernanceError(409, 'IDEMPOTENCY_CONFLICT', 'Event identifier was already used with different content');
  }
  return { claim: await getGovernedClaim(claimId), idempotent: true };
}

export async function applyClaimAction(
  claimId: string,
  rawInput: ClaimActionInput,
  actor: ClaimActor,
  integrations: ClaimIntegrations = runtimeClaimIntegrations(),
) {
  const action = rawInput.action;
  if (!action || ![
    'ASSIGN_ADJUSTER', 'ADD_EVIDENCE', 'SET_RESERVE', 'SUBMIT_FOR_REVIEW', 'ADJUDICATE',
    'FILE_APPEAL', 'RESOLVE_APPEAL', 'AUTHORIZE_PAYMENT', 'RECORD_PAYMENT',
    'OPEN_SUBROGATION', 'RECORD_RECOVERY', 'CLOSE_CLAIM',
  ].includes(action)) throw new ClaimGovernanceError(422, 'INVALID_ACTION', 'Unsupported claim workflow action');
  const externalEventId = eventId(rawInput.externalEventId);
  const expectedVersion = Number(rawInput.expectedVersion);
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
    throw new ClaimGovernanceError(422, 'INVALID_INPUT', 'expectedVersion must be a positive integer');
  }
  const requestHash = sha256(stableJson({ claimId, ...rawInput, externalEventId, expectedVersion }));
  const replay = await replayResult(claimId, externalEventId, requestHash);
  if (replay) return replay;

  let externalOutcome: Record<string, unknown> | null = null;
  if (action === 'SUBMIT_FOR_REVIEW' || action === 'AUTHORIZE_PAYMENT') {
    const current = await getGovernedClaim(claimId);
    if (!current) throw new ClaimGovernanceError(404, 'CLAIM_NOT_FOUND', 'Claim was not found');
    if (current.workflowVersion !== expectedVersion) throw new ClaimGovernanceError(409, 'STALE_VERSION', 'Claim version is stale');
    assertActionAllowed(current.status, action);
    if (action === 'SUBMIT_FOR_REVIEW') {
      assertLicensedAdjuster(actor, current.jurisdiction || '');
      assertAssigned(current, actor);
      if (!current.evidenceItems.length || Number(current.reserveAmount || 0) <= 0) {
        throw new ClaimGovernanceError(422, 'REVIEW_EVIDENCE_INCOMPLETE', 'Review requires recorded evidence and a positive reserve');
      }
      externalOutcome = await integrations.screenFraud({
        claimId,
        claimNumber: current.claimNumber,
        policyNumber: current.policy.policyNumber,
        estimatedLoss: Number(current.estimatedLoss || 0),
        evidenceDigests: current.evidenceItems.map((item) => item.sha256),
        idempotencyKey: externalEventId,
      }) as unknown as Record<string, unknown>;
    } else {
      assertRoles(actor.role, ['MANAGER', 'ADMIN']);
      const adjudication = current.adjudications.at(-1);
      if (!adjudication || adjudication.decision !== 'APPROVE' || !adjudication.approvedAmount) {
        throw new ClaimGovernanceError(422, 'NO_PAYABLE_ADJUDICATION', 'Claim has no payable adjudication');
      }
      if (adjudication.adjusterId === actor.id) {
        throw new ClaimGovernanceError(409, 'SEPARATION_OF_DUTIES', 'The adjudicator cannot authorize payment');
      }
      const amount = money(rawInput.amount, 'amount');
      const authorized = current.financialEntries.filter((item) => item.kind === 'PAYMENT_AUTHORIZED').reduce((sum, item) => sum + Number(item.amount), 0);
      assertReconciled({ reserveAmount: Number(current.reserveAmount || 0), approvedAmount: Number(adjudication.approvedAmount), authorizedAmount: authorized + amount, paidAmount: Number(current.paidAmount || 0) });
      externalOutcome = await integrations.authorizePayment({
        claimId,
        claimNumber: current.claimNumber,
        amount,
        recipientReference: text(rawInput.recipientReference, 'recipientReference', 6, 160),
        idempotencyKey: externalEventId,
      }) as unknown as Record<string, unknown>;
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${claimId}))`;
    const existing = await tx.claimCaseEvent.findUnique({ where: { externalEventId } });
    if (existing) {
      if (existing.claimId !== claimId || asRecord(existing.payload).requestHash !== requestHash) {
        throw new ClaimGovernanceError(409, 'IDEMPOTENCY_CONFLICT', 'Event identifier was already used with different content');
      }
      return { idempotent: true };
    }
    const claim = await tx.claim.findUnique({
      where: { id: claimId },
      include: {
        evidenceItems: true,
        adjudications: { orderBy: { createdAt: 'asc' } },
        appeals: { include: { decision: true }, orderBy: { createdAt: 'asc' } },
        subrogations: { include: { recoveryEntries: true } },
        financialEntries: true,
      },
    });
    if (!claim) throw new ClaimGovernanceError(404, 'CLAIM_NOT_FOUND', 'Claim was not found');
    if (claim.workflowVersion !== expectedVersion) throw new ClaimGovernanceError(409, 'STALE_VERSION', 'Claim version is stale');
    assertActionAllowed(claim.status, action);
    const fromStatus = claim.status;
    let toStatus = claim.status;
    const payload: Record<string, unknown> = { action };

    if (action === 'ASSIGN_ADJUSTER') {
      assertRoles(actor.role, ['MANAGER', 'ADMIN']);
      const adjusterId = text(rawInput.adjusterId, 'adjusterId', 8, 100);
      const adjuster = await tx.user.findUnique({ where: { id: adjusterId } });
      if (!adjuster?.isActive) throw new ClaimGovernanceError(404, 'ADJUSTER_NOT_FOUND', 'Active adjuster was not found');
      assertLicensedAdjuster(adjuster, claim.jurisdiction || '');
      toStatus = 'UNDER_INVESTIGATION';
      payload.adjusterId = adjuster.id;
      payload.licenseNumber = adjuster.adjusterLicenseNumber;
      await tx.claim.update({ where: { id: claimId }, data: { assignedAdjusterId: adjuster.id, status: toStatus, workflowVersion: { increment: 1 } } });
    } else if (action === 'ADD_EVIDENCE') {
      assertLicensedAdjuster(actor, claim.jurisdiction || '');
      assertAssigned(claim, actor);
      const evidence = {
        sourceSystem: text(rawInput.sourceSystem, 'sourceSystem', 2, 100),
        sourceRecordId: text(rawInput.sourceRecordId, 'sourceRecordId', 2, 160),
        kind: text(rawInput.kind, 'kind', 2, 80).toUpperCase(),
        uri: text(rawInput.uri, 'uri', 10, 2000),
        sha256: text(rawInput.sha256, 'sha256', 64, 64).toLowerCase(),
        contentType: text(rawInput.contentType, 'contentType', 3, 120),
        sizeBytes: Number(rawInput.sizeBytes),
        capturedAt: new Date(String(rawInput.capturedAt)),
      };
      validateEvidence(evidence, getClaimsRuntimeConfig().evidenceHosts);
      const evidencePayloadHash = sha256(stableJson({ claimId, ...evidence, capturedAt: evidence.capturedAt.toISOString() }));
      const created = await tx.claimEvidence.create({ data: { claimId, externalEventId, ...evidence, recordedBy: actor.id, payloadHash: evidencePayloadHash } });
      payload.evidenceId = created.id;
      payload.evidenceDigest = created.sha256;
      await tx.claim.update({ where: { id: claimId }, data: { workflowVersion: { increment: 1 } } });
    } else if (action === 'SET_RESERVE') {
      assertLicensedAdjuster(actor, claim.jurisdiction || '');
      assertAssigned(claim, actor);
      const newAmount = money(rawInput.amount, 'amount', true);
      const previousAmount = Number(claim.reserveAmount || 0);
      const reason = text(rawInput.reason, 'reason', 20, 2000);
      await tx.claimReserveEntry.create({ data: { claimId, externalEventId, previousAmount, newAmount, deltaAmount: newAmount - previousAmount, reason, actorId: actor.id } });
      await tx.claimFinancialEntry.create({ data: { claimId, kind: 'RESERVE_CHANGE', amount: newAmount - previousAmount, externalEventId, sourceSystem: 'INTERNAL_LEDGER', payloadHash: requestHash, recordedBy: actor.id } });
      await tx.claim.update({ where: { id: claimId }, data: { reserveAmount: newAmount, workflowVersion: { increment: 1 } } });
      Object.assign(payload, { previousAmount, newAmount, reason });
    } else if (action === 'SUBMIT_FOR_REVIEW') {
      assertLicensedAdjuster(actor, claim.jurisdiction || '');
      assertAssigned(claim, actor);
      if (!claim.evidenceItems.length || Number(claim.reserveAmount || 0) <= 0) throw new ClaimGovernanceError(422, 'REVIEW_EVIDENCE_INCOMPLETE', 'Review requires recorded evidence and a positive reserve');
      if (!externalOutcome) throw new ClaimGovernanceError(502, 'INTEGRATION_FAILURE', 'Fraud screening result is missing');
      toStatus = externalOutcome.outcome === 'CLEAR' ? 'IN_REVIEW' : 'UNDER_INVESTIGATION';
      await tx.claimIntegrationEvent.create({ data: { claimId, externalEventId: `${externalEventId}:fraud`, direction: 'OUTBOUND', adapter: 'FRAUD_RULES', operation: 'SCREEN_CLAIM', sourceRecordId: claim.claimNumber, payloadHash: requestHash, outcome: String(externalOutcome.outcome), responseRef: String(externalOutcome.reference) } });
      await tx.claim.update({ where: { id: claimId }, data: { status: toStatus, workflowVersion: { increment: 1 } } });
      Object.assign(payload, { fraudOutcome: externalOutcome.outcome, fraudRiskCode: externalOutcome.riskCode, fraudReference: externalOutcome.reference });
    } else if (action === 'ADJUDICATE') {
      assertLicensedAdjuster(actor, claim.jurisdiction || '');
      assertAssigned(claim, actor);
      const decision = text(rawInput.decision, 'decision', 4, 7).toUpperCase();
      if (!['APPROVE', 'DENY'].includes(decision)) throw new ClaimGovernanceError(422, 'INVALID_DECISION', 'Decision must be APPROVE or DENY');
      if (rawInput.attestation !== DECISION_ATTESTATION) throw new ClaimGovernanceError(422, 'ATTESTATION_REQUIRED', 'Exact adjudication attestation is required');
      const rationale = text(rawInput.rationale, 'rationale', 40, 5000);
      const evidenceIds = Array.isArray(rawInput.evidenceIds) ? Array.from(new Set(rawInput.evidenceIds.map(String))) : [];
      if (!evidenceIds.length || evidenceIds.some((id) => !claim.evidenceItems.some((item) => item.id === id))) {
        throw new ClaimGovernanceError(422, 'EVIDENCE_REQUIRED', 'Decision evidence must belong to this claim');
      }
      const approvedAmount = decision === 'APPROVE' ? money(rawInput.approvedAmount, 'approvedAmount') : null;
      if (approvedAmount != null) assertReconciled({ reserveAmount: Number(claim.reserveAmount || 0), approvedAmount, authorizedAmount: 0, paidAmount: 0 });
      const coverageBasis = rawInput.coverageBasis && typeof rawInput.coverageBasis === 'object' ? rawInput.coverageBasis : null;
      if (!coverageBasis || !Object.keys(coverageBasis).length) throw new ClaimGovernanceError(422, 'COVERAGE_BASIS_REQUIRED', 'Decision requires cited policy coverage rules');
      await tx.claimAdjudication.create({ data: { claimId, externalEventId, decision, approvedAmount, jurisdiction: claim.jurisdiction || '', coverageBasis: asJson(coverageBasis), evidenceIds: asJson(evidenceIds), rationale, adjusterId: actor.id, adjusterLicenseNumber: actor.adjusterLicenseNumber!, attestation: DECISION_ATTESTATION } });
      toStatus = decision === 'APPROVE' ? 'APPROVED' : 'DENIED';
      await tx.claim.update({ where: { id: claimId }, data: { status: toStatus, workflowVersion: { increment: 1 } } });
      Object.assign(payload, { decision, approvedAmount, evidenceIds, coverageBasis, rationale, adjusterLicenseNumber: actor.adjusterLicenseNumber, attestation: DECISION_ATTESTATION });
    } else if (action === 'FILE_APPEAL') {
      assertRoles(actor.role, ['ADMIN', 'MANAGER', 'ADJUSTER', 'AGENT', 'CSR']);
      const reason = text(rawInput.reason, 'reason', 40, 5000);
      const appeal = await tx.claimAppeal.create({ data: { claimId, externalEventId, reason, submittedBy: actor.id } });
      toStatus = 'REOPENED';
      await tx.claim.update({ where: { id: claimId }, data: { status: toStatus, workflowVersion: { increment: 1 } } });
      Object.assign(payload, { appealId: appeal.id, reason });
    } else if (action === 'RESOLVE_APPEAL') {
      assertLicensedAdjuster(actor, claim.jurisdiction || '');
      const appealId = text(rawInput.appealId, 'appealId', 8, 100);
      const appeal = claim.appeals.find((item) => item.id === appealId);
      if (!appeal || appeal.decision) throw new ClaimGovernanceError(409, 'APPEAL_NOT_OPEN', 'Open appeal was not found');
      const original = claim.adjudications.at(-1);
      if (!original || original.adjusterId === actor.id) throw new ClaimGovernanceError(409, 'SEPARATION_OF_DUTIES', 'Appeal reviewer must be independent of the original adjudicator');
      if (rawInput.attestation !== APPEAL_ATTESTATION) throw new ClaimGovernanceError(422, 'ATTESTATION_REQUIRED', 'Exact appeal attestation is required');
      const outcome = text(rawInput.outcome, 'outcome', 6, 10).toUpperCase();
      if (!['UPHOLD', 'OVERTURN'].includes(outcome)) throw new ClaimGovernanceError(422, 'INVALID_APPEAL_OUTCOME', 'Outcome must be UPHOLD or OVERTURN');
      const rationale = text(rawInput.rationale, 'rationale', 40, 5000);
      const approvedAmount = outcome === 'OVERTURN' ? money(rawInput.approvedAmount, 'approvedAmount') : null;
      if (approvedAmount != null) assertReconciled({ reserveAmount: Number(claim.reserveAmount || 0), approvedAmount, authorizedAmount: 0, paidAmount: 0 });
      await tx.claimAppealDecision.create({ data: { appealId, externalEventId, outcome, approvedAmount, rationale, reviewedBy: actor.id, reviewerLicenseNumber: actor.adjusterLicenseNumber!, attestation: APPEAL_ATTESTATION } });
      if (outcome === 'OVERTURN') {
        await tx.claimAdjudication.create({
          data: {
            claimId,
            externalEventId,
            decision: 'APPROVE',
            approvedAmount,
            jurisdiction: claim.jurisdiction || '',
            coverageBasis: original.coverageBasis as Prisma.InputJsonValue,
            evidenceIds: original.evidenceIds as Prisma.InputJsonValue,
            rationale,
            adjusterId: actor.id,
            adjusterLicenseNumber: actor.adjusterLicenseNumber!,
            attestation: APPEAL_ATTESTATION,
          },
        });
      }
      toStatus = outcome === 'OVERTURN' ? 'APPROVED' : 'DENIED';
      await tx.claim.update({ where: { id: claimId }, data: { status: toStatus, workflowVersion: { increment: 1 } } });
      Object.assign(payload, { appealId, outcome, approvedAmount, rationale, reviewerLicenseNumber: actor.adjusterLicenseNumber, attestation: APPEAL_ATTESTATION });
    } else if (action === 'AUTHORIZE_PAYMENT') {
      assertRoles(actor.role, ['MANAGER', 'ADMIN']);
      if (!externalOutcome) throw new ClaimGovernanceError(502, 'INTEGRATION_FAILURE', 'Payment authorization result is missing');
      if (externalOutcome.outcome !== 'AUTHORIZED') throw new ClaimGovernanceError(422, 'PAYMENT_DECLINED', 'Payment provider declined authorization', externalOutcome);
      const amount = money(rawInput.amount, 'amount');
      const adjudication = claim.adjudications.at(-1)!;
      if (adjudication.adjusterId === actor.id) throw new ClaimGovernanceError(409, 'SEPARATION_OF_DUTIES', 'The adjudicator cannot authorize payment');
      const authorized = claim.financialEntries.filter((item) => item.kind === 'PAYMENT_AUTHORIZED').reduce((sum, item) => sum + Number(item.amount), 0);
      assertReconciled({ reserveAmount: Number(claim.reserveAmount || 0), approvedAmount: Number(adjudication.approvedAmount || 0), authorizedAmount: authorized + amount, paidAmount: Number(claim.paidAmount || 0) });
      await tx.claimFinancialEntry.create({ data: { claimId, kind: 'PAYMENT_AUTHORIZED', amount, externalEventId, sourceSystem: 'PAYMENT_PROVIDER', externalTransactionId: String(externalOutcome.reference), payloadHash: requestHash, recordedBy: actor.id } });
      await tx.claimIntegrationEvent.create({ data: { claimId, externalEventId: `${externalEventId}:payment`, direction: 'OUTBOUND', adapter: 'PAYMENT_PROVIDER', operation: 'AUTHORIZE_PAYMENT', sourceRecordId: claim.claimNumber, payloadHash: requestHash, outcome: 'AUTHORIZED', responseRef: String(externalOutcome.reference) } });
      await tx.claim.update({ where: { id: claimId }, data: { workflowVersion: { increment: 1 } } });
      Object.assign(payload, { amount, paymentReference: externalOutcome.reference, recipientReference: rawInput.recipientReference });
    } else if (action === 'RECORD_PAYMENT') {
      assertRoles(actor.role, ['MANAGER', 'ADMIN']);
      const amount = money(rawInput.amount, 'amount');
      const sourceSystem = text(rawInput.sourceSystem, 'sourceSystem', 2, 100);
      const externalTransactionId = text(rawInput.externalTransactionId, 'externalTransactionId', 6, 160);
      const adjudication = claim.adjudications.at(-1)!;
      const authorized = claim.financialEntries.filter((item) => item.kind === 'PAYMENT_AUTHORIZED').reduce((sum, item) => sum + Number(item.amount), 0);
      const paid = claim.financialEntries.filter((item) => item.kind === 'PAYMENT_SENT').reduce((sum, item) => sum + Number(item.amount), 0) + amount;
      assertReconciled({ reserveAmount: Number(claim.reserveAmount || 0), approvedAmount: Number(adjudication.approvedAmount || 0), authorizedAmount: authorized, paidAmount: paid });
      await tx.claimFinancialEntry.create({ data: { claimId, kind: 'PAYMENT_SENT', amount, externalEventId, sourceSystem, externalTransactionId, payloadHash: requestHash, recordedBy: actor.id } });
      toStatus = paid === Number(adjudication.approvedAmount) ? 'SETTLED' : 'APPROVED';
      await tx.claim.update({ where: { id: claimId }, data: { paidAmount: paid, status: toStatus, workflowVersion: { increment: 1 } } });
      Object.assign(payload, { amount, sourceSystem, externalTransactionId, reconciledPaidAmount: paid });
    } else if (action === 'OPEN_SUBROGATION') {
      assertLicensedAdjuster(actor, claim.jurisdiction || '');
      const responsibleParty = text(rawInput.responsibleParty, 'responsibleParty', 3, 300);
      const basis = text(rawInput.basis, 'basis', 30, 5000);
      const expectedRecovery = money(rawInput.expectedRecovery, 'expectedRecovery');
      const subrogation = await tx.claimSubrogation.create({ data: { claimId, externalEventId, responsibleParty, basis, expectedRecovery, openedBy: actor.id } });
      await tx.claim.update({ where: { id: claimId }, data: { workflowVersion: { increment: 1 } } });
      Object.assign(payload, { subrogationId: subrogation.id, responsibleParty, basis, expectedRecovery });
    } else if (action === 'RECORD_RECOVERY') {
      assertRoles(actor.role, ['MANAGER', 'ADMIN']);
      const subrogationId = text(rawInput.subrogationId, 'subrogationId', 8, 100);
      const subrogation = claim.subrogations.find((item) => item.id === subrogationId);
      if (!subrogation) throw new ClaimGovernanceError(404, 'SUBROGATION_NOT_FOUND', 'Subrogation record was not found');
      const amount = money(rawInput.amount, 'amount');
      const recovered = subrogation.recoveryEntries.reduce((sum, item) => sum + Number(item.amount), 0) + amount;
      if (recovered > Number(subrogation.expectedRecovery)) throw new ClaimGovernanceError(422, 'RECOVERY_EXCEEDS_EXPECTED', 'Recovery exceeds the documented subrogation amount');
      const sourceSystem = text(rawInput.sourceSystem, 'sourceSystem', 2, 100);
      const externalTransactionId = text(rawInput.externalTransactionId, 'externalTransactionId', 6, 160);
      await tx.claimRecoveryEntry.create({ data: { subrogationId, externalEventId, amount, sourceSystem, externalTransactionId, payloadHash: requestHash, recordedBy: actor.id } });
      await tx.claimFinancialEntry.create({ data: { claimId, kind: 'RECOVERY', amount, externalEventId, sourceSystem, externalTransactionId, payloadHash: requestHash, recordedBy: actor.id } });
      await tx.claim.update({ where: { id: claimId }, data: { workflowVersion: { increment: 1 } } });
      Object.assign(payload, { subrogationId, amount, sourceSystem, externalTransactionId, reconciledRecoveryAmount: recovered });
    } else if (action === 'CLOSE_CLAIM') {
      assertLicensedAdjuster(actor, claim.jurisdiction || '');
      assertAssigned(claim, actor);
      if (claim.status === 'SETTLED') {
        const adjudication = claim.adjudications.at(-1);
        if (!adjudication || Number(claim.paidAmount || 0) !== Number(adjudication.approvedAmount || 0)) throw new ClaimGovernanceError(422, 'FINANCIAL_RECONCILIATION_FAILED', 'Claim payment does not reconcile to adjudication');
      }
      if (claim.status === 'DENIED' && claim.appeals.some((appeal) => !appeal.decision)) throw new ClaimGovernanceError(422, 'OPEN_APPEAL', 'Claim cannot close with an unresolved appeal');
      const reason = text(rawInput.reason, 'reason', 30, 2000);
      toStatus = 'CLOSED';
      await tx.claim.update({ where: { id: claimId }, data: { status: toStatus, closedAt: new Date(), closedReason: reason, workflowVersion: { increment: 1 } } });
      payload.reason = reason;
    }

    await appendCaseEvent(tx, { claimId, action, fromStatus, toStatus, actor, externalEventId, requestHash, payload });
    return { idempotent: false };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  return { claim: await getGovernedClaim(claimId), idempotent: result.idempotent };
}
