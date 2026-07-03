import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClasses = "w-full rounded-lg border border-[var(--color-border-medium)] bg-white/80 px-3 py-2.5 text-[0.9rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setErrors({ form: error.message || 'Could not sign in. Please check your details and try again.' });
      return;
    }

    navigate('/account', { state: { justSignedIn: true } });
  };

  return (
    <AuthLayout
      eyebrow="Welcome Back"
      title="Sign In To Your Account"
      subtitle="Enter your details to continue to Miracle Natural."
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {errors.form && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[0.85rem] text-red-700">
            {errors.form}
          </div>
        )}

        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-[0.78rem] font-semibold tracking-[0.04em] text-text-secondary">
            Email Address
          </label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClasses} pl-9`}
            />
          </div>
          {errors.email && <p className="mt-1 text-[0.78rem] text-red-600">{errors.email}</p>}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="login-password" className="block text-[0.78rem] font-semibold tracking-[0.04em] text-text-secondary">
              Password
            </label>
            <a
              href="mailto:dinisha@lanmic.com?subject=Password%20Reset%20Request"
              className="text-[0.75rem] font-semibold text-primary hover:underline"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      <p className="mt-6 text-center text-[0.88rem] text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-semibold text-primary hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
