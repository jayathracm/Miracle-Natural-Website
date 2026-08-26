import { supabase } from '@/shared/lib/supabaseClient';

// Per-browser id that keys one chat history server-side. Cached in
// localStorage so a visitor's conversation persists across reloads.
const CHAT_SESSION_STORAGE_KEY = 'leoraWellness.chatSessionId';

// Whether the first-visit chatbot nudge has already been shown here.
const CHAT_NUDGE_SEEN_STORAGE_KEY = 'leoraWellness.chatNudgeSeen';

export function hasSeenChatNudge() {
  try {
    return window.localStorage.getItem(CHAT_NUDGE_SEEN_STORAGE_KEY) === 'true';
  } catch {
    // Storage disabled — treat as already seen so it doesn't pop up every load.
    return true;
  }
}

export function markChatNudgeSeen() {
  try {
    window.localStorage.setItem(CHAT_NUDGE_SEEN_STORAGE_KEY, 'true');
  } catch {
    // Ignore — worst case the nudge shows again next time.
  }
}

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getChatSessionId() {
  try {
    const existing = window.localStorage.getItem(CHAT_SESSION_STORAGE_KEY);
    if (existing) return existing;

    const created = generateId();
    window.localStorage.setItem(CHAT_SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    // Storage disabled — fall back to an in-memory id, works for this page view only.
    return generateId();
  }
}

// Sends a message to the chat-support Edge Function and returns the reply.
// History/context is handled server-side, keyed by sessionId.
export async function sendChatMessage(sessionId, message) {
  const { data, error } = await supabase.functions.invoke('chat-support', {
    body: { sessionId, message },
  });

  if (error) {
    throw error;
  }
  if (data?.error) {
    throw new Error(data.error);
  }

  return data.reply;
}
