import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { getCall, storeAudio, addConversationTurn, updateCallStatus } from '@/lib/call-state';
import { generateTTS } from '@/lib/whisper';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const callSid = formData.get('CallSid') as string;

  const twiml = new VoiceResponse();
  const call = getCall(callSid);

  if (!call) {
    twiml.say({ voice: 'Polly.Joanna' }, 'Sorry, there was an error setting up this call. Goodbye.');
    twiml.hangup();
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  updateCallStatus(callSid, 'in-progress');

  const webhookBase = process.env.PUBLIC_WEBHOOK_URL || '';
  const turnId = 'greeting';

  // Try to generate TTS audio for the greeting
  try {
    const audioBuffer = await generateTTS(call.greeting);
    storeAudio(callSid, turnId, audioBuffer);
    addConversationTurn(callSid, 'assistant', call.greeting);

    // Play the TTS audio, then gather speech
    twiml.play(`${webhookBase}/api/voice/call/audio/${callSid}/${turnId}`);
  } catch (err) {
    console.error('TTS error for greeting, falling back to Polly:', err);
    twiml.say({ voice: 'Polly.Joanna' }, call.greeting);
    addConversationTurn(callSid, 'assistant', call.greeting);
  }

  // Gather speech input from the person
  const gather = twiml.gather({
    input: ['speech'],
    action: `${webhookBase}/api/voice/call/webhook/gather`,
    method: 'POST',
    speechTimeout: 'auto',
    speechModel: 'experimental_conversations',
    language: 'en-US',
  });

  // If no input, prompt again
  twiml.say({ voice: 'Polly.Joanna' }, 'Are you still there? I\'m here to help.');
  twiml.redirect(`${webhookBase}/api/voice/call/webhook/answer`);

  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}
