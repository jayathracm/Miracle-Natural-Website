import React, { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  LogOut,
  Mail,
  MapPin,
  Settings,
  ShoppingBag,
  User,
  Heart,
} from 'lucide-react';
import { Typography } from '../components/ui/Typography';
import { useAuth } from '../context/AuthContext';
import AccountDetailsSection from '../components/account/AccountDetailsSection';
import OrdersSection from '../components/account/OrdersSection';
import AddressesSection from '../components/account/AddressesSection';
import WishlistSection from '../components/account/WishlistSection';
import ContactSection from '../components/account/ContactSection';
import { fetchMyOrders } from '../lib/orders';
import { fetchAddresses } from '../lib/addresses';
import { fetchWishlistProductIds } from '../lib/wishlist';
import { fetchMyMessages } from '../lib/messages';

const primaryLinkClasses = "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-primary bg-primary text-white text-[0.76rem] font-semibold tracking-[0.1em] uppercase hover:bg-forest-800 transition-colors";
const ghostButtonClasses = "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--color-border-medium)] text-foreground text-[0.76rem] font-semibold tracking-[0.1em] uppercase hover:bg-[var(--color-hover-overlay)] transition-colors";
const ghostLinkClasses = "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--color-border-medium)] text-foreground text-[0.76rem] font-semibold tracking-[0.1em] uppercase hover:bg-[var(--color-hover-overlay)] transition-colors";

// Amazon-style "hub" pattern: the account page opens on a grid of feature
// cards rather than dropping straight into a form. Each card carries a live
// count where it makes sense (orders placed, addresses saved, etc.) so the
// hub itself is useful at a glance, not just a menu.
const HUB_ITEMS = [
  {
    id: 'details',
    label: 'Account Details',
    desc: 'Edit your name, phone number, email, and password.',
    icon: Settings,
    tone: 'primary',
    Component: AccountDetailsSection,
  },
  {
    id: 'orders',
    label: 'Orders',
    desc: 'Track past orders and see what you bought and when.',
    icon: ShoppingBag,
    tone: 'accent',
    countKey: 'orders',
    Component: OrdersSection,
  },
  {
    id: 'addresses',
    label: 'Addresses',
    desc: 'Manage saved delivery addresses for faster checkout.',
    icon: MapPin,
    tone: 'primary',
    countKey: 'addresses',
    Component: AddressesSection,
  },
  {
    id: 'wishlist',
    label: 'Wishlist',
    desc: 'Products you have saved to shop later.',
    icon: Heart,
    tone: 'accent',
    countKey: 'wishlist',
    Component: WishlistSection,
  },
  {
    id: 'contact',
    label: 'Contact Us',
    desc: 'Send a message to our team and track replies.',
    icon: Mail,
    tone: 'primary',
    countKey: 'messages',
    Component: ContactSection,
  },
];

const TONE_STYLES = {
  primary: 'bg-primary/12 text-primary border-primary/20',
  accent: 'bg-accent/12 text-accent border-accent/20',
};

const Account = () => {
  const location = useLocation();
  const { user, loading, profile, signOut } = useAuth();
  const { needsEmailConfirmation } = location.state || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const [counts, setCounts] = useState({});

  const activeItem = HUB_ITEMS.find((item) => item.id === searchParams.get('tab')) || null;

  // Lightweight counts for the hub cards — only fetched on the overview
  // (each section already loads its own full data once it's opened).
  useEffect(() => {
    if (activeItem || !user) return undefined;
    let isMounted = true;

    Promise.allSettled([
      fetchMyOrders(),
      fetchAddresses(),
      fetchWishlistProductIds(),
      fetchMyMessages(),
    ]).then(([orders, addresses, wishlist, messages]) => {
      if (!isMounted) return;
      setCounts({
        orders: orders.status === 'fulfilled' ? orders.value.length : null,
        addresses: addresses.status === 'fulfilled' ? addresses.value.length : null,
        wishlist: wishlist.status === 'fulfilled' ? wishlist.value.length : null,
        messages: messages.status === 'fulfilled' ? messages.value.length : null,
      });
    });

    return () => {
      isMounted = false;
    };
  }, [activeItem, user]);

  if (loading) {
    return (
      <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center">
        <Typography variant="small">Loading your account...</Typography>
      </div>
    );
  }

  // Signed out (or awaiting email confirmation): keep the original compact
  // centered card rather than showing an empty hub.
  if (!user) {
    return (
      <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-lg mx-auto">
          <div className="rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(160deg,rgba(255,253,248,0.98),rgba(248,243,232,0.94))] p-6 sm:p-8 shadow-[0_20px_42px_rgba(31,44,35,0.1)] text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/12 border border-primary/25 inline-flex items-center justify-center">
              <User size={32} className="text-primary" />
            </div>

            <Typography variant="label" className="mb-2 block">My Account</Typography>
            <Typography variant="h3" className="mb-2 text-foreground">Welcome!</Typography>

            {needsEmailConfirmation ? (
              <Typography variant="small" className="block mb-6">
                Almost there — we sent a confirmation link to your email. Please confirm your address, then sign in.
              </Typography>
            ) : (
              <Typography variant="small" className="block mb-6">
                Sign in or create an account to see your details here.
              </Typography>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              <Link to="/shop" className={`${primaryLinkClasses} w-full sm:w-auto`}>
                <ShoppingBag size={16} />
                Continue Shopping
              </Link>
              <Link to="/login" className={`${ghostLinkClasses} w-full sm:w-auto`}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || user.email;
  const ActiveIcon = activeItem?.icon;
  const ActiveComponent = activeItem?.Component;

  return (
    <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-[1000px] mx-auto">
        <div className="mb-6 sm:mb-8 rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(120deg,rgba(255,251,242,0.95),rgba(247,241,227,0.86))] px-5 py-6 sm:px-7 sm:py-8 shadow-[0_20px_42px_rgba(31,44,35,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/12 border border-primary/25 inline-flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} className="text-primary" />
              </div>
              <div>
                <Typography variant="label" className="mb-1 block">My Account</Typography>
                <Typography variant="h3" className="text-foreground">Welcome, {displayName}!</Typography>
              </div>
            </div>
            <button type="button" onClick={signOut} className={ghostButtonClasses}>
              <LogOut size={16} />
              Sign Out
            </button>
          </div>

          {activeItem && (
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="mt-5 inline-flex items-center gap-1.5 text-[0.76rem] font-semibold uppercase tracking-[0.08em] text-primary hover:underline underline-offset-2"
            >
              <ArrowLeft size={14} />
              Back to Account
            </button>
          )}
        </div>

        {!activeItem ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {HUB_ITEMS.map((item) => {
              const Icon = item.icon;
              const count = item.countKey ? counts[item.countKey] : null;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSearchParams({ tab: item.id })}
                  className="group text-left rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 shadow-[0_10px_24px_rgba(31,44,35,0.06)] hover:bg-[var(--color-card-bg-hover)] hover:border-[var(--color-card-border-hover)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className={`h-11 w-11 rounded-xl border inline-flex items-center justify-center shrink-0 ${TONE_STYLES[item.tone]}`}>
                      <Icon size={20} />
                    </div>
                    {typeof count === 'number' && (
                      <span className="rounded-full border border-[var(--color-border-light)] bg-white/70 px-2.5 py-1 text-[0.68rem] font-semibold text-text-secondary">
                        {count}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Typography variant="h4" className="text-foreground text-[0.98rem]">{item.label}</Typography>
                    <ChevronRight size={15} className="text-text-tertiary transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="text-[0.82rem] leading-relaxed text-muted-foreground">{item.desc}</p>
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <div className={`h-9 w-9 rounded-lg border inline-flex items-center justify-center shrink-0 ${TONE_STYLES[activeItem.tone]}`}>
                <ActiveIcon size={16} />
              </div>
              <Typography variant="h3" className="text-foreground text-[1.3rem]">{activeItem.label}</Typography>
            </div>
            <ActiveComponent />
          </div>
        )}
      </div>
    </div>
  );
};

export default Account;
