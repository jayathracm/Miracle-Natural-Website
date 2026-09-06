// send-order-status-email: sends the customer-facing email when an admin
// moves an order to confirmed / shipped / delivered / cancelled from the
// Orders dashboard. When the new status is 'delivered', also schedules a
// review-request email for a few days later.
//
// Keep verify_jwt off — invoked straight from the admin's browser session,
// same pattern as send-order-email. Needs RESEND_API_KEY. Optional:
// RESEND_FROM_EMAIL (see send-order-email for details).

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { orderStatusEmail, reviewRequestEmail, sendEmail } from '../_shared/resendEmail.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// Review requests land 3 days after delivery — immediate delivery + review
// ask in the same moment reads as spammy, and this is within Resend's
// 30-day scheduling window.
const REVIEW_REQUEST_DELAY_MS = 3 * 24 * 60 * 60 * 1000;

const VALID_STATUSES = new Set(['confirmed', 'shipped', 'delivered', 'cancelled']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    console.error('send-order-status-email: missing RESEND_API_KEY secret.');
    return jsonResponse({ error: 'Email service not configured.' }, 503);
  }

  const fromAddress = Deno.env.get('RESEND_FROM_EMAIL') || 'Miracle Natural <onboarding@resend.dev>';

  let payload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body.' }, 400);
  }

  const { orderId, status } = payload;
  if (!orderId || !status) {
    return jsonResponse({ error: 'orderId and status are required.' }, 400);
  }
  if (!VALID_STATUSES.has(status)) {
    // Nothing to send for 'pending' or anything unrecognized — not an error.
    return jsonResponse({ skipped: true });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );

  const { data: order } = await supabase
    .from('orders')
    .select('id, brand, customer_name, customer_email, delivery_address, subtotal, shipping_cost, grand_total')
    .eq('id', orderId)
    .single();

  if (!order || !order.customer_email) {
    // Nothing to email — not an error worth failing the status update over.
    return jsonResponse({ skipped: true });
  }

  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, product_name, quantity, line_total')
    .eq('order_id', orderId);

  const statusEmail = orderStatusEmail(order, items || [], status);

  try {
    await sendEmail({ apiKey, from: fromAddress, to: order.customer_email, ...statusEmail });
  } catch (err) {
    console.error('send-order-status-email: status email failed', orderId, status, err);
  }

  if (status === 'delivered') {
    try {
      const scheduledAt = new Date(Date.now() + REVIEW_REQUEST_DELAY_MS).toISOString();
      const { subject, html } = reviewRequestEmail(order, items || []);
      await sendEmail({ apiKey, from: fromAddress, to: order.customer_email, subject, html, scheduledAt });
    } catch (err) {
      console.error('send-order-status-email: review request scheduling failed', orderId, err);
    }
  }

  return jsonResponse({ sent: true });
});
