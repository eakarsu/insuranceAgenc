import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';
// Vision-capable model for document processing
const VISION_MODEL = process.env.OPENROUTER_VISION_MODEL || 'anthropic/claude-3-haiku';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, prompt, context, imageData } = await request.json();

    const systemPrompts: Record<string, string> = {
      quote_generator: `You are an AI insurance quote generator. Analyze the provided client information and generate accurate premium estimates with coverage recommendations. Format your response as JSON with: premium, coverages, recommendations, and riskFactors.`,
      coverage_analyzer: `You are an AI coverage gap analyzer for insurance. Review the client's current policies and identify potential coverage gaps, recommend additional coverages, and explain risks. Format your response as JSON with: gaps, recommendations, riskScore, and explanation.`,
      claims_assistant: `You are an AI claims assistant. Help agents process first notice of loss claims by gathering information, identifying coverage, and providing next steps. Format your response as JSON with: claimType, coverage, nextSteps, and documentation.`,
      renewal_predictor: `You are an AI renewal prediction model. Analyze client and policy data to predict renewal probability and suggest retention strategies. Format your response as JSON with: retentionScore, riskFactors, strategies, and projectedPremium.`,
      cross_sell: `You are an AI cross-sell recommender. Analyze client profiles to identify relevant insurance products they may need. Format your response as JSON with: recommendations (array with product, score, reasoning).`,
      risk_assessor: `You are an AI risk assessor. Evaluate risk factors for insurance underwriting. Format your response as JSON with: riskScore, factors, recommendations, and pricing.`,
      document_processor: `You are an AI document processor for insurance documents. Analyze the provided document image and extract all relevant insurance information. Format your response as JSON with:
- documentType: the type of document (e.g., "Policy Declaration", "Application", "Claim Form", "Loss Run", "Certificate of Insurance")
- extractedFields: an array of objects with {fieldName, value} for each piece of data found
- summary: a brief summary of the document
- confidence: your confidence level (high/medium/low)
- warnings: any issues or unclear items found`,
    };

    // Build messages based on whether we have image data
    let messages: any[];

    if (imageData && type === 'document_processor') {
      // Use vision model for document processing with images
      messages = [
        { role: 'system', content: systemPrompts.document_processor },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageData, // base64 data URL
              },
            },
            {
              type: 'text',
              text: prompt || 'Please analyze this insurance document and extract all relevant information.',
            },
          ],
        },
      ];
    } else {
      messages = [
        { role: 'system', content: systemPrompts[type] || systemPrompts.coverage_analyzer },
        { role: 'user', content: `${prompt}\n\nContext: ${JSON.stringify(context)}` },
      ];
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: imageData ? VISION_MODEL : OPENROUTER_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const content = data.choices?.[0]?.message?.content;

    // Try to parse as JSON, otherwise return raw text
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return NextResponse.json({ result: JSON.parse(jsonMatch[0]) });
      }
    } catch {
      // Not JSON, return as text
    }

    return NextResponse.json({ result: { text: content } });
  } catch (error: any) {
    console.error('AI API error:', error);
    return NextResponse.json({ error: error.message || 'AI processing failed' }, { status: 500 });
  }
}
