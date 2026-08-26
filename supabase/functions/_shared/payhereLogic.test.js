import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import {
  md5Upper,
  splitName,
  computeChargeHash,
  verifyNotifySignature,
  recomputeOrderAmount,
  amountsMatch,
  mapStatusCode,
  DELIVERY_ZONE_RATES,
} from './payhereLogic';

// Independent re-implementation of PayHere's formula, written directly
// against node:crypto rather than calling md5Upper/computeChargeHash —
// deliberately duplicated so these tests aren't just checking the
// implementation against itself.
function referenceMd5Upper(input) {
  return createHash('md5').update(input, 'utf8').digest('hex').toUpperCase();
}
function referenceChargeHash({ merchantId, orderId, amount, currency, merchantSecret }) {
  return referenceMd5Upper(`${merchantId}${orderId}${amount}${currency}${referenceMd5Upper(merchantSecret)}`);
}
function referenceNotifySig({ merchantId, orderId, payhereAmount, payhereCurrency, statusCode, merchantSecret }) {
  return referenceMd5Upper(`${merchantId}${orderId}${payhereAmount}${payhereCurrency}${statusCode}${referenceMd5Upper(merchantSecret)}`);
}

describe('md5Upper', () => {
  // Well-known MD5 test vectors — independent of this codebase, so these
  // catch a genuinely broken hash implementation, not just a change in
  // behavior.
  it('matches the known MD5 vector for an empty string', () => {
    expect(md5Upper('')).toBe('D41D8CD98F00B204E9800998ECF8427E');
  });

  it('matches the known MD5 vector for "hello"', () => {
    expect(md5Upper('hello')).toBe('5D41402ABC4B2A76B9719D911017C592');
  });

  it('always returns uppercase hex, per PayHere\'s spec', () => {
    expect(md5Upper('PayHere')).toBe(md5Upper('PayHere').toUpperCase());
  });
});

describe('splitName', () => {
  it('falls back to "Customer"/"Customer" for empty or missing input', () => {
    expect(splitName('')).toEqual({ firstName: 'Customer', lastName: 'Customer' });
    expect(splitName(undefined)).toEqual({ firstName: 'Customer', lastName: 'Customer' });
    expect(splitName('   ')).toEqual({ firstName: 'Customer', lastName: 'Customer' });
  });

  it('uses the single word as both first and last name', () => {
    expect(splitName('Cher')).toEqual({ firstName: 'Cher', lastName: 'Cher' });
  });

  it('splits a two-word name normally', () => {
    expect(splitName('Dinisha Bopitiya')).toEqual({ firstName: 'Dinisha', lastName: 'Bopitiya' });
  });

  it('joins everything after the first word into the last name', () => {
    expect(splitName('Mary Anne Smith')).toEqual({ firstName: 'Mary', lastName: 'Anne Smith' });
  });

  it('collapses extra internal whitespace', () => {
    expect(splitName('  Dinisha    Bopitiya  ')).toEqual({ firstName: 'Dinisha', lastName: 'Bopitiya' });
  });
});

describe('computeChargeHash', () => {
  const base = { merchantId: '1237346', orderId: 'order-abc-123', amount: '400.00', currency: 'LKR', merchantSecret: 'testsecret' };

  it('matches an independently computed reference implementation', () => {
    expect(computeChargeHash(base)).toBe(referenceChargeHash(base));
  });

  it('changes if the amount changes (a stale hash must not validate a different charge)', () => {
    const hash1 = computeChargeHash(base);
    const hash2 = computeChargeHash({ ...base, amount: '450.00' });
    expect(hash1).not.toBe(hash2);
  });

  it('changes if the order id changes', () => {
    const hash1 = computeChargeHash(base);
    const hash2 = computeChargeHash({ ...base, orderId: 'order-abc-124' });
    expect(hash1).not.toBe(hash2);
  });

  it('changes if the merchant secret changes', () => {
    const hash1 = computeChargeHash(base);
    const hash2 = computeChargeHash({ ...base, merchantSecret: 'differentsecret' });
    expect(hash1).not.toBe(hash2);
  });

  it('is deterministic — same input always produces the same hash', () => {
    expect(computeChargeHash(base)).toBe(computeChargeHash({ ...base }));
  });
});

describe('verifyNotifySignature', () => {
  const fields = {
    merchantId: '1237346',
    orderId: 'order-abc-123',
    payhereAmount: '400.00',
    payhereCurrency: 'LKR',
    statusCode: '2',
    merchantSecret: 'testsecret',
  };

  it('accepts a correctly signed notification', () => {
    const md5sig = referenceNotifySig(fields);
    expect(verifyNotifySignature({ ...fields, md5sig })).toBe(true);
  });

  it('accepts a correctly signed notification regardless of the signature\'s letter case', () => {
    const md5sig = referenceNotifySig(fields).toLowerCase();
    expect(verifyNotifySignature({ ...fields, md5sig })).toBe(true);
  });

  it('rejects a notification whose amount was tampered with after signing', () => {
    const md5sig = referenceNotifySig(fields); // signed for 400.00
    expect(verifyNotifySignature({ ...fields, payhereAmount: '4.00', md5sig })).toBe(false);
  });

  it('rejects a notification whose status code was tampered with (e.g. failed -> success)', () => {
    const md5sig = referenceNotifySig({ ...fields, statusCode: '-2' }); // genuinely signed as "failed"
    expect(verifyNotifySignature({ ...fields, statusCode: '2', md5sig })).toBe(false); // claims "success"
  });

  it('rejects when md5sig is missing entirely, rather than throwing', () => {
    expect(verifyNotifySignature({ ...fields, md5sig: '' })).toBe(false);
    expect(verifyNotifySignature({ ...fields, md5sig: undefined })).toBe(false);
  });

  it('rejects a notification signed with the wrong merchant secret', () => {
    const md5sig = referenceNotifySig({ ...fields, merchantSecret: 'wrongsecret' });
    expect(verifyNotifySignature({ ...fields, md5sig })).toBe(false);
  });
});

describe('mapStatusCode', () => {
  it('maps every documented PayHere status code', () => {
    expect(mapStatusCode('2')).toBe('paid');
    expect(mapStatusCode('0')).toBe('pending');
    expect(mapStatusCode('-1')).toBe('cancelled');
    expect(mapStatusCode('-2')).toBe('failed');
    expect(mapStatusCode('-3')).toBe('chargedback');
  });

  it('treats an unrecognized status code as failed rather than ignoring it', () => {
    expect(mapStatusCode('999')).toBe('failed');
    expect(mapStatusCode('')).toBe('failed');
    expect(mapStatusCode(undefined)).toBe('failed');
  });
});

describe('recomputeOrderAmount', () => {
  it('sums unit price x quantity across all items and adds the zone shipping rate', () => {
    const items = [{ unitPrice: 1200, quantity: 2 }, { unitPrice: 850, quantity: 1 }];
    const result = recomputeOrderAmount(items, 'colombo_1_15');
    expect(result.subtotal).toBe(3250); // 1200*2 + 850
    expect(result.shippingRate).toBe(DELIVERY_ZONE_RATES.colombo_1_15);
    expect(result.total).toBe(3250 + DELIVERY_ZONE_RATES.colombo_1_15);
    expect(result.amount).toBe((3250 + DELIVERY_ZONE_RATES.colombo_1_15).toFixed(2));
  });

  it('uses the island-wide rate for that zone', () => {
    const result = recomputeOrderAmount([{ unitPrice: 100, quantity: 1 }], 'island_wide');
    expect(result.shippingRate).toBe(DELIVERY_ZONE_RATES.island_wide);
  });

  it('returns null for an unrecognized delivery zone, rather than silently charging 0 shipping', () => {
    expect(recomputeOrderAmount([{ unitPrice: 100, quantity: 1 }], 'some_unknown_zone')).toBeNull();
  });

  it('handles an empty items array as a 0 subtotal plus shipping', () => {
    const result = recomputeOrderAmount([], 'colombo_1_15');
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(DELIVERY_ZONE_RATES.colombo_1_15);
  });

  it('coerces string unit prices/quantities (as they may arrive from Postgres numeric columns)', () => {
    const result = recomputeOrderAmount([{ unitPrice: '1200.50', quantity: '2' }], 'colombo_1_15');
    expect(result.subtotal).toBe(2401);
  });
});

describe('amountsMatch', () => {
  it('matches an exact total', () => {
    expect(amountsMatch(3550, 3550)).toBe(true);
  });

  it('tolerates sub-cent floating point rounding noise', () => {
    expect(amountsMatch(3550.004, 3550)).toBe(true);
  });

  it('rejects a real mismatch beyond the tolerance', () => {
    expect(amountsMatch(3550, 3500)).toBe(false);
  });

  it('respects a custom tolerance if given one', () => {
    expect(amountsMatch(100, 100.5, 1)).toBe(true);
    expect(amountsMatch(100, 102, 1)).toBe(false);
  });

  it('coerces a string stored total (as Postgres numeric columns often arrive)', () => {
    expect(amountsMatch(3550, '3550.00')).toBe(true);
  });
});
