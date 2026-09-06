import React, { useState } from 'react';
import { Link } from 'react-router';
import { Mail } from 'lucide-react';
import AuthLayout from '@/features/auth/AuthLayout';
import { Button } from '@/shared/ui/Button';
import { supabase } from '@/shared/lib/supabaseClient';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClasses = "w-full rounded-lg border border-[var(--color-border-medium)] bg-white/80 px-3 py-2.5 text-[0.9rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsSubmitting(false);

    // Supabase deliberately never reveals whether an account exists for this
    // email (same anti-enumeration behavior as signup) — it returns success
    // either way, and simply skips sending if there's no match. So we always
    // show the same generic confirmation, rather than a real/fake distinction.
    if (resetError) {
      setError(resetError.message || 'Could not send the reset email. Please try again.');
      return;
    }

    setIsSent(true);
  };

  if (isSent) {
    return (
      <AuthLayout
        eyebrow="Check Your Email"
        title="Reset Link Sent"
        subtitle="If an account exists for that email, we've sent a link to reset your password."
      >
        <p className="text-center text-[0.88rem] text-muted-foreground">
          Didn&apos;t get it? Check your spam folder, or{' '}
          <button
            type="button"
            onClick={() => setIsSent(false)}
            className="font-semibold text-primary hover:underline"
          >
            try again
          </button>
          .
        </p>

        <p className="mt-6 text-center text-[0.88rem] text-muted-foreground">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Forgot Password"
      title="Reset Your Password"
      subtitle="Enter your email and we'll send you a link to reset it."
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[0.85rem] text-red-700">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="forgot-email" className="mb-1.5 block text-[0.78rem] font-semibold tracking-[0.04em] text-text-secondary">
            Email Address
          </label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClasses} pl-9`}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      <p className="mt-6 text-center text-[0.88rem] text-muted-foreground">
        Remembered your password?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;
