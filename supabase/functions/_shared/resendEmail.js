// Shared Resend email logic — used by send-order-email, send-order-status-email,
// and payhere-notify. Template builders are pure (no fetch/env), so they can be
// unit tested the same way payhereLogic.js is. Only `sendEmail` does I/O.
//
// Layout uses HTML tables with inline styles (not flexbox/divs) on purpose —
// that's still the only markup that renders consistently across Gmail,
// Outlook, and Apple Mail, which is why every real ecommerce ESP (Shopify,
// Klaviyo, etc.) builds transactional emails this way.

const formatLKR = (amount) => `LKR ${Number(amount).toFixed(2)}`;

// Kept in sync by hand with src/shared/lib/brands.js (only two brands, not
// worth wiring up a shared import between the frontend and Edge Functions).
const BRAND_SHOP_SLUGS = {
  miracle_natural: 'miracle-natural',
  laira: 'laira',
};

const BRAND_LABELS = {
  miracle_natural: 'Miracle Natural',
  laira: 'Laira',
};

const SITE_URL = 'https://leorawellness.lk';

// Served from /public/emails — email clients fetch images over the internet,
// so these need a stable, deployed URL rather than a bundled Vite asset path.
const BRAND_LOGOS = {
  miracle_natural: { url: `${SITE_URL}/emails/miracle-natural-logo.png`, width: 130, height: 48, alt: 'Miracle Natural' },
  laira: { url: `${SITE_URL}/emails/laira-logo.png`, width: 110, height: 38, alt: 'Laira' },
};

// Design tokens — mirrors the site's own palette (src/index.css --color-primary etc.)
const COLOR = {
  page: '#f4f1ea',
  card: '#ffffff',
  border: '#e5e0d3',
  text: '#1f2c23',
  muted: '#6b7a70',
  brand: '#4f7154',
  brandDark: '#3d5a41',
  brandSoft: '#eef2ea',
  cream: '#faf8f2',
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const productLink = (brand, productId) =>
  `${SITE_URL}/${BRAND_SHOP_SLUGS[brand] || 'miracle-natural'}/shop/${productId}#reviews`;

const shopLink = (brand) => `${SITE_URL}/${BRAND_SHOP_SLUGS[brand] || 'miracle-natural'}/shop`;

const logoHtml = (brand) => {
  const logo = BRAND_LOGOS[brand] || BRAND_LOGOS.miracle_natural;
  return `<img src="${logo.url}" alt="${logo.alt}" width="${logo.width}" height="${logo.height}" style="display: inline-block; max-width: 100%; height: auto; border: 0;" />`;
};

// A real button, not a plain link — rendered as a table cell so the
// background/border-radius survives in Outlook's Word-based engine too.
const ctaButtonHtml = (url, label) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto 4px;">
    <tr>
      <td style="border-radius: 8px; background: ${COLOR.brand};">
        <a href="${url}" style="display: inline-block; padding: 14px 34px; font-family: ${FONT}; font-size: 15px; font-weight: 600; color: #fbf7ea; text-decoration: none; border-radius: 8px;">${label}</a>
      </td>
    </tr>
  </table>
`;

// Line-item table — a proper table instead of a bulleted list, the way
// Shopify/Klaviyo-style order emails lay out purchased items.
const itemsTableHtml = (items) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 20px 0 4px;">
    ${items
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid ${COLOR.border}; font-size: 14px; color: ${COLOR.text};">
          ${item.product_name}
          <span style="color: ${COLOR.muted}; font-size: 13px;"> &times; ${item.quantity}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid ${COLOR.border}; font-size: 14px; color: ${COLOR.text}; text-align: right; white-space: nowrap;">
          ${formatLKR(item.line_total)}
        </td>
      </tr>`
      )
      .join('')}
  </table>
`;

// Right-aligned Subtotal/Shipping/Total block under the item table.
const totalsTableHtml = (rows) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 4px 0 4px;">
    ${rows
      .map(
        ({ label, value, emphasize }) => `
      <tr>
        <td style="padding: ${emphasize ? '10px' : '4px'} 0 2px; font-size: ${emphasize ? '16px' : '13px'}; font-weight: ${emphasize ? '700' : '400'}; color: ${emphasize ? COLOR.text : COLOR.muted};">${label}</td>
        <td style="padding: ${emphasize ? '10px' : '4px'} 0 2px; font-size: ${emphasize ? '16px' : '13px'}; font-weight: ${emphasize ? '700' : '400'}; color: ${emphasize ? COLOR.text : COLOR.muted}; text-align: right;">${value}</td>
      </tr>`
      )
      .join('')}
  </table>
`;

// Soft card for secondary details (delivery address, payment method, etc.)
// instead of burying them in a run-on paragraph.
const infoBoxHtml = (rows) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${COLOR.cream}; border: 1px solid ${COLOR.border}; border-radius: 10px; margin: 20px 0;">
    <tr>
      <td style="padding: 16px 20px;">
        ${rows
          .map(
            ([label, value]) =>
              `<p style="margin: 0 0 6px; font-size: 13px; color: ${COLOR.muted}; line-height: 1.5;"><strong style="color: ${COLOR.text};">${label}:</strong> ${value}</p>`
          )
          .join('')}
      </td>
    </tr>
  </table>
`;

// Gmail/Apple Mail show this as the inbox preview snippet, right after the
// subject — real ecommerce sends always set one instead of leaving it to
// whatever text happens to be first in the HTML.
const preheaderHtml = (text) =>
  `<div style="display: none; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; color: ${COLOR.page};">${text}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`;

// The outer card shell every email is built from: rounded white card, brand
// accent stripe, centered logo, then whatever body content the caller passes.
const emailShell = ({ brand, preheader, bodyHtml }) => `
  ${preheaderHtml(preheader || '')}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${COLOR.page}; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; font-family: ${FONT};">
          <tr>
            <td style="background: ${COLOR.card}; border: 1px solid ${COLOR.border}; border-radius: 14px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height: 4px; background: linear-gradient(90deg, ${COLOR.brand}, ${COLOR.brandDark}); border-radius: 14px 14px 0 0;"></td>
                </tr>
                <tr>
                  <td style="padding: 32px 40px 4px; text-align: center;">${logoHtml(brand)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 40px 36px; color: ${COLOR.text};">${bodyHtml}</td>
                </tr>
                <tr>
                  <td style="padding: 18px 40px; background: ${COLOR.cream}; border-top: 1px solid ${COLOR.border}; border-radius: 0 0 14px 14px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: ${COLOR.muted};">Leora Wellness (Pvt) Ltd &middot; leorawellness.lk</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

const heading = (text) => `<h1 style="margin: 0 0 12px; font-size: 21px; font-weight: 700; color: ${COLOR.text}; text-align: center;">${text}</h1>`;
const paragraph = (text) => `<p style="margin: 0 0 4px; font-size: 14.5px; line-height: 1.6; color: ${COLOR.text}; text-align: center;">${text}</p>`;
const orderRef = (id) => `<p style="margin: 24px 0 0; font-size: 12px; color: ${COLOR.muted}; text-align: center;">Order reference: ${id}</p>`;

// Sent right away for Cash on Delivery orders (no payment step to wait on).
export function orderConfirmationEmail(order, items) {
  const bodyHtml = `
    ${heading('Your order is confirmed')}
    ${paragraph(`Hi ${order.customer_name}, thanks for shopping with us! Here's your order summary.`)}
    ${itemsTableHtml(items)}
    ${totalsTableHtml([
      { label: 'Subtotal', value: formatLKR(order.subtotal) },
      { label: 'Shipping', value: formatLKR(order.shipping_cost) },
      { label: 'Total', value: formatLKR(order.grand_total), emphasize: true },
    ])}
    ${infoBoxHtml([
      ['Payment', 'Cash on Delivery'],
      ['Delivery address', order.delivery_address],
    ])}
    ${ctaButtonHtml(`${SITE_URL}/account?tab=orders`, 'View My Orders')}
    ${orderRef(order.id)}
  `;

  return {
    subject: `Order confirmed — ${order.customer_name}`,
    html: emailShell({
      brand: order.brand,
      preheader: `Your order is confirmed — total ${formatLKR(order.grand_total)}, paid on delivery.`,
      bodyHtml,
    }),
  };
}

// Sent once payhere-notify confirms the payment went through.
export function paymentSuccessEmail(order, items) {
  const bodyHtml = `
    ${heading('Payment received')}
    ${paragraph(`Hi ${order.customer_name}, your payment went through and your order is confirmed.`)}
    ${itemsTableHtml(items)}
    ${totalsTableHtml([{ label: 'Total Paid', value: formatLKR(order.grand_total), emphasize: true }])}
    ${infoBoxHtml([['Delivery address', order.delivery_address]])}
    ${ctaButtonHtml(`${SITE_URL}/account?tab=orders`, 'View My Orders')}
    ${orderRef(order.id)}
  `;

  return {
    subject: 'Payment received — order confirmed',
    html: emailShell({
      brand: order.brand,
      preheader: `Payment received — ${formatLKR(order.grand_total)}. Your order is confirmed.`,
      bodyHtml,
    }),
  };
}

// Sent when PayHere reports the payment failed/was cancelled/charged back.
export function paymentFailedEmail(order) {
  const bodyHtml = `
    ${heading('Payment unsuccessful')}
    ${paragraph(`Hi ${order.customer_name}, unfortunately your payment for this order did not go through.`)}
    ${paragraph('No money has been taken and your order has not been placed. You can try again, or choose Cash on Delivery instead.')}
    ${ctaButtonHtml(shopLink(order.brand), 'Try Again')}
    ${orderRef(order.id)}
  `;

  return {
    subject: 'Payment unsuccessful for your order',
    html: emailShell({
      brand: order.brand,
      preheader: 'Your payment did not go through — no money was taken.',
      bodyHtml,
    }),
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

  const bodyHtml = `
    ${heading(content.heading)}
    ${paragraph(`Hi ${order.customer_name}, ${content.intro}`)}
    ${itemsTableHtml(items)}
    ${infoBoxHtml([['Delivery address', order.delivery_address]])}
    ${ctaButtonHtml(`${SITE_URL}/account?tab=orders`, 'View My Orders')}
    ${orderRef(order.id)}
  `;

  return {
    subject: content.subject,
    html: emailShell({ brand: order.brand, preheader: content.intro, bodyHtml }),
  };
}

// Sent a few days after an order is marked delivered, prompting a review.
// Each item is its own small "review" pill linking straight to that
// product's review form, rather than a plain bulleted list of links.
export function reviewRequestEmail(order, items) {
  const itemRowsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid ${COLOR.border}; font-size: 14px; color: ${COLOR.text};">${item.product_name}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid ${COLOR.border}; text-align: right;">
          <a href="${productLink(order.brand, item.product_id)}" style="display: inline-block; padding: 6px 14px; border: 1px solid ${COLOR.brand}; border-radius: 999px; color: ${COLOR.brand}; font-size: 12.5px; font-weight: 600; text-decoration: none; white-space: nowrap;">Leave a review</a>
        </td>
      </tr>`
    )
    .join('');

  const brandLabel = BRAND_LABELS[order.brand] || BRAND_LABELS.miracle_natural;

  const bodyHtml = `
    ${heading('How did we do?')}
    ${paragraph(`Hi ${order.customer_name}, we hope you're enjoying your order! Your feedback helps other customers and helps us improve.`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 20px 0 4px;">${itemRowsHtml}</table>
    ${orderRef(order.id)}
  `;

  return {
    subject: `How was your ${brandLabel} order?`,
    html: emailShell({
      brand: order.brand,
      preheader: "We'd love to hear what you think of your recent order.",
      bodyHtml,
    }),
  };
}

// Sent to the store admin (ORDER_NOTIFICATION_EMAIL) for every new order,
// alongside the existing formsubmit.co alert — see payhere-notify and
// send-order-email for where this is wired up.
export function adminNewOrderEmail(order, items, paymentMethodLabel) {
  const brandLabel = BRAND_LABELS[order.brand] || BRAND_LABELS.miracle_natural;

  const bodyHtml = `
    ${heading('New order received')}
    ${itemsTableHtml(items)}
    ${totalsTableHtml([
      { label: 'Subtotal', value: formatLKR(order.subtotal) },
      { label: 'Shipping', value: formatLKR(order.shipping_cost) },
      { label: 'Total', value: formatLKR(order.grand_total), emphasize: true },
    ])}
    ${infoBoxHtml([
      ['Brand', brandLabel],
      ['Customer', order.customer_name],
      ['Phone', order.customer_phone || 'Not provided'],
      ['Email', order.customer_email],
      ['Payment', paymentMethodLabel],
      ['Delivery address', order.delivery_address],
    ])}
    ${orderRef(order.id)}
  `;

  return {
    subject: `New order — ${order.customer_name} (${formatLKR(order.grand_total)})`,
    html: emailShell({
      brand: order.brand,
      preheader: `New ${brandLabel} order from ${order.customer_name} — ${formatLKR(order.grand_total)}.`,
      bodyHtml,
    }),
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
