import { NextRequest, NextResponse } from 'next/server';
import { getCall } from '@/lib/call-state';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callSid: string }> }
) {
  const { callSid } = await params;
  const call = getCall(callSid);

  if (!call) {
    return NextResponse.json({
      callSid,
      status: 'unknown',
      transcript: [],
    });
  }

  return NextResponse.json({
    callSid: call.callSid,
    status: call.status,
    industry: call.industry,
    phoneNumber: call.phoneNumber,
    startedAt: call.startedAt,
    turnCount: call.turnCount,
    transcript: call.conversationHistory.map(t => ({
      role: t.role,
      content: t.content,
      timestamp: t.timestamp,
    })),
  });
}
