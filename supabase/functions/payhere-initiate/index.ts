// Supabase Edge Function: payhere-initiate
//
// Computes the authoritative payment amount and the PayHere `hash` for an
// order, entirely server-side, so neither the charged amount nor the
// merchant_secret ever has to be trusted from (or exposed to) the browser.
// See docs/payhere-integration-plan.md §3 and §6 for the full reasoning.
//
// No auth required (verify_jwt is off) — guest checkout has no signed-in
// user, same reasoning as ritual-builder. This function uses the
// service-role key to read the order back regardless of who's asking,
// since there's no user JWT to check a guest order against in the first
// place — the only thing that matters is that the orderId given actually
// exists and hasn't already been paid.
//
// Required secrets: PAYHERE_MERCHANT_ID, PAYHERE_MERCHANT_SECRET
// (Supabase dashboard -> Edge Functions -> Secrets, or `supabase secrets set`).
//
// The hashing/amount-recomputation math itself lives in
// ../_shared/payhereLogic.js — a plain, dependency-free module with no Deno
// APIs, so the exact same code is exercised directly by the Vitest unit
// tests in ../_shared/payhereLogic.test.js instead of two implementations
// drifting apart. See that file for the hash-formula documentation.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { splitName, recomputeOrderAmount, amountsMatch, computeChargeHash, CURRENCY } from '../_shared/payhereLogic.js';

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

  const merchantId = Deno.env.get('PAYHERE_MERCHANT_ID');
  const merchantSecret = Deno.env.get('PAYHERE_MERCHANT_SECRET');
  if (!merchantId || !merchantSecret) {
    return jsonResponse(
      { error: 'Online payments are not configured yet — missing PayHere secrets.' },
      503
    );
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON.' }, 400);
  }

  const orderId = typeof payload?.orderId === 'string' ? payload.orderId.trim() : '';
  if (!orderId) {
    return jsonResponse({ error: 'orderId is required.' }, 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, customer_name, customer_email, customer_phone, delivery_address, delivery_zone, grand_total, payment_status, payment_method')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return jsonResponse({ error: 'Order not found.' }, 404);
  }
  if (order.payment_method !== 'payhere') {
    return jsonResponse({ error: 'This order is not set up for online payment.' }, 400);
  }
  if (order.payment_status === 'paid') {
    return jsonResponse({ error: 'This order has already been paid.' }, 409);
  }

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('product_name, quantity, unit_price')
    .eq('order_id', orderId);

  if (itemsError || !items || items.length === 0) {
    return jsonResponse({ error: 'Order has no items to charge.' }, 400);
  }

  // Authoritative amount: derived from what was actually persisted on the
  // order at checkout time (order_items.unit_price), never from anything
  // submitted fresh in this request — so the charged amount can't be swapped
  // out between "place order" and "pay". Note: this does not re-validate
  // unit_price itself against live product pricing/discount rules (wholesale
  // tiers, bundle savings) — that integrity check belongs to the checkout
  // flow that writes order_items in the first place, not this function; see
  // docs/payhere-integration-plan.md for the full scope note.
  const recomputed = recomputeOrderAmount(
    items.map((item) => ({ unitPrice: item.unit_price, quantity: item.quantity })),
    order.delivery_zone
  );

  if (!recomputed) {
    return jsonResponse({ error: 'Order has an unrecognized delivery zone.' }, 400);
  }

  if (!amountsMatch(recomputed.total, order.grand_total)) {
    console.error('payhere-initiate: amount mismatch', {
      orderId,
      recomputed: recomputed.total,
      stored: order.grand_total,
    });
    return jsonResponse(
      { error: 'Could not verify the order total. Please refresh your cart and try again.' },
      409
    );
  }

  const hash = computeChargeHash({
    merchantId,
    orderId,
    amount: recomputed.amount,
    currency: CURRENCY,
    merchantSecret,
  });

  const { firstName, lastName } = splitName(order.customer_name);
  const city = order.delivery_zone === 'colombo_1_15' ? 'Colombo' : 'Sri Lanka';

  const itemsLabel = items.map((item) => item.product_name).join(', ');
  const truncatedItemsLabel = itemsLabel.length > 200 ? `${itemsLabel.slice(0, 197)}...` : itemsLabel;

  const supabaseUrl = Deno.env.get('SUPABASE_URL');

  return jsonResponse({
    merchantId,
    orderId,
    amount: recomputed.amount,
    currency: CURRENCY,
    hash,
    items: truncatedItemsLabel || 'Miracle Natural Order',
    notifyUrl: `${supabaseUrl}/functions/v1/payhere-notify`,
    customer: {
      firstName,
      lastName,
      email: order.customer_email,
      phone: order.customer_phone,
      address: order.delivery_address,
      city,
      country: 'Sri Lanka',
    },
  });
});
