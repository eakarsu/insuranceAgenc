/**
 * Startup Integration Checker
 *
 * Logs which integrations are configured and available at cold-start.
 * Runs once per module load — subsequent calls are no-ops.
 * Safe to import from any route handler.
 */

let hasLogged = false;

interface IntegrationStatus {
  name: string;
  configured: boolean;
  note?: string;
}

function checkIntegrations(): IntegrationStatus[] {
  return [
    {
      name: 'Database (PostgreSQL)',
      configured: Boolean(process.env.DATABASE_URL),
    },
    { name: 'Claims evidence hosts', configured: Boolean(process.env.CLAIMS_EVIDENCE_ALLOWED_HOSTS) },
    { name: 'Typed fraud adapter', configured: Boolean(process.env.CLAIMS_FRAUD_ENDPOINT) && Boolean(process.env.CLAIMS_INTEGRATION_TOKEN) },
    { name: 'Typed payment adapter', configured: Boolean(process.env.CLAIMS_PAYMENT_ENDPOINT) && Boolean(process.env.CLAIMS_INTEGRATION_TOKEN) },
    {
      name: 'Twilio Voice',
      configured:
        Boolean(process.env.TWILIO_ACCOUNT_SID) &&
        Boolean(process.env.TWILIO_AUTH_TOKEN) &&
        Boolean(process.env.TWILIO_PHONE_NUMBER),
    },
    {
      name: 'VAPI Voice AI',
      configured:
        Boolean(process.env.VAPI_API_KEY) && Boolean(process.env.VAPI_PHONE_NUMBER_ID),
    },
    {
      name: 'Voice Webhook (PUBLIC_WEBHOOK_URL)',
      configured: Boolean(process.env.PUBLIC_WEBHOOK_URL),
      note: process.env.PUBLIC_WEBHOOK_URL
        ? `→ ${process.env.PUBLIC_WEBHOOK_URL}`
        : 'NOT SET — outbound voice calls will be unavailable',
    },
    {
      name: 'Stripe Payments',
      configured: Boolean(process.env.STRIPE_SECRET_KEY),
    },
    {
      name: 'Email delivery adapter',
      configured: Boolean(process.env.EMAIL_DELIVERY_ENDPOINT) && Boolean(process.env.EMAIL_DELIVERY_TOKEN),
    },
    {
      name: 'NextAuth',
      configured: Boolean(process.env.NEXTAUTH_SECRET) && Boolean(process.env.NEXTAUTH_URL),
    },
  ];
}

export function logIntegrationStatus(): void {
  if (hasLogged) return;
  hasLogged = true;

  const integrations = checkIntegrations();
  const configured = integrations.filter((i) => i.configured);
  const missing = integrations.filter((i) => !i.configured);

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║         InsureFlow — Integration Status              ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  for (const i of configured) {
    const note = i.note ? `  (${i.note})` : '';
    console.log(`  ✓  ${i.name}${note}`);
  }

  if (missing.length > 0) {
    console.log('\n  ⚠  Missing / unconfigured:');
    for (const i of missing) {
      const note = i.note ? `  — ${i.note}` : '';
      console.log(`     ✗  ${i.name}${note}`);
    }
  }

  console.log('');
}

/**
 * Returns a structured object describing integration availability.
 * Useful for /api/health or admin dashboards.
 */
export function getIntegrationStatus(): Record<string, boolean> {
  return Object.fromEntries(
    checkIntegrations().map((i) => [
      i.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      i.configured,
    ])
  );
}
