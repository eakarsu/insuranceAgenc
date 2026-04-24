import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCall, updateCallStatus, addConversationTurn, removeCall } from '@/lib/call-state';
import { mapVapiStatus } from '@/lib/vapi';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ success: true });
    }

    const callId = message.call?.id;
    if (!callId) {
      return NextResponse.json({ success: true });
    }

    console.log(`Vapi webhook: ${message.type} for call ${callId}`);

    switch (message.type) {
      case 'status-update': {
        const mappedStatus = mapVapiStatus(message.status);
        updateCallStatus(callId, mappedStatus as any);
        break;
      }

      case 'transcript': {
        if (message.transcriptType === 'final') {
          const role = message.role === 'assistant' ? 'assistant' : 'user';
          addConversationTurn(callId, role, message.transcript);
        }
        break;
      }

      case 'end-of-call-report': {
        updateCallStatus(callId, 'completed');

        const call = getCall(callId);
        const phoneNumber = call?.phoneNumber || message.call?.customer?.number || '';
        const duration = message.durationSeconds ? Math.round(message.durationSeconds) : null;

        // Build transcription from in-memory history or from Vapi's report
        let transcription: string | null = null;
        if (call?.conversationHistory?.length) {
          transcription = call.conversationHistory
            .map(t => `${t.role === 'user' ? 'Caller' : 'AI'}: ${t.content}`)
            .join('\n');
        } else if (message.transcript) {
          transcription = message.transcript;
        }

        try {
          await prisma.callLog.upsert({
            where: { callSid: callId },
            update: {
              status: 'completed',
              duration,
              transcription,
            },
            create: {
              callSid: callId,
              from: 'vapi',
              to: phoneNumber,
              direction: 'outbound-api',
              status: 'completed',
              duration,
              transcription,
            },
          });
        } catch (dbError) {
          console.error('Failed to save Vapi CallLog:', dbError);
        }

        // Log activity
        try {
          const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
          if (adminUser) {
            await prisma.activity.create({
              data: {
                type: 'CALL_LOGGED',
                title: 'AI Voice Call (Vapi) - outbound',
                description: `Outbound Vapi call to ${phoneNumber} - Duration: ${duration || 0}s`,
                metadata: { callSid: callId, to: phoneNumber, direction: 'outbound-api', duration, industry: call?.industry },
                userId: adminUser.id,
              },
            });
          }
        } catch (dbError) {
          console.error('Failed to log Vapi call activity:', dbError);
        }

        // Clean up in-memory state after 30s
        setTimeout(() => {
          removeCall(callId);
        }, 30_000);
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vapi webhook error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
