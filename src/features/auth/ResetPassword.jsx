import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, Lock } from 'lucide-react';
import AuthLayout from '@/features/auth/AuthLayout';
import { Button } from '@/shared/ui/Button';
import { supabase } from '@/shared/lib/supabaseClient';
import { useAuth } from '@/features/auth/AuthContext';

const inputClasses = "w-full rounded-lg border border-[var(--color-border-medium)] bg-white/80 px-3 py-2.5 text-[0.9rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const validate = () => {
    const nextErrors = {};

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({ password });

    setIsSubmitting(false);

    if (error) {
      setErrors({ form: error.message || 'Could not update your password. Please try again.' });
      return;
    }

    setIsDone(true);
  };

  // The reset link exchanges its token for a session as soon as the page
  // loads (handled by the Supabase client, surfaced here via AuthContext),
  // so this is the same "loading" flag used everywhere else in the app.
  if (loading) {
    return (
      <AuthLayout eyebrow="Reset Password" title="Checking Your Link" subtitle="One moment...">
        <p className="text-center text-[0.88rem] text-muted-foreground">Verifying your reset link.</p>
      </AuthLayout>
    );
  }

  if (!session) {
    return (
      <AuthLayout
        eyebrow="Reset Password"
        title="Link Invalid or Expired"
        subtitle="This password reset link no longer works."
      >
        <p className="text-center text-[0.88rem] text-muted-foreground">
          Reset links expire after a while and can only be used once.{' '}
          <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
            Request a new one
          </Link>
          .
        </p>
      </AuthLayout>
    );
  }

  if (isDone) {
    return (
      <AuthLayout
        eyebrow="Reset Password"
        title="Password Updated"
        subtitle="Your password has been changed successfully."
      >
        <Button className="w-full" onClick={() => navigate('/account')}>
          Continue to My Account
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Reset Password"
      title="Choose a New Password"
      subtitle="Enter and confirm your new password below."
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {errors.form && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[0.85rem] text-red-700">
            {errors.form}
          </div>
        )}

        <div>
          <label htmlFor="reset-password" className="mb-1.5 block text-[0.78rem] font-semibold tracking-[0.04em] text-text-secondary">
            New Password
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Enter a new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClasses} pl-9 pr-9`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-[0.78rem] text-red-600">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="reset-confirm-password" className="mb-1.5 block text-[0.78rem] font-semibold tracking-[0.04em] text-text-secondary">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="reset-confirm-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`${inputClasses} pl-9`}
            />
          </div>
          {errors.confirmPassword && <p className="mt-1 text-[0.78rem] text-red-600">{errors.confirmPassword}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update Password'}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
