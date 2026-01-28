import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Make a test outbound call
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      return NextResponse.json({ error: 'Twilio not configured' }, { status: 500 });
    }

    const client = twilio(accountSid, authToken);

    // Get the base URL for webhooks
    const baseUrl = request.headers.get('origin') || 'http://localhost:3000';

    const call = await client.calls.create({
      url: `${baseUrl}/api/voice/incoming`,
      to: phoneNumber,
      from: twilioPhoneNumber,
      statusCallback: `${baseUrl}/api/voice/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    });

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      message: `Calling ${phoneNumber}...`,
    });
  } catch (error: any) {
    console.error('Test call error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to initiate call',
    }, { status: 500 });
  }
}

// Get Twilio configuration status
export async function GET() {
  const isConfigured = !!(accountSid && authToken && twilioPhoneNumber);

  return NextResponse.json({
    configured: isConfigured,
    phoneNumber: twilioPhoneNumber ? `${twilioPhoneNumber.slice(0, -4)}****` : null,
    webhookUrl: '/api/voice/incoming',
  });
}
