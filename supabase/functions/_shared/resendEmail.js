// Shared Resend email logic — used by send-order-email, send-order-status-email,
// and payhere-notify. Template builders are pure (no fetch/env), so they can be
// unit tested the same way payhereLogic.js is. Only `sendEmail` does I/O.

const formatLKR = (amount) => `LKR ${Number(amount).toFixed(2)}`;

// Kept in sync by hand with src/shared/lib/brands.js (only two brands, not
// worth wiring up a shared import between the frontend and Edge Functions).
const BRAND_SHOP_SLUGS = {
  miracle_natural: 'miracle-natural',
  laira: 'laira',
};

const SITE_URL = 'https://leorawellness.lk';

const productLink = (brand, productId) =>
  `${SITE_URL}/${BRAND_SHOP_SLUGS[brand] || 'miracle-natural'}/shop/${productId}#reviews`;

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

// Fulfillment-status copy — keyed by orders.status (confirmed/shipped/delivered/cancelled).
// 'pending' has no email — it's the default state, not something an admin sets.
const ORDER_STATUS_CONTENT = {
  confirmed: {
    subject: 'Your order has been confirmed',
    heading: 'Order confirmed',
    intro: "Good news — we've confirmed your order and it's now being prepared.",
  },
  shipped: {
    subject: 'Your order is on its way',
    heading: 'Order shipped',
    intro: 'Your order has left our hands and is on its way to you.',
  },
  delivered: {
    subject: 'Your order has been delivered',
    heading: 'Order delivered',
    intro: 'Your order has been delivered. We hope you love it!',
  },
  cancelled: {
    subject: 'Your order has been cancelled',
    heading: 'Order cancelled',
    intro: "Your order has been cancelled. If this wasn't expected, please get in touch with us.",
  },
};

// Sent when an admin moves an order to confirmed/shipped/delivered/cancelled
// from the Orders dashboard. Returns null for statuses with no email (e.g. 'pending').
export function orderStatusEmail(order, items, status) {
  const content = ORDER_STATUS_CONTENT[status];
  if (!content) return null;

  return {
    subject: content.subject,
    html: wrapHtml(content.heading, `
      <p>Hi ${order.customer_name}, ${content.intro}</p>
      ${itemsListHtml(items)}
      <p><strong>Delivery Address:</strong> ${order.delivery_address}</p>
      <p style="color: #6b7a70; font-size: 13px;">Order reference: ${order.id}</p>
    `),
  };
}

// Sent a few days after an order is marked delivered, prompting a review.
// Each item links straight to that product's review form.
export function reviewRequestEmail(order, items) {
  const itemLinksHtml = items
    .map(
      (item) =>
        `<li>${item.product_name} — <a href="${productLink(order.brand, item.product_id)}" style="color: #4a7c59;">Leave a review</a></li>`
    )
    .join('');

  return {
    subject: 'How was your Miracle Natural order?',
    html: wrapHtml('How did we do?', `
      <p>Hi ${order.customer_name}, we hope you're enjoying your order! Your feedback helps other customers and helps us improve.</p>
      <ul style="padding-left: 18px; margin: 12px 0;">${itemLinksHtml}</ul>
      <p style="color: #6b7a70; font-size: 13px;">Order reference: ${order.id}</p>
    `),
  };
}

// Sent to the store admin (ORDER_NOTIFICATION_EMAIL) for every new order,
// alongside the existing formsubmit.co alert — see payhere-notify and
// send-order-email for where this is wired up.
export function adminNewOrderEmail(order, items, paymentMethodLabel) {
  return {
    subject: `New order — ${order.customer_name} (${formatLKR(order.grand_total)})`,
    html: wrapHtml('New order received', `
      ${itemsListHtml(items)}
      <p><strong>Customer:</strong> ${order.customer_name}<br/>
      <strong>Phone:</strong> ${order.customer_phone || 'Not provided'}<br/>
      <strong>Email:</strong> ${order.customer_email}<br/>
      <strong>Payment:</strong> ${paymentMethodLabel}<br/>
      <strong>Delivery Address:</strong> ${order.delivery_address}</p>
      <p><strong>Subtotal:</strong> ${formatLKR(order.subtotal)}<br/>
      <strong>Shipping:</strong> ${formatLKR(order.shipping_cost)}<br/>
      <strong>Total:</strong> ${formatLKR(order.grand_total)}</p>
      <p style="color: #6b7a70; font-size: 13px;">Order reference: ${order.id}</p>
    `),
  };
}

// The only function here that actually does I/O. Throws on failure so
// callers can decide whether to log-and-continue or surface the error.
// `scheduledAt` (ISO 8601 string or Resend's natural-language format like
// "in 3 days") delays delivery — Resend allows up to 30 days out.
export async function sendEmail({ apiKey, from, to, subject, html, scheduledAt }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      ...(scheduledAt ? { scheduled_at: scheduledAt } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Resend responded with ${response.status}: ${detail}`);
  }
}
