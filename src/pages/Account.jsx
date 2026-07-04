import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
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

const primaryLinkClasses = "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-primary bg-primary text-white text-[0.76rem] font-semibold tracking-[0.1em] uppercase hover:bg-forest-800 transition-colors";
const ghostButtonClasses = "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--color-border-medium)] text-foreground text-[0.76rem] font-semibold tracking-[0.1em] uppercase hover:bg-[var(--color-hover-overlay)] transition-colors";
const ghostLinkClasses = "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--color-border-medium)] text-foreground text-[0.76rem] font-semibold tracking-[0.1em] uppercase hover:bg-[var(--color-hover-overlay)] transition-colors";

const TABS = [
  { id: 'details', label: 'Account Details', icon: Settings, Component: AccountDetailsSection },
  { id: 'orders', label: 'Orders', icon: ShoppingBag, Component: OrdersSection },
  { id: 'addresses', label: 'Addresses', icon: MapPin, Component: AddressesSection },
  { id: 'wishlist', label: 'Wishlist', icon: Heart, Component: WishlistSection },
  { id: 'contact', label: 'Contact Us', icon: Mail, Component: ContactSection },
];

const Account = () => {
  const location = useLocation();
  const { user, loading, profile, signOut } = useAuth();
  const { needsEmailConfirmation } = location.state || {};
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTabId = TABS.some((tab) => tab.id === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'details';
  const ActiveComponent = TABS.find((tab) => tab.id === activeTabId)?.Component || AccountDetailsSection;

  if (loading) {
    return (
      <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center">
        <Typography variant="small">Loading your account...</Typography>
      </div>
    );
  }

  // Signed out (or awaiting email confirmation): keep the original compact
  // centered card rather than showing an empty tabbed profile.
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

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSearchParams({ tab: tab.id })}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[0.72rem] font-semibold tracking-[0.06em] uppercase transition-colors ${isActive ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-light)] bg-white/70 text-text-secondary'}`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <ActiveComponent />
      </div>
    </div>
  );
};

export default Account;
