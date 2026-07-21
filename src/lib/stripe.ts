import Stripe from 'stripe';

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key.startsWith('sk_') || key.length < 24) throw new Error('Stripe is not configured');
  if (!client) client = new Stripe(key, { apiVersion: '2024-04-10' as any, typescript: true });
  return client;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (secret.length < 16) throw new Error('Stripe webhook secret is not configured');
  return secret;
}

export function getStripePublishableKey(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
}
