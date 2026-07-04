import { supabase } from './supabaseClient';

/**
 * Sends a message to the company (admins). userId/customerName/customerEmail
 * are passed in explicitly (rather than relying on a column default like
 * addresses/wishlist do) because contact_messages.user_id is nullable —
 * there's no auth.uid() default that would make sense here.
 */
export async function sendMessage({ userId, customerName, customerEmail, subject, message }) {
  const { data, error } = await supabase
    .from('contact_messages')
    .insert({
      user_id: userId,
      customer_name: customerName,
      customer_email: customerEmail,
      subject: subject.trim(),
      message: message.trim(),
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/** Fetches the signed-in user's own message history, newest first. */
export async function fetchMyMessages() {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}
