import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, PackageSearch, RefreshCw } from 'lucide-react';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { RowSkeletonList } from '../../components/ui/Skeleton';
import { supabase } from '../../lib/supabaseClient';
import { BRANDS, BRAND_BY_VALUE } from '../../lib/brands';

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const STATUS_STYLES = {
  pending: 'border-amber-300 bg-amber-50 text-amber-800',
  confirmed: 'border-sky-300 bg-sky-50 text-sky-800',
  shipped: 'border-indigo-300 bg-indigo-50 text-indigo-800',
  delivered: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  cancelled: 'border-red-300 bg-red-50 text-red-700',
};

const formatCurrency = (amount) => `LKR ${Number(amount).toLocaleString('en-LK')}`;

const formatDate = (isoString) =>
  new Date(isoString).toLocaleString('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const loadOrders = () => {
    setIsLoading(true);
    setError(null);

    return supabase
      .from('orders')
      .select('*, order_items(id, product_name, quantity, unit_price, line_total)')
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message || 'Could not load orders.');
          return;
        }
        setOrders(data || []);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (channelFilter !== 'all' && order.channel !== channelFilter) return false;
      if (brandFilter !== 'all' && order.brand !== brandFilter) return false;
      return true;
    });
  }, [orders, statusFilter, channelFilter, brandFilter]);

  const statusCounts = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      },
      { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 }
    );
  }, [orders]);

  const channelCounts = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc[order.channel] = (acc[order.channel] || 0) + 1;
        return acc;
      },
      { retail: 0, b2b: 0 }
    );
  }, [orders]);

  const brandCounts = useMemo(() => {
    return orders.reduce((acc, order) => {
      acc[order.brand] = (acc[order.brand] || 0) + 1;
      return acc;
    }, {});
  }, [orders]);

  const handleStatusChange = async (orderId, nextStatus) => {
    setUpdatingOrderId(orderId);
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', orderId);

    if (!updateError) {
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order))
      );
    }
    setUpdatingOrderId(null);
  };

  return (
    <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-6 sm:mb-8 rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(120deg,rgba(255,251,242,0.95),rgba(247,241,227,0.86))] px-5 py-6 sm:px-7 sm:py-8 shadow-[0_20px_42px_rgba(31,44,35,0.08)]">
          <Typography variant="label" className="mb-3 block">Admin Dashboard</Typography>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Typography variant="h2" className="text-foreground text-balance">
              Order Administration
            </Typography>
            <Button variant="ghost" className="px-3 py-2 text-[0.72rem]" onClick={loadOrders} icon={RefreshCw}>
              Refresh
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase transition-colors ${statusFilter === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
            >
              All ({orders.length})
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

          <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
            <span className="text-[0.68rem] font-semibold tracking-[0.08em] uppercase text-text-tertiary">Channel:</span>
            {['all', 'retail', 'b2b'].map((channel) => (
              <button
                key={channel}
                type="button"
                onClick={() => setChannelFilter(channel)}
                className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase transition-colors ${channelFilter === channel ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
              >
                {channel === 'all' ? `All (${orders.length})` : channel === 'b2b' ? `B2B (${channelCounts.b2b || 0})` : `Retail (${channelCounts.retail || 0})`}
              </button>
            ))}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
            <span className="text-[0.68rem] font-semibold tracking-[0.08em] uppercase text-text-tertiary">Storefront:</span>
            <button
              type="button"
              onClick={() => setBrandFilter('all')}
              className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase transition-colors ${brandFilter === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
            >
              All ({orders.length})
            </button>
            {BRANDS.map(({ brand, label }) => (
              <button
                key={brand}
                type="button"
                onClick={() => setBrandFilter(brand)}
                className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase transition-colors ${brandFilter === brand ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
              >
                {label} ({brandCounts[brand] || 0})
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-[0.95rem] text-red-700">
            {error}
          </div>
        ) : isLoading ? (
          <RowSkeletonList count={4} />
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <PackageSearch size={28} className="text-text-tertiary" />
            <Typography variant="small">No orders match this filter yet.</Typography>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
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
                    <div className="flex-1 min-w-[220px]">
                      <p className="text-[0.9rem] font-semibold text-foreground">{order.customer_name}</p>
                      <p className="text-[0.76rem] text-muted-foreground">
                        {order.customer_email} · {order.customer_phone}
                      </p>
                      <p className="text-[0.72rem] text-text-tertiary mt-0.5">{formatDate(order.created_at)}</p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {order.brand && (
                        <span className="rounded-full border border-[var(--color-border-medium)] bg-white/70 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-text-secondary">
                          {BRAND_BY_VALUE[order.brand]?.label || order.brand}
                        </span>
                      )}
                      {order.channel === 'b2b' && (
                        <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-primary">
                          B2B
                        </span>
                      )}
                      <span className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.06em] ${STATUS_STYLES[order.status] || 'border-gray-300 bg-gray-50 text-gray-700'}`}>
                        {order.status}
                      </span>
                      <p className="font-display text-[1.15rem] text-primary">{formatCurrency(order.grand_total)}</p>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[var(--color-border-light)] px-4 py-4 sm:px-5 bg-white/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1.5">Items</p>
                          <div className="space-y-1.5">
                            {(order.order_items || []).map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-[0.84rem]">
                                <span className="text-foreground">{item.product_name} × {item.quantity}</span>
                                <span className="text-muted-foreground">{formatCurrency(item.line_total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1.5">Delivery</p>
                          <p className="text-[0.84rem] text-foreground">{order.delivery_address}</p>
                          <p className="text-[0.78rem] text-muted-foreground">
                            {order.delivery_zone === 'colombo_1_15' ? 'Colombo 1-15' : 'Other Areas'} · {order.payment_method === 'cash_on_delivery' ? 'Cash on Delivery' : 'Online Payment'}
                          </p>
                          {order.notes && (
                            <p className="mt-1.5 text-[0.78rem] italic text-muted-foreground">Note: {order.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2.5">
                        <span className="text-[0.76rem] font-semibold text-text-secondary">Update status:</span>
                        <select
                          value={order.status}
                          disabled={updatingOrderId === order.id}
                          onChange={(event) => handleStatusChange(order.id, event.target.value)}
                          className="rounded-lg border border-[var(--color-border-medium)] bg-white/90 px-3 py-1.5 text-[0.82rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
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

export default AdminOrders;
