/**
 * Voice agent OpenRouter wrapper.
 *
 * Now thin: delegates to lib/ai-helpers.callOpenRouter so we have a single code
 * path. Critically, when OPENROUTER_API_KEY is missing we throw an explicit
 * AiUnavailableError instead of silently returning a canned "I apologize…"
 * string, so callers can decide whether to escalate.
 */
import { callOpenRouter, AiUnavailableError } from "./ai-helpers";

const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "anthropic/claude-3-5-sonnet-20241022";

export async function generateCallResponse(
  systemPrompt: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  // Encode the conversation as the user prompt — keep last 10 turns.
  const recent = conversationHistory.slice(-10);
  const userTurns = recent
    .map((m) => `${m.role === "user" ? "Caller" : "Agent"}: ${m.content}`)
    .join("\n");

  try {
    return await callOpenRouter(systemPrompt, userTurns, {
      model: OPENROUTER_MODEL,
      temperature: 0.7,
      maxTokens: 256,
    });
  } catch (err) {
    if (err instanceof AiUnavailableError) {
      // Surface a transparent message rather than impersonating a real reply.
      return "Our AI is offline right now. I'm transferring you to a human agent — please hold.";
    }
    console.error("generateCallResponse error:", err);
    throw err;
  }
}
