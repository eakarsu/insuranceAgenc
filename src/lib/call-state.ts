export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ActiveCall {
  callSid: string;
  agentId: string;
  industry: string;
  systemPrompt: string;
  greeting: string;
  conversationHistory: ConversationTurn[];
  status: 'initiating' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer';
  phoneNumber: string;
  startedAt: number;
  turnCount: number;
  conversationGoal?: string;
  provider: 'twilio' | 'vapi';
}

// In-memory store for active calls
const activeCalls = new Map<string, ActiveCall>();

// In-memory store for TTS audio buffers
const audioBuffers = new Map<string, Buffer>();

// Auto-cleanup timers for audio buffers
const audioCleanupTimers = new Map<string, NodeJS.Timeout>();

export function createCall(params: {
  callSid: string;
  agentId: string;
  industry: string;
  systemPrompt: string;
  greeting: string;
  phoneNumber: string;
  conversationGoal?: string;
  provider?: 'twilio' | 'vapi';
}): ActiveCall {
  const call: ActiveCall = {
    callSid: params.callSid,
    agentId: params.agentId,
    industry: params.industry,
    systemPrompt: params.systemPrompt,
    greeting: params.greeting,
    conversationHistory: [],
    status: 'initiating',
    phoneNumber: params.phoneNumber,
    startedAt: Date.now(),
    turnCount: 0,
    conversationGoal: params.conversationGoal,
    provider: params.provider || 'twilio',
  };
  activeCalls.set(params.callSid, call);
  return call;
}

export function getCall(callSid: string): ActiveCall | undefined {
  return activeCalls.get(callSid);
}

export function updateCallStatus(callSid: string, status: ActiveCall['status']): void {
  const call = activeCalls.get(callSid);
  if (call) {
    call.status = status;
  }
}

export function addConversationTurn(callSid: string, role: 'user' | 'assistant', content: string): void {
  const call = activeCalls.get(callSid);
  if (call) {
    call.conversationHistory.push({
      role,
      content,
      timestamp: Date.now(),
    });
    if (role === 'user') {
      call.turnCount++;
    }
  }
}

export function storeAudio(callSid: string, turnId: string, audioBuffer: Buffer): void {
  const key = `${callSid}:${turnId}`;
  audioBuffers.set(key, audioBuffer);

  // Auto-cleanup after 5 minutes
  const existingTimer = audioCleanupTimers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }
  const timer = setTimeout(() => {
    audioBuffers.delete(key);
    audioCleanupTimers.delete(key);
  }, 5 * 60 * 1000);
  audioCleanupTimers.set(key, timer);
}

export function getAudio(callSid: string, turnId: string): Buffer | undefined {
  return audioBuffers.get(`${callSid}:${turnId}`);
}

export function removeCall(callSid: string): void {
  activeCalls.delete(callSid);

  // Clean up all audio buffers for this call
  const keysToDelete: string[] = [];
  audioCleanupTimers.forEach((timer, key) => {
    if (key.startsWith(`${callSid}:`)) {
      clearTimeout(timer);
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => {
    audioCleanupTimers.delete(key);
    audioBuffers.delete(key);
  });
}

export function getAllActiveCalls(): ActiveCall[] {
  return Array.from(activeCalls.values());
}
