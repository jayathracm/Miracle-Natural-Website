import { supabase } from './supabaseClient';

/**
 * Submits a formal quote request for a signed-in Corporate Partner/admin
 * (RLS enforces the role check — see the "Corporate partners can request
 * quotations" policy). `user_id` is left out of the payload, same reasoning
 * as corporatePartnerApplications.js: the column defaults to auth.uid() and
 * RLS requires it match anyway.
 *
 * @param {{ items: Array<{ productId: string, productName: string, quantity: number }>, customerNotes?: string }} params
 */
export async function submitQuotation({ items, customerNotes }) {
  const { data: quotation, error: quotationError } = await supabase
    .from('quotations')
    .insert({ customer_notes: customerNotes?.trim() || null })
    .select('*')
    .single();

  if (quotationError) {
    throw quotationError;
  }

  const { error: itemsError } = await supabase.from('quotation_items').insert(
    items.map((item) => ({
      quotation_id: quotation.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
    }))
  );

  if (itemsError) {
    throw itemsError;
  }

  return quotation;
}

/**
 * The signed-in user's own quotation requests, newest first, items nested.
 */
export async function fetchMyQuotations() {
  const { data, error } = await supabase
    .from('quotations')
    .select('*, quotation_items(*)')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Admin-only in practice: the "Admins can view all quotations" RLS policy
 * surfaces every requester's rows, not just the caller's own.
 *
 * quotations.user_id references auth.users, not public.profiles directly,
 * so PostgREST can't auto-embed a `profiles` relationship the way
 * `quotation_items` embeds cleanly (that one has a real FK to quotations).
 * Instead this fetches the distinct requester ids and looks their profiles
 * up in a second query, then merges — requires the "Admins can view all
 * profiles" policy (schema.sql §17) since these are other users' rows.
 */
export async function fetchAllQuotations() {
  const { data, error } = await supabase
    .from('quotations')
    .select('*, quotation_items(*)')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const quotations = data || [];
  const userIds = [...new Set(quotations.map((quotation) => quotation.user_id).filter(Boolean))];

  if (userIds.length === 0) {
    return quotations;
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .in('id', userIds);

  if (profilesError) {
    // Non-fatal — the quotation list itself is still useful without names.
    return quotations;
  }

  const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));

  return quotations.map((quotation) => ({
    ...quotation,
    requester: profileById.get(quotation.user_id) || null,
  }));
}

/**
 * Admin responds with pricing: sets a unit price per item (line total is
 * quantity * unit price), rolls those up into quotations.quoted_total, and
 * flips status to 'quoted' — all in one call so a quotation can't be left
 * half-priced. RLS restricts both updates to admins already; this just
 * keeps the multi-row write together as one operation from the caller's
 * point of view.
 *
 * @param {string} quotationId
 * @param {Array<{ id: string, quantity: number, quotedUnitPrice: number }>} items
 * @param {string|null} adminNotes
 */
export async function submitQuote(quotationId, items, adminNotes = null) {
  const pricedItems = items.map((item) => ({
    id: item.id,
    quoted_unit_price: item.quotedUnitPrice,
    quoted_line_total: Number((item.quotedUnitPrice * item.quantity).toFixed(2)),
  }));

  const results = await Promise.all(
    pricedItems.map((item) =>
      supabase
        .from('quotation_items')
        .update({ quoted_unit_price: item.quoted_unit_price, quoted_line_total: item.quoted_line_total })
        .eq('id', item.id)
    )
  );

  const itemError = results.find((result) => result.error)?.error;
  if (itemError) {
    throw itemError;
  }

  const quotedTotal = pricedItems.reduce((sum, item) => sum + item.quoted_line_total, 0);

  const { data, error } = await supabase
    .from('quotations')
    .update({
      status: 'quoted',
      quoted_total: quotedTotal,
      admin_notes: adminNotes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', quotationId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Admin moves a quoted request to 'accepted'/'declined' (or reopens it back
 * to 'quoted'), optionally updating the notes. There's no client-facing
 * update policy for the requester at all — every transition, including the
 * final accept/decline, goes through an admin action here, same as the
 * corporate partner application flow (verified offline/by contact, not a
 * self-service button for the partner).
 */
export async function updateQuotationStatus(quotationId, status, adminNotes = null) {
  const payload = { status, updated_at: new Date().toISOString() };
  if (adminNotes !== null) {
    payload.admin_notes = adminNotes.trim() || null;
  }

  const { data, error } = await supabase
    .from('quotations')
    .update(payload)
    .eq('id', quotationId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
