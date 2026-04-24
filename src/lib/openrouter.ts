const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateCallResponse(
  systemPrompt: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    return "I apologize, I'm having a technical issue. Let me connect you with someone who can help.";
  }

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10), // Keep last 10 turns
  ];

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 256,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('OpenRouter error:', data.error);
      return "I apologize, I'm having trouble right now. Would you like me to have someone call you back?";
    }

    return data.choices?.[0]?.message?.content ||
      "I'm sorry, I didn't catch that. Could you please repeat?";
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return "I apologize for the technical difficulty. Let me connect you with someone who can help.";
  }
}
