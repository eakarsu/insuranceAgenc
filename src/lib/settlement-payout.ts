/**
 * Legacy entry point retained for import compatibility.
 * Payment execution now requires the governed claim workflow, an external
 * idempotency key, independent authorization, and a typed payment adapter.
 */
export async function executeSettlementPayout(): Promise<never> {
  throw new Error('Legacy simulated settlement payouts are retired; use applyClaimAction(AUTHORIZE_PAYMENT)');
}
