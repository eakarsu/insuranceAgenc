import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Store conversation history per call (in production, use Redis or database)
const callConversations = new Map<string, { role: string; content: string }[]>();

const SYSTEM_PROMPT = `You are a friendly and professional AI receptionist for Akarsu Insurance Agency. Your role is to:

1. Help callers with insurance questions about auto, home, life, and commercial insurance
2. Assist with claim inquiries and first notice of loss
3. Provide general policy information
4. Schedule callbacks with agents
5. Take messages for the office

Guidelines:
- Be concise but helpful (phone conversations should be brief)
- If someone wants to file a claim, gather: type of claim, date of incident, brief description
- If someone wants a quote, ask: type of insurance, current coverage status
- If they want to speak to a human, offer to transfer or schedule a callback
- Always be polite and professional
- Keep responses under 3 sentences when possible
- End responses with a question or offer to help further

Do NOT:
- Provide specific policy numbers or account details
- Make promises about coverage or claim outcomes
- Give legal or financial advice`;

async function getAIResponse(callSid: string, userMessage: string): Promise<string> {
  // Get or initialize conversation history
  let history = callConversations.get(callSid) || [];

  // Add user message to history
  history.push({ role: 'user', content: userMessage });

  // Keep only last 10 messages to prevent token overflow
  if (history.length > 10) {
    history = history.slice(-10);
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history,
        ],
        temperature: 0.7,
        max_tokens: 200, // Keep responses short for phone
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('OpenRouter error:', data.error);
      return "I apologize, I'm having trouble processing your request. Would you like me to connect you with an agent?";
    }

    const aiMessage = data.choices?.[0]?.message?.content ||
      "I'm sorry, I didn't understand. Could you please repeat that?";

    // Add AI response to history
    history.push({ role: 'assistant', content: aiMessage });
    callConversations.set(callSid, history);

    return aiMessage;
  } catch (error) {
    console.error('AI API error:', error);
    return "I apologize for the technical difficulty. Would you like me to transfer you to an agent?";
  }
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const speechResult = formData.get('SpeechResult') as string;
  const callSid = formData.get('CallSid') as string;
  const digits = formData.get('Digits') as string;

  const twiml = new VoiceResponse();

  // Handle user input
  const userInput = speechResult || digits || '';

  if (!userInput) {
    twiml.say(
      { voice: 'Polly.Joanna' },
      "I didn't catch that. Please tell me how I can help you."
    );

    const gather = twiml.gather({
      input: ['speech'],
      action: '/api/voice/respond',
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'experimental_conversations',
      language: 'en-US',
    });

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  console.log(`Call ${callSid} - User said: "${userInput}"`);

  // Check for transfer request
  const lowerInput = userInput.toLowerCase();
  if (lowerInput.includes('agent') || lowerInput.includes('human') ||
      lowerInput.includes('person') || lowerInput.includes('representative') ||
      lowerInput.includes('transfer')) {
    twiml.say(
      { voice: 'Polly.Joanna' },
      "I'll connect you with an agent right away. Please hold."
    );
    // In production, you would dial the agent's number here:
    // twiml.dial('+1234567890');
    twiml.say(
      { voice: 'Polly.Joanna' },
      "I apologize, but all agents are currently busy. I'll have someone call you back within 30 minutes. Thank you for calling Akarsu Insurance Agency. Goodbye!"
    );
    twiml.hangup();

    // Clean up conversation
    callConversations.delete(callSid);

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Check for goodbye
  if (lowerInput.includes('goodbye') || lowerInput.includes('bye') ||
      lowerInput.includes('thank you') && lowerInput.includes('that')) {
    twiml.say(
      { voice: 'Polly.Joanna' },
      "Thank you for calling Akarsu Insurance Agency. Have a great day! Goodbye!"
    );
    twiml.hangup();

    // Clean up conversation
    callConversations.delete(callSid);

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Get AI response
  const aiResponse = await getAIResponse(callSid, userInput);

  console.log(`Call ${callSid} - AI responds: "${aiResponse}"`);

  // Speak the AI response
  twiml.say(
    { voice: 'Polly.Joanna' },
    aiResponse
  );

  // Continue gathering input
  const gather = twiml.gather({
    input: ['speech'],
    action: '/api/voice/respond',
    method: 'POST',
    speechTimeout: 'auto',
    speechModel: 'experimental_conversations',
    language: 'en-US',
  });

  // If no input after response, prompt
  twiml.say(
    { voice: 'Polly.Joanna' },
    "Is there anything else I can help you with?"
  );
  twiml.redirect('/api/voice/respond');

  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}
