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
import { orderConfirmationEmail, sendEmail } from '../_shared/resendEmail.js';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    console.error('send-order-email: missing RESEND_API_KEY secret.');
    return new Response(JSON.stringify({ error: 'Email service not configured.' }), { status: 503 });
  }

  const fromAddress = Deno.env.get('RESEND_FROM_EMAIL') || 'Miracle Natural <onboarding@resend.dev>';

  let payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), { status: 400 });
  }

  const { orderId } = payload;
  if (!orderId) {
    return new Response(JSON.stringify({ error: 'orderId is required.' }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );

  const { data: order } = await supabase
    .from('orders')
    .select('id, customer_name, customer_email, delivery_address, subtotal, shipping_cost, grand_total')
    .eq('id', orderId)
    .single();

  if (!order || !order.customer_email) {
    // Nothing to email — not an error worth failing checkout over.
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const { data: items } = await supabase
    .from('order_items')
    .select('product_name, quantity, line_total')
    .eq('order_id', orderId);

  const { subject, html } = orderConfirmationEmail(order, items || []);

  try {
    await sendEmail({ apiKey, from: fromAddress, to: order.customer_email, subject, html });
  } catch (err) {
    console.error('send-order-email: Resend send failed', orderId, err);
    // Still 200 — the order itself already succeeded, an email hiccup
    // shouldn't read as a checkout failure to the frontend.
    return new Response(JSON.stringify({ sent: false }), { status: 200 });
  }

  return new Response(JSON.stringify({ sent: true }), { status: 200 });
});
