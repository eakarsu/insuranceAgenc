# Governed claim operations

## State and roles

Intake validates policy ownership, active status, loss date, and stores a point-in-time coverage/carrier snapshot. Managers or administrators assign an active adjuster whose unexpired license covers the loss jurisdiction. The assigned adjuster records digest-addressed evidence and reserve changes, then submits the case to the typed fraud adapter. A referral keeps the claim under investigation; only a clear result reaches review.

A licensed assigned adjuster adjudicates from cited coverage provisions and claim-owned evidence using the exact attestation exported by `claims-governance.ts`. A denied case may be appealed, but the original adjudicator cannot resolve it. A manager/administrator who did not adjudicate requests payment authorization. Payment ledger events cannot exceed the approved or authorized totals. Claims close only after denial has no open appeal or settlement reconciles exactly.

## Integration contract

The fraud and payment endpoints receive JSON over authenticated HTTP with an `Idempotency-Key`, an eight-second timeout, and no automatic success fallback. Fraud must return `{ outcome: "CLEAR" | "REFER", riskCode, reference }`. Payment must return `{ outcome: "AUTHORIZED" | "DECLINED", reference }`. Retrying the same event with changed content returns `409`; an exact retry returns the stored case without repeating state mutation.

Evidence references must be HTTPS URLs on `CLAIMS_EVIDENCE_ALLOWED_HOSTS` and include SHA-256, MIME type, byte count, source record, and capture time. Launch acceptance must additionally verify provider signatures and retrieve/re-hash evidence contents; hostname allowlisting alone is not content verification.

## Deployment and recovery

1. Back up PostgreSQL and prove restore on an isolated database.
2. Run `prisma migrate deploy` as a separate release job, then run `scripts/verify-claim-controls.sh`.
3. Deploy the immutable application image with an unprivileged user and required secrets injected by the platform.
   Keep `ENABLE_BACKGROUND_JOBS=false` on web instances; enable it only in one designated, monitored worker deployment after the unrelated scheduled jobs receive their own operational acceptance.
4. Smoke health, authentication, intake replay, disallowed mutation, and provider timeout behavior.
5. For provider outage, stop the affected transition; do not invent a fraud or payment result. Retry with the same external event ID after recovery.
6. Verify a case chain with `CLAIM_ID=... npx tsx scripts/verify-claim-chain.ts` and reconcile approval, authorization, payment, and recovery totals before closure.

Before launch, complete jurisdiction-rule signoff, provider authentication/signature verification, appeal deadlines/notices, partial-payment/refund/chargeback behavior, clock-skew and concurrent replay tests, backup/restore, legal-hold release, regulatory export, load/capacity, and licensed-adjuster user acceptance.
