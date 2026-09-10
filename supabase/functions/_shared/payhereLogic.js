// Shared PayHere logic — used by both payhere-initiate and payhere-notify,
// and by the Vitest tests. Just node:crypto, so it runs the same in Deno
// and Node. No requests, no env vars, no DB calls here.

import { createHash } from 'node:crypto';

// PayHere wants md5(...).toUpperCase().
export function md5Upper(input) {
  return createHash('md5').update(input, 'utf8').digest('hex').toUpperCase();
}

// Sri Lanka only for now.
export const DELIVERY_ZONE_RATES = {
  colombo_1_15: 400,
  island_wide: 450,
};

export const CURRENCY = 'LKR';

// PayHere status codes.
export const STATUS_MAP = {
  '2': 'paid',
  '0': 'pending',
  '-1': 'cancelled',
  '-2': 'failed',
  '-3': 'chargedback',
};

export function mapStatusCode(statusCode) {
  return STATUS_MAP[statusCode] ?? 'failed';
}

// No first/last name on file, so split on whitespace.
export function splitName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'Customer', lastName: 'Customer' };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

// PayHere's checkout hash formula. `amount` must match exactly what gets
// sent to startPayment(), or the hash won't validate.
export function computeChargeHash({ merchantId, orderId, amount, currency, merchantSecret }) {
  const hashedSecret = md5Upper(merchantSecret);
  return md5Upper(`${merchantId}${orderId}${amount}${currency}${hashedSecret}`);
}

// PayHere's webhook signature check. Returns false instead of throwing.
export function verifyNotifySignature({ merchantId, orderId, payhereAmount, payhereCurrency, statusCode, merchantSecret, md5sig }) {
  if (!md5sig) return false;
  const hashedSecret = md5Upper(merchantSecret);
  const expected = md5Upper(`${merchantId}${orderId}${payhereAmount}${payhereCurrency}${statusCode}${hashedSecret}`);
  return expected === md5sig.toUpperCase();
}

// Recomputes the real order total from saved data, never from the request.
export function recomputeOrderAmount(items, deliveryZone) {
  const shippingRate = DELIVERY_ZONE_RATES[deliveryZone];
  if (shippingRate === undefined) return null;

  const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity), 0);
  const total = subtotal + shippingRate;
  return { subtotal, shippingRate, total, amount: total.toFixed(2) };
}

// 1-cent tolerance for rounding.
export function amountsMatch(recomputedTotal, storedGrandTotal, tolerance = 0.01) {
  return Math.abs(recomputedTotal - Number(storedGrandTotal)) <= tolerance;
}
