import { NextRequest, NextResponse } from 'next/server';
import { makeCall } from '@/lib/twilio';
import { makeVapiCall } from '@/lib/vapi';
import { buildSystemPrompt, buildGreeting, INDUSTRY_CONFIGS } from '@/lib/industry-config';
import { createCall } from '@/lib/call-state';
import { logIntegrationStatus } from '@/lib/startup-check';

// Log integration availability at module load time (once per cold start)
logIntegrationStatus();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, phoneNumber, industry, agentName, greeting, customPrompt, voice, conversationGoal, provider = 'twilio' } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    if (!industry || !INDUSTRY_CONFIGS[industry]) {
      return NextResponse.json({ error: 'Valid industry is required' }, { status: 400 });
    }

    const config = {
      agentName: agentName || 'AI Assistant',
      industry,
      greeting,
      customPrompt,
    };

    const systemPrompt = buildSystemPrompt(config, conversationGoal);
    const callGreeting = buildGreeting(config);

    const webhookBase = process.env.PUBLIC_WEBHOOK_URL;
    if (!webhookBase) {
      // Graceful degradation: log a warning and return a helpful, non-crashing error.
      // The call cannot proceed without a publicly reachable webhook URL, but we
      // distinguish this as a configuration issue (503) rather than a server error (500).
      console.warn(
        '[voice/initiate] PUBLIC_WEBHOOK_URL is not set. ' +
        'Outbound voice calls require a publicly reachable URL for Twilio/VAPI webhooks. ' +
        'Set PUBLIC_WEBHOOK_URL to your production domain or ngrok URL in development.'
      );
      return NextResponse.json(
        {
          error: 'Voice calling is not configured on this server.',
          detail:
            'PUBLIC_WEBHOOK_URL is required for Twilio/VAPI webhooks. ' +
            'Set it to your production domain (e.g. https://app.insureflow.com) ' +
            'or an ngrok tunnel URL in development.',
          configured: false,
        },
        { status: 503 }
      );
    }

    let sid: string;
    let status: string;

    if (provider === 'vapi') {
      const vapiWebhookUrl = `${webhookBase}/api/voice/call/vapi-webhook`;
      const result = await makeVapiCall({
        phoneNumber,
        systemPrompt,
        greeting: callGreeting,
        agentName: config.agentName,
        webhookUrl: vapiWebhookUrl,
      });
      sid = result.sid;
      status = result.status;
    } else {
      const answerUrl = `${webhookBase}/api/voice/call/webhook/answer`;
      const statusUrl = `${webhookBase}/api/voice/call/webhook/status`;
      const result = await makeCall(phoneNumber, answerUrl, statusUrl);
      sid = result.sid;
      status = result.status;
    }

    createCall({
      callSid: sid,
      agentId: agentId || industry,
      industry,
      systemPrompt,
      greeting: callGreeting,
      phoneNumber,
      conversationGoal,
      provider,
    });

    return NextResponse.json({
      callSid: sid,
      status,
    });
  } catch (error: any) {
    console.error('Call initiation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate call' },
      { status: 500 }
    );
  }
}
