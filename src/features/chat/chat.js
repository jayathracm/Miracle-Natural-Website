import { supabase } from '@/shared/lib/supabaseClient';

// A durable per-browser id (not a Supabase auth session) that keys one
// continuous ai_conversations row server-side (see the chat-support Edge
// Function) — reused across page loads/reloads so a visitor's chat history
// persists, but never sent anywhere except that one function. Generated
// once and cached in localStorage; falls back to a timestamp+random string
// on the rare browser without crypto.randomUUID().
const CHAT_SESSION_STORAGE_KEY = 'leoraWellness.chatSessionId';

// Whether the first-visit "try the chatbot" nudge (ChatWidget.jsx) has
// already been shown in this browser. Set the moment the nudge is displayed
// (not on dismiss) so it never reappears even if the visitor navigates away
// before interacting with it — a true one-time, first-load nudge.
const CHAT_NUDGE_SEEN_STORAGE_KEY = 'leoraWellness.chatNudgeSeen';

export function hasSeenChatNudge() {
  try {
    return window.localStorage.getItem(CHAT_NUDGE_SEEN_STORAGE_KEY) === 'true';
  } catch {
    // Private browsing / storage disabled — treat as already seen so we
    // don't risk the nudge popping up on every single page load.
    return true;
  }
}

export function markChatNudgeSeen() {
  try {
    window.localStorage.setItem(CHAT_NUDGE_SEEN_STORAGE_KEY, 'true');
  } catch {
    // Ignore — worst case the nudge shows again next time storage works.
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
    // Private browsing / storage disabled — fall back to an in-memory id,
    // so chat still works for this page view, just without continuity
    // across reloads.
    return generateId();
  }
}

/**
 * Sends one chat message to the `chat-support` Edge Function and returns the
 * assistant's reply. Conversation continuity (history, grounding) is all
 * handled server-side, keyed by `sessionId` — this call is stateless from
 * the frontend's point of view.
 */
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
