import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

// Incoming call handler - Initial greeting
export async function POST(request: NextRequest) {
  const twiml = new VoiceResponse();

  // Initial greeting
  twiml.say(
    {
      voice: 'Polly.Joanna', // Natural female voice
      language: 'en-US',
    },
    'Hello! Thank you for calling Akarsu Insurance Agency. I am your AI assistant and I can help you with quotes, claims, policy questions, or connect you with an agent. How may I assist you today?'
  );

  // Gather speech input
  const gather = twiml.gather({
    input: ['speech'],
    action: '/api/voice/respond',
    method: 'POST',
    speechTimeout: 'auto',
    speechModel: 'experimental_conversations',
    language: 'en-US',
  });

  // If no input, prompt again
  twiml.say(
    { voice: 'Polly.Joanna' },
    "I didn't catch that. Please tell me how I can help you."
  );
  twiml.redirect('/api/voice/incoming');

  return new NextResponse(twiml.toString(), {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

// Also handle GET for testing
export async function GET() {
  return NextResponse.json({
    status: 'Voice API ready',
    message: 'Configure this URL as your Twilio webhook for incoming calls'
  });
}
