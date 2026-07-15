import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Typography } from '../ui/Typography';
import { RowSkeletonList } from '../ui/Skeleton';
import { fetchMyQuotations } from '../../lib/quotations';

const STATUS_STYLES = {
  requested: 'border-amber-300 bg-amber-50 text-amber-800',
  quoted: 'border-sky-300 bg-sky-50 text-sky-800',
  accepted: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  declined: 'border-red-300 bg-red-50 text-red-700',
};

const STATUS_LABELS = {
  requested: 'Awaiting Quote',
  quoted: 'Quoted',
  accepted: 'Accepted',
  declined: 'Declined',
};

const formatCurrency = (amount) => `LKR ${Number(amount).toLocaleString('en-LK')}`;

const formatDate = (isoString) =>
  new Date(isoString).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' });

const QuotationsSection = () => {
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetchMyQuotations()
      .then((data) => {
        if (isMounted) setQuotations(data);
      })
      .catch((fetchError) => {
        if (isMounted) setError(fetchError.message || 'Could not load your quote requests.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-[0.9rem] text-red-700">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return <RowSkeletonList count={3} />;
  }

  if (quotations.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-12 text-center text-muted-foreground flex flex-col items-center gap-3">
        <FileText size={26} className="text-text-tertiary" />
        <Typography variant="small">
          You haven't requested a quote yet — add products to your cart and choose
          "Request a Quote Instead" at checkout.
        </Typography>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quotations.map((quotation) => {
        const isExpanded = expandedId === quotation.id;
        const items = quotation.quotation_items || [];
        const isPriced = quotation.status !== 'requested';

        return (
          <div
            key={quotation.id}
            className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] shadow-[0_10px_24px_rgba(31,44,35,0.06)] overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : quotation.id)}
              className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5 text-left"
            >
              <div>
                <p className="text-[0.72rem] text-text-tertiary">{formatDate(quotation.created_at)}</p>
                <p className="text-[0.84rem] text-muted-foreground mt-0.5">
                  {items.length} item{items.length === 1 ? '' : 's'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.06em] ${STATUS_STYLES[quotation.status] || 'border-gray-300 bg-gray-50 text-gray-700'}`}>
                  {STATUS_LABELS[quotation.status] || quotation.status}
                </span>
                {isPriced && quotation.quoted_total != null && (
                  <p className="font-display text-[1.1rem] text-primary">{formatCurrency(quotation.quoted_total)}</p>
                )}
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-[var(--color-border-light)] px-4 py-4 sm:px-5 bg-white/50">
                <div className="space-y-1.5 mb-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-[0.84rem]">
                      <span className="text-foreground">{item.product_name} × {item.quantity}</span>
                      <span className="text-muted-foreground">
                        {item.quoted_line_total != null ? formatCurrency(item.quoted_line_total) : 'Not yet priced'}
                      </span>
                    </div>
                  ))}
                </div>

                {quotation.customer_notes && (
                  <p className="text-[0.78rem] text-muted-foreground mb-1.5">
                    Your notes: {quotation.customer_notes}
                  </p>
                )}

                {quotation.admin_notes && (
                  <p className="text-[0.78rem] text-foreground">
                    <span className="font-semibold">Note from our team:</span> {quotation.admin_notes}
                  </p>
                )}

                {quotation.status === 'requested' && (
                  <p className="text-[0.78rem] text-muted-foreground">
                    We're preparing pricing for this request — check back soon.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default QuotationsSection;
