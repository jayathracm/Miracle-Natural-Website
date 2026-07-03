import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, LogOut, ShoppingBag, User } from 'lucide-react';
import { Typography } from '../components/ui/Typography';
import { useAuth } from '../context/AuthContext';

const primaryLinkClasses = "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-primary bg-primary text-white text-[0.76rem] font-semibold tracking-[0.1em] uppercase hover:bg-forest-800 transition-colors";
const ghostLinkClasses = "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--color-border-medium)] text-foreground text-[0.76rem] font-semibold tracking-[0.1em] uppercase hover:bg-[var(--color-hover-overlay)] transition-colors";
const ghostButtonClasses = "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--color-border-medium)] text-foreground text-[0.76rem] font-semibold tracking-[0.1em] uppercase hover:bg-[var(--color-hover-overlay)] transition-colors";

const Account = () => {
  const location = useLocation();
  const { user, loading, signOut } = useAuth();
  const { needsEmailConfirmation } = location.state || {};

  const displayName = user?.user_metadata?.full_name;

  if (loading) {
    return (
      <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center">
        <Typography variant="small">Loading your account...</Typography>
      </div>
    );
  }

  return (
    <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(160deg,rgba(255,253,248,0.98),rgba(248,243,232,0.94))] p-6 sm:p-8 shadow-[0_20px_42px_rgba(31,44,35,0.1)] text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/12 border border-primary/25 inline-flex items-center justify-center">
            {user ? (
              <CheckCircle2 size={32} className="text-primary" />
            ) : (
              <User size={32} className="text-primary" />
            )}
          </div>

          <Typography variant="label" className="mb-2 block">My Account</Typography>
          <Typography variant="h3" className="mb-2 text-foreground">
            {user ? `Welcome, ${displayName || user.email}!` : 'Welcome!'}
          </Typography>

          {needsEmailConfirmation ? (
            <Typography variant="small" className="block mb-6">
              Almost there — we sent a confirmation link to your email. Please confirm your address, then sign in.
            </Typography>
          ) : user ? (
            <Typography variant="small" className="block mb-6">
              Signed in as {user.email}. Order history and account settings are coming soon.
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
            {user ? (
              <button type="button" onClick={signOut} className={`${ghostButtonClasses} w-full sm:w-auto`}>
                <LogOut size={16} />
                Sign Out
              </button>
            ) : (
              <Link to="/login" className={`${ghostLinkClasses} w-full sm:w-auto`}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
