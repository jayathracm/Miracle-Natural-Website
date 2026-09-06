import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, RefreshCw, RotateCcw, Star, X } from 'lucide-react';
import { Typography } from '@/shared/ui/Typography';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Textarea';
import { RowSkeletonList } from '@/shared/ui/Skeleton';
import { fetchAllReviewsForAdmin, updateReviewStatus } from '@/features/reviews/reviewsApi';

const STATUS_OPTIONS = ['pending', 'approved', 'rejected'];

const STATUS_STYLES = {
  pending: 'border-amber-300 bg-amber-50 text-amber-800',
  approved: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  rejected: 'border-red-300 bg-red-50 text-red-700',
};

const formatDate = (isoString) =>
  new Date(isoString).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' });

const StarRow = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} size={13} className={n <= rating ? 'fill-primary text-primary' : 'text-[var(--color-border-medium)]'} />
    ))}
  </div>
);

const AdminProductReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [updateError, setUpdateError] = useState(null);

  const loadReviews = () => {
    setIsLoading(true);
    setError(null);

    return fetchAllReviewsForAdmin()
      .then(setReviews)
      .catch((fetchError) => setError(fetchError.message || 'Could not load reviews.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    if (statusFilter === 'all') return reviews;
    return reviews.filter((review) => review.status === statusFilter);
  }, [reviews, statusFilter]);

  const statusCounts = useMemo(() => {
    return reviews.reduce(
      (acc, review) => {
        acc[review.status] = (acc[review.status] || 0) + 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );
  }, [reviews]);

  const handleExpand = (review) => {
    const isExpanded = expandedId === review.id;
    setExpandedId(isExpanded ? null : review.id);
    setNoteDraft(isExpanded ? '' : review.admin_notes || '');
    setUpdateError(null);
  };

  const handleStatusChange = async (review, status) => {
    setUpdatingId(review.id);
    setUpdateError(null);
    try {
      const updated = await updateReviewStatus(review.id, status, noteDraft.trim() || null);
      setReviews((prev) => prev.map((item) => (item.id === updated.id ? { ...updated, products: item.products } : item)));
    } catch (updateErrorCaught) {
      setUpdateError(updateErrorCaught.message || 'Could not save this change. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-6 sm:mb-8 rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(120deg,rgba(255,251,242,0.95),rgba(247,241,227,0.86))] px-5 py-6 sm:px-7 sm:py-8 shadow-[0_20px_42px_rgba(31,44,35,0.08)]">
          <Typography variant="label" className="mb-3 block">Admin Dashboard</Typography>
          <Typography variant="h2" className="text-foreground text-balance mb-4">
            Product Reviews
          </Typography>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase transition-colors ${statusFilter === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
            >
              All ({reviews.length})
            </button>
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase transition-colors ${statusFilter === status ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
              >
                {status} ({statusCounts[status] || 0})
              </button>
            ))}
            <Button variant="ghost" className="px-3 py-2 text-[0.72rem] ml-auto" onClick={loadReviews} icon={RefreshCw}>
              Refresh
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-[0.95rem] text-red-700">
            {error}
          </div>
        ) : isLoading ? (
          <RowSkeletonList count={4} />
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Star size={28} className="text-text-tertiary" />
            <Typography variant="small">No reviews match this filter yet.</Typography>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((review) => {
              const isExpanded = expandedId === review.id;
              const isUpdating = updatingId === review.id;

              return (
                <div
                  key={review.id}
                  className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] shadow-[0_10px_24px_rgba(31,44,35,0.06)] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => handleExpand(review)}
                    className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5 text-left"
                  >
                    <div className="flex-1 min-w-[220px]">
                      <p className="text-[0.9rem] font-semibold text-foreground">
                        {review.products?.name || review.product_id}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRow rating={review.rating} />
                        <p className="text-[0.76rem] text-muted-foreground">{review.reviewer_name}</p>
                      </div>
                      <p className="text-[0.72rem] text-text-tertiary mt-0.5">{formatDate(review.created_at)}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.06em] ${STATUS_STYLES[review.status] || 'border-gray-300 bg-gray-50 text-gray-700'}`}>
                        {review.status}
                      </span>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[var(--color-border-light)] px-4 py-4 sm:px-5 bg-white/50">
                      <div className="mb-4">
                        {review.title && (
                          <p className="text-[0.86rem] font-semibold text-foreground mb-1">{review.title}</p>
                        )}
                        <p className="text-[0.84rem] leading-relaxed text-foreground whitespace-pre-wrap">{review.comment}</p>
                      </div>

                      <Textarea
                        id={`review-notes-${review.id}`}
                        label="Admin Notes (shown to the reviewer if not approved)"
                        rows={2}
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                      />

                      {updateError && (
                        <p className="mt-2 text-[0.8rem] text-red-600">{updateError}</p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2.5">
                        {review.status !== 'approved' && (
                          <Button
                            icon={Check}
                            className="px-4 py-2 text-[0.72rem]"
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(review, 'approved')}
                          >
                            {isUpdating ? 'Saving...' : 'Approve'}
                          </Button>
                        )}
                        {review.status !== 'rejected' && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(review, 'rejected')}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-[0.72rem] font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                          >
                            <X size={14} />
                            Reject
                          </button>
                        )}
                        {review.status !== 'pending' && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(review, 'pending')}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-medium)] px-4 py-2 text-[0.72rem] font-semibold text-foreground hover:bg-[var(--color-hover-overlay)] transition-colors disabled:opacity-60"
                          >
                            <RotateCcw size={14} />
                            Reset to Pending
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductReviews;
