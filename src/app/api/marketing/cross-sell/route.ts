import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get existing recommendations from database
    const recommendations = await prisma.crossSellRecommendation.findMany({
      orderBy: { score: 'desc' },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Cross-sell GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch clients with their policies for AI analysis
    const clients = await prisma.client.findMany({
      where: { status: 'ACTIVE' },
      include: {
        policies: {
          where: { status: 'ACTIVE' },
          select: { id: true, lineOfBusiness: true, premium: true, effectiveDate: true },
        },
      },
      take: 50,
    });

    if (clients.length === 0) {
      return NextResponse.json({ error: 'No active clients found to analyze' }, { status: 400 });
    }

    // Build context for AI - use index instead of ID for easier mapping
    const clientsContext = clients.map((c, index) => ({
      index,
      name: `${c.firstName} ${c.lastName}`,
      type: c.type,
      currentPolicies: c.policies.map((p) => p.lineOfBusiness),
      totalPremium: c.policies.reduce((sum, p) => sum + (Number(p.premium) || 0), 0),
    }));

    // Call AI for recommendations
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
            content: `You are an AI cross-sell recommender for insurance. Analyze client profiles and identify insurance products they may need but don't have. Return ONLY a valid JSON array with objects containing: index (client index number), recommendation (product name), score (0-100), reason (brief explanation). No other text.`,
          },
          {
            role: 'user',
            content: `Analyze these insurance clients and recommend additional coverage. Focus on coverage gaps. Return max 10 recommendations as JSON array.

Clients:
${clientsContext.map(c => `${c.index}: ${c.name} (${c.type}) - Current: ${c.currentPolicies.join(', ') || 'None'}`).join('\n')}

Products to recommend: Personal Auto, Homeowners, Renters, Umbrella, Life Insurance, Disability, Long-term Care, Commercial Auto, Commercial Property, General Liability, Workers Comp.

Return JSON like: [{"index": 0, "recommendation": "Umbrella", "score": 95, "reason": "High assets need liability protection"}]`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    if (aiData.error) {
      throw new Error(aiData.error.message);
    }

    const content = aiData.choices?.[0]?.message?.content;
    console.log('AI Content:', content);

    // Parse AI response
    let recommendations: any[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
        console.log('Parsed recommendations:', recommendations.length);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json({
        error: 'Failed to parse AI response',
        rawResponse: content
      }, { status: 500 });
    }

    // Clear old recommendations
    await prisma.crossSellRecommendation.deleteMany({});

    // Save new recommendations using index to map to real client IDs
    const savedRecommendations = [];
    for (const rec of recommendations) {
      const clientIndex = typeof rec.index === 'number' ? rec.index : parseInt(rec.index);
      const client = clients[clientIndex];

      if (!client) {
        console.log(`Skipping: Invalid client index ${rec.index}`);
        continue;
      }

      try {
        const saved = await prisma.crossSellRecommendation.create({
          data: {
            clientId: client.id,
            recommendedProduct: rec.recommendation,
            score: rec.score || 80,
            reasoning: rec.reason || 'Coverage gap identified',
            currentPolicies: client.policies.map(p => p.lineOfBusiness),
            status: 'PENDING',
          },
          include: {
            client: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        });
        savedRecommendations.push(saved);
        console.log(`Saved recommendation for ${client.firstName} ${client.lastName}`);
      } catch (saveError) {
        console.error(`Failed to save recommendation for index ${clientIndex}:`, saveError);
      }
    }

    return NextResponse.json({
      success: true,
      count: savedRecommendations.length,
      recommendations: savedRecommendations,
      aiResponse: content,
    });
  } catch (error: any) {
    console.error('Cross-sell POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate recommendations' }, { status: 500 });
  }
}
