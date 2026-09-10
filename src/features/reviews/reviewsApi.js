import { supabase } from '@/shared/lib/supabaseClient';

/**
 * Approved reviews for a product, newest first — what everyone sees on the
 * product page. RLS already limits this to status = 'approved' for
 * anonymous/other users, so no filter needed here.
 */
export async function fetchApprovedReviews(productId) {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Average rating + review count per product, across the whole catalog in
 * one query — what the shop grid's star ratings are built from. RLS
 * already limits this to approved reviews for anon/other users, same as
 * fetchApprovedReviews. Aggregated client-side rather than via a DB view
 * since the catalog is small enough that one lightweight query is simpler
 * than adding a schema object.
 */
export async function fetchRatingsSummary() {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('product_id, rating')
    .eq('status', 'approved');

  if (error) throw error;

  const totals = new Map();
  (data || []).forEach(({ product_id, rating }) => {
    const entry = totals.get(product_id) || { sum: 0, count: 0 };
    entry.sum += rating;
    entry.count += 1;
    totals.set(product_id, entry);
  });

  const summary = {};
  totals.forEach((entry, productId) => {
    summary[productId] = { average: entry.sum / entry.count, count: entry.count };
  });
  return summary;
}

/**
 * The signed-in user's own review for this product, whatever its status —
 * lets the product page show "your review is pending" or let them edit it,
 * instead of just letting them submit a second one.
 */
export async function fetchMyReviewForProduct(productId) {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('product_id', productId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

/**
 * Whether the signed-in user has a delivered order containing this product
 * — the same check the insert policy enforces server-side. Returns the
 * order_id to attach to the review, or null if they're not eligible.
 */
export async function checkReviewEligibility(productId) {
  const { data, error } = await supabase.rpc('find_reviewable_order_id', {
    p_product_id: productId,
  });

  if (error) throw error;
  return data || null;
}

/**
 * Submits a new review. reviewerName is passed in by the caller (from the
 * signed-in user's profile) rather than looked up here, since it's copied
 * onto the row at write time — see the schema comment on product_reviews.
 */
export async function submitReview({ productId, orderId, reviewerName, rating, title, comment }) {
  const { data, error } = await supabase
    .from('product_reviews')
    .insert({
      product_id: productId,
      order_id: orderId,
      reviewer_name: reviewerName,
      rating,
      title: title?.trim() || null,
      comment: comment.trim(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Edits the signed-in user's own review. The update policy forces status
 * back to 'pending' on any edit, so a changed review goes through
 * moderation again before it's shown publicly.
 */
export async function updateMyReview(reviewId, { rating, title, comment }) {
  const { data, error } = await supabase
    .from('product_reviews')
    .update({
      rating,
      title: title?.trim() || null,
      comment: comment.trim(),
      status: 'pending',
      admin_notes: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMyReview(reviewId) {
  const { error } = await supabase.from('product_reviews').delete().eq('id', reviewId);
  if (error) throw error;
}

/**
 * Admin-only in practice: the "Admins can view all reviews" RLS policy
 * means an admin's session sees every reviewer's row, not just their own.
 * Joins the product name in so the moderation queue doesn't just show ids.
 */
export async function fetchAllReviewsForAdmin() {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*, products(name)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateReviewStatus(reviewId, status, adminNotes = null) {
  const { data, error } = await supabase
    .from('product_reviews')
    .update({
      status,
      admin_notes: adminNotes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
