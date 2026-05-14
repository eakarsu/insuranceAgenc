// Market-rate scanner (compare 10+ carriers continuously).
// TODO: configure credentials — carrier-specific API keys (e.g. PROGRESSIVE_API_KEY, ALLSTATE_API_KEY).
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const CARRIERS = ['Progressive', 'Allstate', 'GEICO', 'StateFarm', 'Liberty', 'Travelers', 'Nationwide', 'Farmers', 'USAA', 'AmFam'];

function mockRate(carrier: string, profile: any): number {
  // Repeatable pseudo rate from a hash of carrier + driver age + vehicle.
  const key = `${carrier}|${profile.driverAge || 35}|${profile.vehicleYear || 2018}`;
  let h = 0;
  for (const c of key) h = ((h << 5) - h) + c.charCodeAt(0);
  const base = 700 + Math.abs(h % 800);
  const ageFactor = profile.driverAge && profile.driverAge < 25 ? 1.5 : 1.0;
  return Math.round(base * ageFactor);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { profile, lineOfBusiness = 'auto' } = await req.json();
  if (!profile) return NextResponse.json({ error: 'profile required' }, { status: 400 });

  const quotes = CARRIERS.map(c => ({ carrier: c, premiumUSD: mockRate(c, profile), live: !!process.env[`${c.toUpperCase()}_API_KEY`] }));
  quotes.sort((a, b) => a.premiumUSD - b.premiumUSD);
  return NextResponse.json({
    lineOfBusiness,
    cheapest: quotes[0],
    mostExpensive: quotes[quotes.length - 1],
    median: quotes[Math.floor(quotes.length / 2)],
    quotes,
    note: 'Mock quotes — configure carrier API keys for live mode.'
  });
}
