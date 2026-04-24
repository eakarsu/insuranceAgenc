import { NextRequest, NextResponse } from 'next/server';
import { getAudio } from '@/lib/call-state';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callSid: string; turnId: string }> }
) {
  const { callSid, turnId } = await params;
  const audioBuffer = getAudio(callSid, turnId);

  if (!audioBuffer) {
    return new NextResponse('Audio not found', { status: 404 });
  }

  return new NextResponse(new Uint8Array(audioBuffer), {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Cache-Control': 'no-cache',
    },
  });
}
