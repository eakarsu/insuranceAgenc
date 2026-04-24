import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Save Twilio call recordings and transcripts.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const callSid = formData.get('CallSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingSid = formData.get('RecordingSid') as string;
    const recordingDuration = formData.get('RecordingDuration') as string;

    if (!callSid) {
      return NextResponse.json({ error: 'CallSid required' }, { status: 400 });
    }

    // Update or create CallLog with recording URL
    await prisma.callLog.upsert({
      where: { callSid },
      update: {
        recordingUrl: recordingUrl ? `${recordingUrl}.mp3` : null,
        duration: recordingDuration ? parseInt(recordingDuration) : null,
      },
      create: {
        callSid,
        from: '',
        to: '',
        direction: 'inbound',
        recordingUrl: recordingUrl ? `${recordingUrl}.mp3` : null,
        duration: recordingDuration ? parseInt(recordingDuration) : null,
        status: 'completed',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Recording save error:', error);
    return NextResponse.json({ error: 'Failed to save recording' }, { status: 500 });
  }
}
