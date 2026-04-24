import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCall, updateCallStatus, removeCall } from '@/lib/call-state';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const direction = formData.get('Direction') as string;
    const duration = formData.get('CallDuration') as string;

    console.log(`Call status update: ${callSid} -> ${callStatus}`);

    // Update in-memory call state
    const statusMap: Record<string, any> = {
      'initiated': 'initiating',
      'ringing': 'ringing',
      'in-progress': 'in-progress',
      'completed': 'completed',
      'busy': 'busy',
      'no-answer': 'no-answer',
      'failed': 'failed',
      'canceled': 'failed',
    };

    const mappedStatus = statusMap[callStatus] || callStatus;
    updateCallStatus(callSid, mappedStatus);

    // On completion, save to database
    if (callStatus === 'completed' || callStatus === 'busy' || callStatus === 'no-answer' || callStatus === 'failed' || callStatus === 'canceled') {
      const call = getCall(callSid);
      const transcription = call?.conversationHistory
        .map(t => `${t.role === 'user' ? 'Caller' : 'AI'}: ${t.content}`)
        .join('\n') || null;

      try {
        await prisma.callLog.upsert({
          where: { callSid },
          update: {
            status: callStatus,
            duration: duration ? parseInt(duration) : null,
            transcription,
          },
          create: {
            callSid,
            from: from || '',
            to: to || '',
            direction: direction || 'outbound-api',
            status: callStatus,
            duration: duration ? parseInt(duration) : null,
            transcription,
          },
        });
      } catch (dbError) {
        console.error('Failed to save CallLog:', dbError);
      }

      // Log activity for completed calls
      if (callStatus === 'completed') {
        try {
          const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
          if (adminUser) {
            await prisma.activity.create({
              data: {
                type: 'CALL_LOGGED',
                title: `AI Voice Call - outbound`,
                description: `Outbound AI call to ${to} - Duration: ${duration || 0}s`,
                metadata: { callSid, from, to, direction, duration, industry: call?.industry },
                userId: adminUser.id,
              },
            });
          }
        } catch (dbError) {
          console.error('Failed to log call activity:', dbError);
        }
      }

      // Clean up in-memory state after 30s (keep it briefly for status polling)
      setTimeout(() => {
        removeCall(callSid);
      }, 30_000);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Status callback error:', error);
    return NextResponse.json({ error: 'Failed to process status' }, { status: 500 });
  }
}
