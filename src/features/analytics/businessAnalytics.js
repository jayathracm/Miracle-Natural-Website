import { supabase } from '@/shared/lib/supabaseClient';

/**
 * AI Business Analytics Assistant (functional-requirements.md §4.3).
 * Single-shot: one question in, one narrated answer out. No conversation
 * history is stored — each call is independent, matching the Ritual
 * Builder's pattern rather than the customer support chatbot's.
 *
 * Admin-only: the `business-analytics` Edge Function has verify_jwt on and
 * additionally checks the caller's profile role server-side, so this will
 * fail with a 403 if called by a non-admin. supabase-js automatically
 * attaches the signed-in user's access token to the request, which is why
 * no token handling is needed here.
 */
export async function askBusinessAnalytics(question) {
  const { data, error } = await supabase.functions.invoke('business-analytics', {
    body: { question },
  });

  if (error) {
    // FunctionsHttpError bodies carry the real { error: "..." } message from
    // the function — surface that instead of the generic invoke() error.
    const context = error.context;
    if (context && typeof context.json === 'function') {
      try {
        const body = await context.json();
        if (body?.error) {
          throw new Error(body.error);
        }
      } catch {
        // fall through to the generic error below
      }
    }
    throw new Error(error.message || 'Could not reach the analytics assistant.');
  }

  if (!data?.answer) {
    throw new Error('The analytics assistant returned an empty response.');
  }

  return data.answer;
}
