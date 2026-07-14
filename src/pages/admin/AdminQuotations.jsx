import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, FileText, RefreshCw, Send, X } from 'lucide-react';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { RowSkeletonList } from '../../components/ui/Skeleton';
import { fetchAllQuotations, submitQuote, updateQuotationStatus } from '../../lib/quotations';

const STATUS_OPTIONS = ['requested', 'quoted', 'accepted', 'declined'];

const STATUS_STYLES = {
  requested: 'border-amber-300 bg-amber-50 text-amber-800',
  quoted: 'border-sky-300 bg-sky-50 text-sky-800',
  accepted: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  declined: 'border-red-300 bg-red-50 text-red-700',
};

const formatCurrency = (amount) => `LKR ${Number(amount).toLocaleString('en-LK')}`;

const formatDate = (isoString) =>
  new Date(isoString).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' });

const AdminQuotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('requested');
  const [expandedId, setExpandedId] = useState(null);
  const [priceDrafts, setPriceDrafts] = useState({});
  const [notesDraft, setNotesDraft] = useState('');
  const [submittingId, setSubmittingId] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const loadQuotations = () => {
    setIsLoading(true);
    setError(null);

    return fetchAllQuotations()
      .then(setQuotations)
      .catch((fetchError) => setError(fetchError.message || 'Could not load quote requests.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const filteredQuotations = useMemo(() => {
    if (statusFilter === 'all') return quotations;
    return quotations.filter((quotation) => quotation.status === statusFilter);
  }, [quotations, statusFilter]);

  const statusCounts = useMemo(() => {
    return quotations.reduce(
      (acc, quotation) => {
        acc[quotation.status] = (acc[quotation.status] || 0) + 1;
        return acc;
      },
      { requested: 0, quoted: 0, accepted: 0, declined: 0 }
    );
  }, [quotations]);

  const handleExpand = (quotation) => {
    const isExpanded = expandedId === quotation.id;
    setExpandedId(isExpanded ? null : quotation.id);
    setPriceDrafts({});
    setNotesDraft(isExpanded ? '' : quotation.admin_notes || '');
    setSubmitError(null);
  };

  const handleSendQuote = async (quotation) => {
    const items = quotation.quotation_items || [];
    const priced = items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      quotedUnitPrice: Number(priceDrafts[item.id]),
    }));

    const hasInvalidPrice = priced.some(
      (item) => !priceDrafts[item.id] || Number.isNaN(item.quotedUnitPrice) || item.quotedUnitPrice < 0
    );
    if (hasInvalidPrice) {
      setSubmitError('Please enter a valid unit price for every item.');
      return;
    }

    setSubmittingId(quotation.id);
    setSubmitError(null);
    try {
      await submitQuote(quotation.id, priced, notesDraft.trim() || null);
      setExpandedId(null);
      setPriceDrafts({});
      setNotesDraft('');
      await loadQuotations();
    } catch (sendError) {
      setSubmitError(sendError.message || 'Could not send this quote. Please try again.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleStatusChange = async (quotation, status) => {
    setSubmittingId(quotation.id);
    setSubmitError(null);
    try {
      await updateQuotationStatus(quotation.id, status);
      await loadQuotations();
    } catch (statusError) {
      setSubmitError(statusError.message || 'Could not update this request. Please try again.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-6 sm:mb-8 rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(120deg,rgba(255,251,242,0.95),rgba(247,241,227,0.86))] px-5 py-6 sm:px-7 sm:py-8 shadow-[0_20px_42px_rgba(31,44,35,0.08)]">
          <Typography variant="label" className="mb-3 block">Admin Dashboard</Typography>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Typography variant="h2" className="text-foreground text-balance">
              Quotation Requests
            </Typography>
            <Button variant="ghost" className="px-3 py-2 text-[0.72rem]" onClick={loadQuotations} icon={RefreshCw}>
              Refresh
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase transition-colors ${statusFilter === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
            >
              All ({quotations.length})
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
          </div>
        </div>

        {submitError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.82rem] text-red-700">
            {submitError}
          </div>
        )}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-[0.95rem] text-red-700">
            {error}
          </div>
        ) : isLoading ? (
          <RowSkeletonList count={4} />
        ) : filteredQuotations.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <FileText size={28} className="text-text-tertiary" />
            <Typography variant="small">No quote requests match this filter yet.</Typography>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuotations.map((quotation) => {
              const isExpanded = expandedId === quotation.id;
              const isSubmitting = submittingId === quotation.id;
              const items = quotation.quotation_items || [];

              return (
                <div
                  key={quotation.id}
                  className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] shadow-[0_10px_24px_rgba(31,44,35,0.06)] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => handleExpand(quotation)}
                    className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5 text-left"
                  >
                    <div className="flex-1 min-w-[220px]">
                      <p className="text-[0.9rem] font-semibold text-foreground">
                        {quotation.requester?.full_name || 'Unknown requester'}
                      </p>
                      <p className="text-[0.76rem] text-muted-foreground">
                        {quotation.requester?.phone || 'No phone on file'} · {items.length} item{items.length === 1 ? '' : 's'}
                      </p>
                      <p className="text-[0.72rem] text-text-tertiary mt-0.5">{formatDate(quotation.created_at)}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.06em] ${STATUS_STYLES[quotation.status] || 'border-gray-300 bg-gray-50 text-gray-700'}`}>
                        {quotation.status}
                      </span>
                      {quotation.quoted_total != null && (
                        <p className="font-display text-[1.1rem] text-primary">{formatCurrency(quotation.quoted_total)}</p>
                      )}
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[var(--color-border-light)] px-4 py-4 sm:px-5 bg-white/50">
                      {quotation.customer_notes && (
                        <p className="text-[0.82rem] text-muted-foreground mb-3">
                          <span className="font-semibold text-foreground">Requester's notes:</span> {quotation.customer_notes}
                        </p>
                      )}

                      {quotation.status === 'requested' ? (
                        <>
                          <p className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-2">
                            Set a unit price for each item
                          </p>
                          <div className="space-y-2.5 mb-3">
                            {items.map((item) => (
                              <div key={item.id} className="flex flex-wrap items-center gap-2.5">
                                <span className="flex-1 min-w-[160px] text-[0.86rem] text-foreground">
                                  {item.product_name} × {item.quantity}
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Unit price (LKR)"
                                  value={priceDrafts[item.id] || ''}
                                  onChange={(event) =>
                                    setPriceDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))
                                  }
                                  wrapperClassName="w-40"
                                />
                              </div>
                            ))}
                          </div>

                          <Textarea
                            id={`quote-notes-${quotation.id}`}
                            label="Notes to requester (optional)"
                            rows={2}
                            value={notesDraft}
                            onChange={(event) => setNotesDraft(event.target.value)}
                          />

                          <div className="mt-3">
                            <Button
                              icon={Send}
                              className="px-4 py-2 text-[0.72rem]"
                              disabled={isSubmitting}
                              onClick={() => handleSendQuote(quotation)}
                            >
                              {isSubmitting ? 'Sending...' : 'Send Quote'}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1.5 mb-3">
                            {items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-[0.84rem]">
                                <span className="text-foreground">{item.product_name} × {item.quantity}</span>
                                <span className="text-muted-foreground">
                                  {item.quoted_line_total != null ? formatCurrency(item.quoted_line_total) : 'Not priced'}
                                </span>
                              </div>
                            ))}
                          </div>

                          {quotation.admin_notes && (
                            <p className="text-[0.82rem] text-foreground mb-3">
                              <span className="font-semibold">Notes sent:</span> {quotation.admin_notes}
                            </p>
                          )}

                          {quotation.status === 'quoted' && (
                            <div className="flex items-center gap-2.5">
                              <Button
                                icon={Check}
                                className="px-4 py-2 text-[0.72rem]"
                                disabled={isSubmitting}
                                onClick={() => handleStatusChange(quotation, 'accepted')}
                              >
                                Mark Accepted
                              </Button>
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleStatusChange(quotation, 'declined')}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-[0.72rem] font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                              >
                                <X size={14} />
                                Mark Declined
                              </button>
                            </div>
                          )}
                        </>
                      )}
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

export default AdminQuotations;
