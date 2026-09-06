// payhere-notify: PayHere's payment webhook. Checks the md5sig before
// trusting anything, then updates the order's payment_status.
// Keep verify_jwt off — PayHere calls this with no Supabase session, so
// turning JWT checks on would just 401 every real notification.
// Needs PAYHERE_MERCHANT_SECRET. ORDER_NOTIFICATION_EMAIL and
// RESEND_API_KEY (customer emails) are optional — each is skipped
// independently if its secret isn't set.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { verifyNotifySignature, mapStatusCode } from '../_shared/payhereLogic.js';
import { paymentSuccessEmail, paymentFailedEmail, sendEmail } from '../_shared/resendEmail.js';

async function fetchOrderWithItems(supabase, orderId) {
  const { data: order } = await supabase
    .from('orders')
    .select('id, customer_name, customer_email, delivery_address, subtotal, shipping_cost, grand_total')
    .eq('id', orderId)
    .single();

  if (!order) return { order: null, items: [] };

  const { data: items } = await supabase
    .from('order_items')
    .select('product_name, quantity, line_total')
    .eq('order_id', orderId);

  return { order, items: items || [] };
}

// Best-effort — an email hiccup should never make the webhook look like it
// failed to PayHere (which would trigger unnecessary retries).
async function sendCustomerEmail(supabase, orderId, kind) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return;

  const fromAddress = Deno.env.get('RESEND_FROM_EMAIL') || 'Miracle Natural <onboarding@resend.dev>';

  try {
    const { order, items } = await fetchOrderWithItems(supabase, orderId);
    if (!order || !order.customer_email) return;

    const { subject, html } =
      kind === 'paid' ? paymentSuccessEmail(order, items) : paymentFailedEmail(order);

    await sendEmail({ apiKey, from: fromAddress, to: order.customer_email, subject, html });
  } catch (err) {
    console.error('payhere-notify: customer email failed', orderId, kind, err);
  }
}

async function sendOrderConfirmationEmail(supabase, orderId) {
  const orderEmail = Deno.env.get('ORDER_NOTIFICATION_EMAIL') || 'dinisha@lanmic.com';

  const { data: order } = await supabase
    .from('orders')
    .select('customer_name, customer_email, customer_phone, delivery_address, subtotal, shipping_cost, grand_total')
    .eq('id', orderId)
    .single();

  if (!order) return;

  const { data: items } = await supabase
    .from('order_items')
    .select('product_name, quantity, line_total')
    .eq('order_id', orderId);

  const orderLines = (items || []).map(
    (item) => `- ${item.product_name} x ${item.quantity} = LKR ${Number(item.line_total).toFixed(2)}`
  );

  const body = [
    'A new order was paid online via PayHere.',
    '',
    ...orderLines,
    '',
    `Subtotal: LKR ${Number(order.subtotal).toFixed(2)}`,
    `Shipping: LKR ${Number(order.shipping_cost).toFixed(2)}`,
    `Grand Total: LKR ${Number(order.grand_total).toFixed(2)}`,
    '',
    `Customer: ${order.customer_name}`,
    `Phone: ${order.customer_phone}`,
    `Email: ${order.customer_email}`,
    `Delivery Address: ${order.delivery_address}`,
    `Order ID: ${orderId}`,
  ].join('\n');

  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(orderEmail)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      _subject: `New PayHere Order Paid - ${order.customer_name}`,
      _captcha: 'false',
      _template: 'table',
      name: order.customer_name,
      phone: order.customer_phone,
      customer_email: order.customer_email,
      payment_method: 'PayHere (Online)',
      delivery_address: order.delivery_address,
      grand_total: `LKR ${Number(order.grand_total).toFixed(2)}`,
      order_items: orderLines.join('\n'),
      order_message: body,
    }),
  });

  if (!response.ok) {
    throw new Error(`formsubmit.co responded with ${response.status}`);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const merchantSecret = Deno.env.get('PAYHERE_MERCHANT_SECRET');
  if (!merchantSecret) {
    console.error('payhere-notify: missing PAYHERE_MERCHANT_SECRET secret.');
    // Still 200 so PayHere doesn't retry-storm us over a config issue.
    return new Response('OK', { status: 200 });
  }

  let form;
  try {
    // PayHere posts application/x-www-form-urlencoded, not JSON.
    form = await req.formData();
  } catch (err) {
    console.error('payhere-notify: could not parse form body', err);
    return new Response('OK', { status: 200 });
  }

  const merchantId = form.get('merchant_id')?.toString() ?? '';
  const orderId = form.get('order_id')?.toString() ?? '';
  const paymentId = form.get('payment_id')?.toString() ?? '';
  const payhereAmount = form.get('payhere_amount')?.toString() ?? '';
  const payhereCurrency = form.get('payhere_currency')?.toString() ?? '';
  const statusCode = form.get('status_code')?.toString() ?? '';
  const md5sig = form.get('md5sig')?.toString() ?? '';

  if (!orderId || !statusCode || !md5sig) {
    console.error('payhere-notify: missing required fields', { orderId, statusCode, hasSig: Boolean(md5sig) });
    return new Response('OK', { status: 200 });
  }

  const isVerified = verifyNotifySignature({
    merchantId,
    orderId,
    payhereAmount,
    payhereCurrency,
    statusCode,
    merchantSecret,
    md5sig,
  });

  if (!isVerified) {
    // Bad signature — don't touch the order. Still 200 to avoid retries.
    console.error('payhere-notify: signature mismatch for order', orderId);
    return new Response('OK', { status: 200 });
  }

  const paymentStatus = mapStatusCode(statusCode);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );

  let updateQuery = supabase
    .from('orders')
    .update({ payment_status: paymentStatus, payhere_payment_id: paymentId || null })
    .eq('id', orderId);

  if (paymentStatus === 'paid' || paymentStatus === 'failed') {
    // Stops a retried notification from double-decrementing stock/emailing twice.
    updateQuery = updateQuery.neq('payment_status', paymentStatus);
  }

  const { data: updatedOrder, error: updateError } = await updateQuery.select('id').maybeSingle();

  if (updateError) {
    console.error('payhere-notify: could not update order', orderId, updateError);
    return new Response('OK', { status: 200 });
  }

  if (!updatedOrder) {
    // Not found, or a duplicate notification — nothing to do.
    return new Response('OK', { status: 200 });
  }

  if (paymentStatus === 'paid') {
    try {
      await supabase.rpc('decrement_inventory_for_order', { p_order_id: orderId });
    } catch (err) {
      console.error('payhere-notify: inventory decrement failed', orderId, err);
    }

    try {
      await sendOrderConfirmationEmail(supabase, orderId);
    } catch (err) {
      console.error('payhere-notify: confirmation email failed', orderId, err);
    }

    await sendCustomerEmail(supabase, orderId, 'paid');
  }

  if (paymentStatus === 'failed') {
    await sendCustomerEmail(supabase, orderId, 'failed');
  }

  return new Response('OK', { status: 200 });
});
