import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Star, Pencil, Trash2 } from 'lucide-react';
import { Typography } from '@/shared/ui/Typography';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';
import { useAuth } from '@/features/auth/AuthContext';
import {
  fetchApprovedReviews,
  fetchMyReviewForProduct,
  checkReviewEligibility,
  submitReview,
  updateMyReview,
  deleteMyReview,
} from '@/features/reviews/reviewsApi';

const STATUS_LABELS = {
  pending: 'Pending review',
  approved: 'Published',
  rejected: 'Not approved',
};

const STATUS_STYLES = {
  pending: 'border-amber-300 bg-amber-50 text-amber-800',
  approved: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  rejected: 'border-red-300 bg-red-50 text-red-700',
};

const formatDate = (isoString) =>
  new Date(isoString).toLocaleDateString('en-LK', { dateStyle: 'medium' });

// Read-only star row for an existing rating.
const StarRow = ({ rating, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={size}
        className={n <= Math.round(rating) ? 'fill-primary text-primary' : 'text-[var(--color-border-medium)]'}
      />
    ))}
  </div>
);

// Clickable star picker for the review form.
const StarPicker = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        aria-label={`${n} star${n === 1 ? '' : 's'}`}
        className="p-0.5"
      >
        <Star
          size={24}
          className={n <= value ? 'fill-primary text-primary' : 'text-[var(--color-border-medium)]'}
        />
      </button>
    ))}
  </div>
);

const emptyDraft = { rating: 0, title: '', comment: '' };

// Verified-purchase review section for a product detail page: average
// rating + approved review list, plus a write/edit form gated on the
// signed-in user having a delivered order containing this product.
const ProductReviews = ({ productId }) => {
  const { user, profile, loading: authLoading } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);

  const [myReview, setMyReview] = useState(null);
  const [isLoadingMyReview, setIsLoadingMyReview] = useState(true);
  const [eligibleOrderId, setEligibleOrderId] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsLoadingReviews(true);
    setReviewsError(null);
    fetchApprovedReviews(productId)
      .then(setReviews)
      .catch((error) => setReviewsError(error.message || 'Could not load reviews.'))
      .finally(() => setIsLoadingReviews(false));
  }, [productId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setMyReview(null);
      setEligibleOrderId(null);
      setIsLoadingMyReview(false);
      return;
    }

    setIsLoadingMyReview(true);
    fetchMyReviewForProduct(productId)
      .then((existing) => {
        setMyReview(existing);
        if (existing) return null;
        return checkReviewEligibility(productId).then(setEligibleOrderId);
      })
      .catch(() => {
        // Non-fatal — the write-a-review form just won't show.
        setMyReview(null);
        setEligibleOrderId(null);
      })
      .finally(() => setIsLoadingMyReview(false));
  }, [productId, user, authLoading]);

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const openNewReviewForm = () => {
    setDraft(emptyDraft);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = () => {
    setDraft({ rating: myReview.rating, title: myReview.title || '', comment: myReview.comment });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (draft.rating < 1) {
      setFormError('Please choose a star rating.');
      return;
    }
    if (!draft.comment.trim()) {
      setFormError('Please write a few words about the product.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (myReview) {
        const updated = await updateMyReview(myReview.id, draft);
        setMyReview(updated);
      } else {
        const created = await submitReview({
          productId,
          orderId: eligibleOrderId,
          reviewerName: profile?.full_name?.trim() || 'Verified Buyer',
          ...draft,
        });
        setMyReview(created);
      }
      setIsFormOpen(false);
    } catch (error) {
      setFormError(error.message || 'Could not save your review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;
    setIsDeleting(true);
    try {
      await deleteMyReview(myReview.id);
      setMyReview(null);
      setEligibleOrderId(await checkReviewEligibility(productId).catch(() => null));
    } catch (error) {
      setFormError(error.message || 'Could not delete your review. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div id="reviews" className="mt-10 pt-8 border-t border-[var(--color-border-light)]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <Typography variant="h4" className="text-foreground mb-1">Customer Reviews</Typography>
          {reviews.length > 0 ? (
            <div className="flex items-center gap-2">
              <StarRow rating={averageRating} />
              <span className="text-[0.82rem] text-muted-foreground">
                {averageRating.toFixed(1)} out of 5 · {reviews.length} review{reviews.length === 1 ? '' : 's'}
              </span>
            </div>
          ) : (
            !isLoadingReviews && <p className="text-[0.84rem] text-muted-foreground">No reviews yet.</p>
          )}
        </div>
      </div>

      {reviewsError ? (
        <p className="text-[0.84rem] text-red-600 mb-5">{reviewsError}</p>
      ) : isLoadingReviews ? (
        <p className="text-[0.84rem] text-muted-foreground mb-5">Loading reviews...</p>
      ) : reviews.length > 0 ? (
        <div className="space-y-4 mb-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <StarRow rating={review.rating} />
                <span className="text-[0.72rem] text-text-tertiary">{formatDate(review.created_at)}</span>
              </div>
              {review.title && (
                <p className="text-[0.88rem] font-semibold text-foreground mb-1">{review.title}</p>
              )}
              <p className="text-[0.86rem] leading-relaxed text-muted-foreground mb-2">{review.comment}</p>
              <p className="text-[0.74rem] font-semibold tracking-[0.06em] uppercase text-text-secondary">
                {review.reviewer_name}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {!authLoading && !isLoadingMyReview && (
        <>
          {!user ? (
            <p className="text-[0.82rem] text-muted-foreground">
              <Link to="/login" className="text-primary underline underline-offset-2">Sign in</Link> to write a
              review after your order is delivered.
            </p>
          ) : myReview && !isFormOpen ? (
            <div className="rounded-xl border border-[var(--color-border-light)] bg-white/60 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <p className="text-[0.78rem] font-semibold tracking-[0.06em] uppercase text-foreground">Your review</p>
                <span className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.06em] ${STATUS_STYLES[myReview.status]}`}>
                  {STATUS_LABELS[myReview.status]}
                </span>
              </div>
              <StarRow rating={myReview.rating} />
              {myReview.title && <p className="text-[0.86rem] font-semibold text-foreground mt-2">{myReview.title}</p>}
              <p className="text-[0.86rem] leading-relaxed text-muted-foreground mt-1">{myReview.comment}</p>
              {myReview.status === 'rejected' && myReview.admin_notes && (
                <p className="text-[0.8rem] text-red-600 mt-2">Reason: {myReview.admin_notes}</p>
              )}
              <div className="flex items-center gap-2.5 mt-3">
                <button
                  type="button"
                  onClick={openEditForm}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-medium)] px-3.5 py-2 text-[0.72rem] font-semibold text-foreground hover:bg-[var(--color-hover-overlay)] transition-colors"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3.5 py-2 text-[0.72rem] font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  <Trash2 size={13} /> {isDeleting ? 'Removing...' : 'Delete'}
                </button>
              </div>
            </div>
          ) : isFormOpen ? (
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-4 sm:p-5 space-y-3.5"
            >
              <div>
                <p className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1.5">Your rating</p>
                <StarPicker value={draft.rating} onChange={(rating) => setDraft((prev) => ({ ...prev, rating }))} />
              </div>
              <Input
                id="review-title"
                label="Title (optional)"
                type="text"
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              />
              <Textarea
                id="review-comment"
                label="Your review"
                rows={3}
                value={draft.comment}
                onChange={(event) => setDraft((prev) => ({ ...prev, comment: event.target.value }))}
              />
              {formError && <p className="text-[0.8rem] text-red-600">{formError}</p>}
              <div className="flex items-center gap-2.5">
                <Button type="submit" className="px-5 py-2 text-[0.72rem]" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : myReview ? 'Save Changes' : 'Submit Review'}
                </Button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-[0.76rem] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : eligibleOrderId ? (
            <Button variant="secondary" className="px-5 py-2.5 text-[0.72rem]" onClick={openNewReviewForm}>
              Write a Review
            </Button>
          ) : (
            <p className="text-[0.82rem] text-muted-foreground">
              Only customers with a delivered order for this product can leave a review.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default ProductReviews;
