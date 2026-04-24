import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { getCall, addConversationTurn, storeAudio, updateCallStatus } from '@/lib/call-state';
import { generateCallResponse } from '@/lib/openrouter';
import { generateTTS } from '@/lib/whisper';
import { checkEscalationTriggers } from '@/lib/industry-config';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const callSid = formData.get('CallSid') as string;
  const speechResult = formData.get('SpeechResult') as string;

  const twiml = new VoiceResponse();
  const call = getCall(callSid);
  const webhookBase = process.env.PUBLIC_WEBHOOK_URL || '';

  if (!call) {
    twiml.say({ voice: 'Polly.Joanna' }, 'Sorry, there was an error. Goodbye.');
    twiml.hangup();
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  if (!speechResult) {
    twiml.say({ voice: 'Polly.Joanna' }, "I didn't catch that. Could you please repeat?");
    const gather = twiml.gather({
      input: ['speech'],
      action: `${webhookBase}/api/voice/call/webhook/gather`,
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'experimental_conversations',
      language: 'en-US',
    });
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  console.log(`Call ${callSid} - User said: "${speechResult}"`);
  addConversationTurn(callSid, 'user', speechResult);

  // Check escalation triggers
  if (checkEscalationTriggers(call.industry, speechResult)) {
    const escalationMsg = "I understand this is important. Let me connect you with a team member who can better assist you. Please hold.";
    addConversationTurn(callSid, 'assistant', escalationMsg);
    twiml.say({ voice: 'Polly.Joanna' }, escalationMsg);
    twiml.say({ voice: 'Polly.Joanna' }, "I apologize, but no one is available right now. Someone will call you back shortly. Thank you and goodbye.");
    twiml.hangup();
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Check for goodbye
  const lowerInput = speechResult.toLowerCase();
  if (
    lowerInput.includes('goodbye') ||
    lowerInput.includes('bye') ||
    (lowerInput.includes('thank') && lowerInput.includes('all'))
  ) {
    const goodbyeMsg = "Thank you for calling! Have a great day. Goodbye!";
    addConversationTurn(callSid, 'assistant', goodbyeMsg);
    twiml.say({ voice: 'Polly.Joanna' }, goodbyeMsg);
    twiml.hangup();
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Generate AI response using conversation history
  const historyForAI = call.conversationHistory.map(t => ({
    role: t.role,
    content: t.content,
  }));

  const aiResponse = await generateCallResponse(call.systemPrompt, historyForAI);
  console.log(`Call ${callSid} - AI responds: "${aiResponse}"`);
  addConversationTurn(callSid, 'assistant', aiResponse);

  // Generate TTS and play
  const turnId = `turn-${call.turnCount}`;
  try {
    const audioBuffer = await generateTTS(aiResponse);
    storeAudio(callSid, turnId, audioBuffer);
    twiml.play(`${webhookBase}/api/voice/call/audio/${callSid}/${turnId}`);
  } catch (err) {
    console.error('TTS error, falling back to Polly:', err);
    twiml.say({ voice: 'Polly.Joanna' }, aiResponse);
  }

  // Gather again for next turn
  const gather = twiml.gather({
    input: ['speech'],
    action: `${webhookBase}/api/voice/call/webhook/gather`,
    method: 'POST',
    speechTimeout: 'auto',
    speechModel: 'experimental_conversations',
    language: 'en-US',
  });

  // If no input after response, prompt
  twiml.say({ voice: 'Polly.Joanna' }, 'Is there anything else I can help you with?');
  twiml.redirect(`${webhookBase}/api/voice/call/webhook/gather`);

  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}
