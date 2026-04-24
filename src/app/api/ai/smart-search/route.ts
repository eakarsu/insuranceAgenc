import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { query } = await request.json();

    // Step 1: Use AI to interpret the natural language query
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an AI search assistant for an insurance agency management system. Translate natural language queries into structured search parameters. The database has these entities: clients (fields: firstName, lastName, businessName, email, state, type PERSONAL/COMMERCIAL, status), policies (fields: policyNumber, lineOfBusiness, carrier, status, premium, effectiveDate, expirationDate), claims (fields: claimNumber, status, type, amount, dateOfLoss), quotes (fields: lineOfBusiness, carrier, premium, status). Format your response as JSON with: interpretation (string), entityType (one of: client, policy, claim, quote), filters (object with field-value pairs), sortBy (optional string).`,
          },
          { role: 'user', content: query },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    let searchParams;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      searchParams = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      searchParams = null;
    }

    if (!searchParams) {
      return NextResponse.json({ error: 'Could not interpret search query' }, { status: 400 });
    }

    // Step 2: Execute the search based on interpreted parameters
    let results: any[] = [];
    const { entityType, filters } = searchParams;

    if (entityType === 'client') {
      const where: any = {};
      if (filters.state) where.state = { contains: filters.state, mode: 'insensitive' };
      if (filters.firstName) where.firstName = { contains: filters.firstName, mode: 'insensitive' };
      if (filters.lastName) where.lastName = { contains: filters.lastName, mode: 'insensitive' };
      if (filters.type) where.type = filters.type;
      if (filters.status) where.status = filters.status;
      if (filters.email) where.email = { contains: filters.email, mode: 'insensitive' };
      results = await prisma.client.findMany({ where, take: 50, include: { policies: true } });
    } else if (entityType === 'policy') {
      const where: any = {};
      if (filters.lineOfBusiness) where.lineOfBusiness = filters.lineOfBusiness;
      if (filters.carrier) where.carrier = { contains: filters.carrier, mode: 'insensitive' };
      if (filters.status) where.status = filters.status;
      if (filters.policyNumber) where.policyNumber = { contains: filters.policyNumber, mode: 'insensitive' };
      results = await prisma.policy.findMany({ where, take: 50, include: { client: true } });
    } else if (entityType === 'claim') {
      const where: any = {};
      if (filters.status) where.status = filters.status;
      if (filters.claimNumber) where.claimNumber = { contains: filters.claimNumber, mode: 'insensitive' };
      results = await prisma.claim.findMany({ where, take: 50, include: { policy: { include: { client: true } } } });
    } else if (entityType === 'quote') {
      const where: any = {};
      if (filters.lineOfBusiness) where.lineOfBusiness = filters.lineOfBusiness;
      if (filters.status) where.status = filters.status;
      results = await prisma.quote.findMany({ where, take: 50, include: { client: true } });
    }

    return NextResponse.json({
      interpretation: searchParams.interpretation,
      entityType: searchParams.entityType,
      filters: searchParams.filters,
      results,
      totalResults: results.length,
    });
  } catch (error: any) {
    console.error('Smart search error:', error);
    return NextResponse.json({ error: error.message || 'Search failed' }, { status: 500 });
  }
}
