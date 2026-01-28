import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Handle call status callbacks from Twilio
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const callData = {
      callSid: formData.get('CallSid') as string,
      callStatus: formData.get('CallStatus') as string,
      from: formData.get('From') as string,
      to: formData.get('To') as string,
      direction: formData.get('Direction') as string,
      duration: formData.get('CallDuration') as string,
      timestamp: new Date().toISOString(),
    };

    console.log('Call Status Update:', callData);

    // Log to database activity (optional - for call history)
    if (callData.callStatus === 'completed') {
      try {
        await prisma.activity.create({
          data: {
            type: 'CALL',
            title: `AI Voice Call - ${callData.direction}`,
            description: `${callData.direction === 'inbound' ? 'Incoming' : 'Outgoing'} call ${callData.from} - Duration: ${callData.duration || 0}s`,
            metadata: callData,
          },
        });
      } catch (dbError) {
        console.error('Failed to log call activity:', dbError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Status callback error:', error);
    return NextResponse.json({ error: 'Failed to process status' }, { status: 500 });
  }
}
