// send-order-email: sends the customer-facing order confirmation email.
// Called from the frontend right after a Cash on Delivery order is placed
// (PayHere orders are emailed from payhere-notify instead, once the
// payment outcome is actually known).
//
// Keep verify_jwt off — guest checkout has no Supabase session, so a JWT
// requirement would 401 every guest order. Needs RESEND_API_KEY. Optional:
// RESEND_FROM_EMAIL (defaults to Resend's shared test address, which can
// only deliver to your own Resend account email until you verify your own
// sending domain — see the Resend dashboard).

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { orderConfirmationEmail, adminNewOrderEmail, sendEmail } from '../_shared/resendEmail.js';

// Browsers preflight cross-origin calls with an OPTIONS request before the
// real POST — without these headers (and handling OPTIONS below) the
// preflight gets a bare 405 and the browser never sends the actual request.
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    console.error('send-order-email: missing RESEND_API_KEY secret.');
    return jsonResponse({ error: 'Email service not configured.' }, 503);
  }

  const fromAddress = Deno.env.get('RESEND_FROM_EMAIL') || 'Miracle Natural <onboarding@resend.dev>';

  let payload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body.' }, 400);
  }

  const { orderId } = payload;
  if (!orderId) {
    return jsonResponse({ error: 'orderId is required.' }, 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );

  const { data: order } = await supabase
    .from('orders')
    .select('id, brand, customer_name, customer_email, customer_phone, delivery_address, subtotal, shipping_cost, grand_total')
    .eq('id', orderId)
    .single();

  if (!order) {
    // Nothing to email — not an error worth failing checkout over.
    return jsonResponse({ skipped: true });
  }

  const { data: items } = await supabase
    .from('order_items')
    .select('product_name, quantity, line_total')
    .eq('order_id', orderId);

  let sent = false;

  if (order.customer_email) {
    const { subject, html } = orderConfirmationEmail(order, items || []);
    try {
      await sendEmail({ apiKey, from: fromAddress, to: order.customer_email, subject, html });
      sent = true;
    } catch (err) {
      console.error('send-order-email: Resend send failed', orderId, err);
    }
  }

  // Admin alert — independent of whether the customer email above worked,
  // and additive alongside the existing formsubmit.co alert in Shop.jsx.
  const adminEmail = Deno.env.get('ORDER_NOTIFICATION_EMAIL') || 'dinisha@lanmic.com';
  try {
    const { subject, html } = adminNewOrderEmail(order, items || [], 'Cash on Delivery');
    await sendEmail({ apiKey, from: fromAddress, to: adminEmail, subject, html });
  } catch (err) {
    console.error('send-order-email: admin alert failed', orderId, err);
  }

  // Still 200 either way — the order itself already succeeded, an email
  // hiccup shouldn't read as a checkout failure to the frontend.
  return jsonResponse({ sent });
});
