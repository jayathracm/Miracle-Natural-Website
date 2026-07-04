import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, PackageSearch } from 'lucide-react';
import { Typography } from '../ui/Typography';
import { RowSkeletonList } from '../ui/Skeleton';
import { fetchMyOrders } from '../../lib/orders';

const STATUS_STYLES = {
  pending: 'border-amber-300 bg-amber-50 text-amber-800',
  confirmed: 'border-sky-300 bg-sky-50 text-sky-800',
  shipped: 'border-indigo-300 bg-indigo-50 text-indigo-800',
  delivered: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  cancelled: 'border-red-300 bg-red-50 text-red-700',
};

const formatCurrency = (amount) => `LKR ${Number(amount).toLocaleString('en-LK')}`;

const formatDate = (isoString) =>
  new Date(isoString).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' });

const OrdersSection = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetchMyOrders()
      .then((data) => {
        if (isMounted) setOrders(data);
      })
      .catch((fetchError) => {
        if (isMounted) setError(fetchError.message || 'Could not load your orders.');
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

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-12 text-center text-muted-foreground flex flex-col items-center gap-3">
        <PackageSearch size={26} className="text-text-tertiary" />
        <Typography variant="small">You haven't placed any orders yet.</Typography>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const isExpanded = expandedOrderId === order.id;

        return (
          <div
            key={order.id}
            className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] shadow-[0_10px_24px_rgba(31,44,35,0.06)] overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
              className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5 text-left"
            >
              <div>
                <p className="text-[0.72rem] text-text-tertiary">{formatDate(order.created_at)}</p>
                <p className="text-[0.84rem] text-muted-foreground mt-0.5">
                  {(order.order_items || []).length} item{(order.order_items || []).length === 1 ? '' : 's'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.06em] ${STATUS_STYLES[order.status] || 'border-gray-300 bg-gray-50 text-gray-700'}`}>
                  {order.status}
                </span>
                <p className="font-display text-[1.1rem] text-primary">{formatCurrency(order.grand_total)}</p>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-[var(--color-border-light)] px-4 py-4 sm:px-5 bg-white/50">
                <div className="space-y-1.5 mb-3">
                  {(order.order_items || []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-[0.84rem]">
                      <span className="text-foreground">{item.product_name} × {item.quantity}</span>
                      <span className="text-muted-foreground">{formatCurrency(item.line_total)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[0.78rem] text-muted-foreground">
                  Delivered to: {order.delivery_address}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OrdersSection;
