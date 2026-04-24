const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export function mapVoiceToTTS(voiceName?: string): OpenAIVoice {
  switch (voiceName) {
    case 'Male-1':
      return 'onyx';
    case 'Male-2':
      return 'echo';
    case 'Female-1':
      return 'nova';
    case 'Female-2':
      return 'shimmer';
    case 'Neutral-1':
      return 'alloy';
    default:
      return 'nova';
  }
}

export async function generateTTS(
  text: string,
  voice?: string
): Promise<Buffer> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const ttsVoice = mapVoiceToTTS(voice);

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: ttsVoice,
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('OpenAI TTS error:', err);
    throw new Error(`TTS generation failed: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
