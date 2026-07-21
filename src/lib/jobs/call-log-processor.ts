/**
 * Call recording processing is intentionally disabled until an authenticated,
 * typed speech-to-text adapter and retention policy are configured.
 */
export async function handleCallLogProcessor(): Promise<any> {
  throw new Error('Call transcription is retired until a governed speech-to-text adapter is configured');
}
