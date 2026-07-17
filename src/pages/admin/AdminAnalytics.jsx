import React, { useEffect, useState } from 'react';
import { BarChart3, RefreshCw, ShoppingBag, TrendingUp } from 'lucide-react';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { fetchSalesSummary } from '../../lib/salesSummary';

const formatCurrency = (amount) => `LKR ${Number(amount).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;

const StatCard = ({ icon: Icon, label, value, hint }) => (
  <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 shadow-[0_10px_24px_rgba(31,44,35,0.06)]">
    <div className="flex items-center gap-2 mb-2">
      <div className="h-8 w-8 rounded-lg bg-primary/12 border border-primary/25 inline-flex items-center justify-center shrink-0">
        <Icon size={15} className="text-primary" />
      </div>
      <span className="text-[0.68rem] font-bold tracking-[0.1em] uppercase text-text-secondary">{label}</span>
    </div>
    <p className="font-display text-[1.5rem] text-foreground">{value}</p>
    {hint && <p className="mt-1 text-[0.7rem] text-muted-foreground">{hint}</p>}
  </div>
);

const StatCardSkeleton = () => (
  <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5">
    <Skeleton className="h-3 w-24 mb-3" />
    <Skeleton className="h-7 w-32" />
  </div>
);

const AdminAnalytics = () => {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSummary = () => {
    setIsLoading(true);
    setError(null);
    return fetchSalesSummary()
      .then(setSummary)
      .catch((fetchError) => setError(fetchError.message || 'Could not load analytics.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-[1000px] mx-auto">
        <div className="mb-6 sm:mb-8 rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(120deg,rgba(255,251,242,0.95),rgba(247,241,227,0.86))] px-5 py-6 sm:px-7 sm:py-8 shadow-[0_20px_42px_rgba(31,44,35,0.08)]">
          <Typography variant="label" className="mb-3 block">Admin Dashboard</Typography>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Typography variant="h2" className="text-foreground text-balance">
              Analytics
            </Typography>
            <Button variant="ghost" className="px-3 py-2 text-[0.72rem]" onClick={loadSummary} icon={RefreshCw}>
              Refresh
            </Button>
          </div>
          <p className="mt-3 text-[0.82rem] text-muted-foreground max-w-prose">
            Revenue figures exclude cancelled orders. Order counts include every order placed,
            regardless of status.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-[0.95rem] text-red-700">
            {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {isLoading ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  <StatCard
                    icon={TrendingUp}
                    label="Revenue (All-Time)"
                    value={formatCurrency(summary.revenueAllTime)}
                  />
                  <StatCard
                    icon={TrendingUp}
                    label="Revenue (This Month)"
                    value={formatCurrency(summary.revenueThisMonth)}
                  />
                  <StatCard
                    icon={ShoppingBag}
                    label="Orders (All-Time)"
                    value={summary.orderCountAllTime}
                  />
                  <StatCard
                    icon={ShoppingBag}
                    label="Orders (This Month)"
                    value={summary.orderCountThisMonth}
                  />
                </>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-primary" />
              <Typography variant="h3" className="text-foreground text-[1.15rem]">
                Top 5 Products by Revenue
              </Typography>
            </div>

            {isLoading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : summary.topProducts.length === 0 ? (
              <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-16 text-center text-muted-foreground">
                No completed orders yet.
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] shadow-[0_10px_24px_rgba(31,44,35,0.06)] overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--color-card-border)]">
                      <th className="px-4 py-3 text-[0.68rem] font-bold tracking-[0.08em] uppercase text-text-secondary">Rank</th>
                      <th className="px-4 py-3 text-[0.68rem] font-bold tracking-[0.08em] uppercase text-text-secondary">Product</th>
                      <th className="px-4 py-3 text-[0.68rem] font-bold tracking-[0.08em] uppercase text-text-secondary text-right">Units Sold</th>
                      <th className="px-4 py-3 text-[0.68rem] font-bold tracking-[0.08em] uppercase text-text-secondary text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.topProducts.map((product, index) => (
                      <tr key={product.productId || product.productName} className={index !== summary.topProducts.length - 1 ? 'border-b border-[var(--color-card-border)]' : ''}>
                        <td className="px-4 py-3 text-[0.82rem] text-text-tertiary">#{index + 1}</td>
                        <td className="px-4 py-3 text-[0.85rem] font-semibold text-foreground">{product.productName}</td>
                        <td className="px-4 py-3 text-[0.85rem] text-foreground text-right">{product.totalQuantity}</td>
                        <td className="px-4 py-3 text-[0.85rem] font-semibold text-primary text-right">{formatCurrency(product.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
