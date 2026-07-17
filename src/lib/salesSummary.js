import { supabase } from './supabaseClient';

/**
 * Basic admin analytics (functional-requirements.md §3.5) — plain aggregate
 * numbers computed client-side from the existing `orders`/`order_items`
 * tables, no new schema. Revenue figures exclude cancelled orders (they
 * never completed, so counting them as revenue would overstate things);
 * order counts are total orders placed regardless of status, since that
 * answers a different question ("how many orders came in").
 *
 * Deliberately NOT named analytics.js — ad blockers / privacy extensions
 * (uBlock Origin, Brave Shields, etc.) block any request for a file literally
 * named "analytics.js" on filter-list heuristics alone, regardless of who
 * owns it. In Vite's dev server this file is requested by its real source
 * path, so the old filename made the whole admin analytics page silently
 * fail to load data for anyone running an ad blocker (net::ERR_BLOCKED_BY_CLIENT).
 *
 * Small enough data volume for a thesis-scale store that pulling summary
 * columns and aggregating in JS is simpler and more portable than relying
 * on PostgREST's aggregate-function support (which needs a server-side
 * config flag we can't assume is on) — an upgrade path to a Postgres view
 * is straightforward later if order volume grows.
 */
export async function fetchSalesSummary() {
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, grand_total, status, created_at');

  if (ordersError) {
    throw ordersError;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const allOrders = orders || [];
  const revenueOrders = allOrders.filter((order) => order.status !== 'cancelled');
  const revenueOrderIds = new Set(revenueOrders.map((order) => order.id));

  const revenueAllTime = revenueOrders.reduce((sum, order) => sum + Number(order.grand_total), 0);
  const revenueThisMonth = revenueOrders
    .filter((order) => new Date(order.created_at) >= startOfMonth)
    .reduce((sum, order) => sum + Number(order.grand_total), 0);

  const orderCountAllTime = allOrders.length;
  const orderCountThisMonth = allOrders.filter((order) => new Date(order.created_at) >= startOfMonth).length;

  let topProducts = [];
  if (revenueOrderIds.size > 0) {
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, product_name, quantity, line_total, order_id')
      .in('order_id', Array.from(revenueOrderIds));

    if (itemsError) {
      throw itemsError;
    }

    const byProduct = new Map();
    (items || []).forEach((item) => {
      const key = item.product_id || item.product_name;
      const existing = byProduct.get(key) || {
        productId: item.product_id,
        productName: item.product_name,
        totalQuantity: 0,
        totalRevenue: 0,
      };
      existing.totalQuantity += item.quantity;
      existing.totalRevenue += Number(item.line_total);
      byProduct.set(key, existing);
    });

    topProducts = Array.from(byProduct.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);
  }

  return {
    revenueAllTime,
    revenueThisMonth,
    orderCountAllTime,
    orderCountThisMonth,
    topProducts,
  };
}
