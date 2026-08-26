// Pure PayHere business logic, shared between the payhere-initiate and
// payhere-notify Edge Functions (Deno) AND imported directly by the Vitest
// test suite (Node) — this file deliberately uses nothing but node:crypto,
// which both runtimes support natively, so it's the single source of truth
// for the hashing/verification math instead of two copies drifting apart.
// No Deno.serve, no Deno.env.get, no I/O of any kind lives here — anything
// that touches a request, the database, or an environment variable stays in
// the Edge Function files themselves. See docs/payhere-integration-plan.md
// §3 and §6 for the security reasoning behind each of these.

import { createHash } from 'node:crypto';

/**
 * Mirrors PayHere's own sample code (md5(...).toUpperCase()). Uses Node's
 * built-in crypto module (available in Deno via its node: compat layer, and
 * natively in Node/Vitest) rather than an npm: specifier — npm subpath
 * imports were unreliable to resolve at cold boot in the Supabase edge
 * runtime, which is what originally caused this to be rewritten.
 */
export function md5Upper(input) {
  return createHash('md5').update(input, 'utf8').digest('hex').toUpperCase();
}

/** Sri Lanka-only for now; mirrors src/features/addresses/deliveryZones.js. */
export const DELIVERY_ZONE_RATES = {
  colombo_1_15: 300,
  island_wide: 350,
};

export const CURRENCY = 'LKR';

/** '2'=success, '0'=pending, '-1'=cancelled, '-2'=failed, '-3'=chargedback. */
export const STATUS_MAP = {
  '2': 'paid',
  '0': 'pending',
  '-1': 'cancelled',
  '-2': 'failed',
  '-3': 'chargedback',
};

/** Any status code PayHere doesn't send us a mapping for is treated as failed, not silently ignored. */
export function mapStatusCode(statusCode) {
  return STATUS_MAP[statusCode] ?? 'failed';
}

/** No first/last name on file — split on whitespace, single-word names use themselves as both. */
export function splitName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'Customer', lastName: 'Customer' };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/**
 * PayHere's required checkout hash:
 *   upper(md5(merchant_id + order_id + amount + currency + upper(md5(merchant_secret))))
 * `amount` must be the exact string that will also be sent in the
 * startPayment() payload (e.g. "400.00") — a formatting mismatch here (extra
 * decimal, thousands separator) produces a hash PayHere will reject even
 * though the number is "the same".
 */
export function computeChargeHash({ merchantId, orderId, amount, currency, merchantSecret }) {
  const hashedSecret = md5Upper(merchantSecret);
  return md5Upper(`${merchantId}${orderId}${amount}${currency}${hashedSecret}`);
}

/**
 * PayHere's webhook signature:
 *   upper(md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + upper(md5(merchant_secret))))
 * Returns a boolean rather than throwing, so a forged/garbled notification
 * is simply "not verified" rather than an exception the caller has to
 * remember to catch.
 */
export function verifyNotifySignature({ merchantId, orderId, payhereAmount, payhereCurrency, statusCode, merchantSecret, md5sig }) {
  if (!md5sig) return false;
  const hashedSecret = md5Upper(merchantSecret);
  const expected = md5Upper(`${merchantId}${orderId}${payhereAmount}${payhereCurrency}${statusCode}${hashedSecret}`);
  return expected === md5sig.toUpperCase();
}

/**
 * Recomputes the authoritative order total from already-persisted data —
 * order_items.unit_price x quantity, plus a shipping rate looked up by zone
 * — never from anything submitted fresh in a request. This is what closes
 * the "customer edits the amount between placing the order and paying for
 * it" gap; see payhere-initiate's caller for how the result gets compared
 * against the order's stored grand_total.
 *
 * @param {Array<{unitPrice: number, quantity: number}>} items
 * @param {string} deliveryZone
 * @returns {{subtotal: number, shippingRate: number, total: number, amount: string} | null}
 *   null if the delivery zone isn't recognized (caller should treat this as
 *   a 400, not silently charge $0 shipping).
 */
export function recomputeOrderAmount(items, deliveryZone) {
  const shippingRate = DELIVERY_ZONE_RATES[deliveryZone];
  if (shippingRate === undefined) return null;

  const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity), 0);
  const total = subtotal + shippingRate;
  return { subtotal, shippingRate, total, amount: total.toFixed(2) };
}

/** 1-cent tolerance for float rounding — anything larger is a real mismatch, not rounding noise. */
export function amountsMatch(recomputedTotal, storedGrandTotal, tolerance = 0.01) {
  return Math.abs(recomputedTotal - Number(storedGrandTotal)) <= tolerance;
}
