# Audit Apply Notes — insuranceAgency

Source: `_AUDIT/reports/batch_10.md` § Substantive #17 insuranceAgency

## Original audit recommendations

Audit verdict: **SUBSTANTIVE** — 90 pages + 131 API routes (highest AI count in batch). Industry-grade insurance agency SaaS rivalling Vertafore/AMS360. Already has 17 distinct AI features.

### What's missing
- Real-time insurance market rate comparison
- Competitor rate intelligence
- Automated underwriting (approve/decline + rate)
- Broker marketplace integration
- Predictive policy lapse/cancellation with intervention
- Fraud detection for claims

### Custom feature ideas
- Predictive churn + retention agent
- Market rate optimizer
- Underwriting automation agent
- Claims fraud detector (multimodal)
- Voice intake agent
- Portfolio optimization

## Implemented this pass

**None.** This pass is backlog-only.

Reason: every recommendation is NEEDS-CREDS (rater APIs, broker marketplace integrations, telephony for voice intake), NEEDS-PRODUCT-DECISION (regulatory scope for autonomous underwriting decisions, claims-fraud false-positive policy, multi-modal pipeline architecture), or risks duplicating existing functionality (the audit notes 131 AI endpoints already covering renewal prediction, risk assessment, claims assistance, fraud-adjacent loss-run analysis). The constraints disallow new SDKs/frontend; safe mechanical additions are not obvious without an inventory of what's already wired.

## Backlog (not implemented)

### Needs creds / external deps
- Carrier/rater APIs (PL Rater, EZLynx, Quotit, etc.).
- Broker marketplace integrations.
- Voice intake (Twilio Voice / SignalWire / Vonage).

### Needs product decision (regulatory)
- Automated underwriting — approve/decline authority requires state DOI scope decision.
- Claims fraud detection — false-positive tolerance + redress workflow.
- Predictive lapse/cancellation outreach — TCPA / opt-in scope.

### Needs schema/data model work
- Multi-modal claim evidence (text + photos + structured data) joint scoring.
- Portfolio-optimization recommendations engine.

## Categorisation

- MECHANICAL: none safely identified given audit recommendations are infrastructure-scale.
- NEEDS-CREDS: carrier raters, broker integrations, telephony.
- NEEDS-PRODUCT-DECISION: underwriting authority, fraud false-positive policy, lapse-outreach TCPA scope.
- NEEDS-SCHEMA: multimodal claim evidence, portfolio optimization engine.

## Apply pass 3 (frontend)

Pass 2 added no new backend endpoints (backlog-only). The existing FE has 18+ dedicated AI pages under `src/app/(dashboard)/ai/*` calling `/api/ai/*` routes, with JWT/session auth handled by Next.js middleware. Nothing for pass 3 to wire. No FE changes.

## Apply pass 4 (mechanical backlog)

SKIPPED. No code changes.

Audit pass 1 already catalogued every recommendation as NEEDS-CREDS (carrier/rater APIs PL Rater / EZLynx / Quotit, broker marketplace integrations, Twilio/SignalWire/Vonage voice intake), NEEDS-PRODUCT-DECISION (automated underwriting authority — state DOI scope, claims fraud false-positive policy, predictive lapse outreach — TCPA scope), or NEEDS-SCHEMA (multimodal claim-evidence joint scoring, portfolio-optimization recommendations engine).

Substantive project (90 pages + 131 API routes, 17 distinct AI features). No safe mechanical addition fits the apply-pass-4 constraints (no new deps, no new SDKs, no new external integrations).
