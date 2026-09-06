// Shared Resend email logic — used by send-order-email and payhere-notify.
// Template builders are pure (no fetch/env), so they can be unit tested the
// same way payhereLogic.js is. Only `sendEmail` does I/O.

const formatLKR = (amount) => `LKR ${Number(amount).toFixed(2)}`;

const wrapHtml = (title, bodyHtml) => `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2c23;">
    <h2 style="margin: 0 0 16px;">${title}</h2>
    ${bodyHtml}
    <p style="margin-top: 32px; font-size: 12px; color: #6b7a70;">Leora Wellness (Pvt) Ltd</p>
  </div>
`;

const itemsListHtml = (items) =>
  `<ul style="padding-left: 18px; margin: 12px 0;">${items
    .map((item) => `<li>${item.product_name} × ${item.quantity} — ${formatLKR(item.line_total)}</li>`)
    .join('')}</ul>`;

// Sent right away for Cash on Delivery orders (no payment step to wait on).
export function orderConfirmationEmail(order, items) {
  return {
    subject: `Order confirmed — ${order.customer_name}`,
    html: wrapHtml('Your order is confirmed', `
      <p>Hi ${order.customer_name}, thanks for your order! Here's a summary:</p>
      ${itemsListHtml(items)}
      <p><strong>Subtotal:</strong> ${formatLKR(order.subtotal)}<br/>
      <strong>Shipping:</strong> ${formatLKR(order.shipping_cost)}<br/>
      <strong>Total:</strong> ${formatLKR(order.grand_total)}</p>
      <p><strong>Payment:</strong> Cash on Delivery<br/>
      <strong>Delivery Address:</strong> ${order.delivery_address}</p>
      <p style="color: #6b7a70; font-size: 13px;">Order reference: ${order.id}</p>
    `),
  };
}

// Sent once payhere-notify confirms the payment went through.
export function paymentSuccessEmail(order, items) {
  return {
    subject: `Payment received — order confirmed`,
    html: wrapHtml('Payment received, order confirmed', `
      <p>Hi ${order.customer_name}, your payment went through and your order is confirmed:</p>
      ${itemsListHtml(items)}
      <p><strong>Total Paid:</strong> ${formatLKR(order.grand_total)}<br/>
      <strong>Delivery Address:</strong> ${order.delivery_address}</p>
      <p style="color: #6b7a70; font-size: 13px;">Order reference: ${order.id}</p>
    `),
  };
}

// Sent when PayHere reports the payment failed/was cancelled/charged back.
export function paymentFailedEmail(order) {
  return {
    subject: `Payment unsuccessful for your order`,
    html: wrapHtml('Payment unsuccessful', `
      <p>Hi ${order.customer_name}, unfortunately your payment for order ${order.id} did not go through.</p>
      <p>No money has been taken and your order has not been placed. Please try again, or choose Cash on Delivery instead.</p>
      <p style="color: #6b7a70; font-size: 13px;">Order reference: ${order.id}</p>
    `),
  };
}

// The only function here that actually does I/O. Throws on failure so
// callers can decide whether to log-and-continue or surface the error.
export async function sendEmail({ apiKey, from, to, subject, html }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Resend responded with ${response.status}: ${detail}`);
  }
}
