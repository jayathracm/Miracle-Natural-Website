import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Eye, EyeOff, Lock, Mail, MapPin, Phone, User } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DELIVERY_ZONES = {
  colombo_1_15: 'Colombo 1-15',
  island_wide: 'Other Areas in Sri Lanka',
};

const inputClasses = "w-full rounded-lg border border-[var(--color-border-medium)] bg-white/80 px-3 py-2.5 text-[0.9rem] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

const Signup = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAddressSection, setShowAddressSection] = useState(false);
  const [deliveryZone, setDeliveryZone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = 'Please enter your full name.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!phone.trim()) {
      nextErrors.phone = 'Phone number is required.';
    } else if (phone.replace(/[^0-9]/g, '').length < 7) {
      nextErrors.phone = 'Enter a valid phone number.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    // Address section is optional/skippable, but if the user has started
    // filling it in, make sure both fields are completed together.
    if (showAddressSection && (deliveryZone || deliveryAddress.trim())) {
      if (!deliveryZone) {
        nextErrors.deliveryZone = 'Select a delivery zone.';
      }
      if (!deliveryAddress.trim()) {
        nextErrors.deliveryAddress = 'Enter your delivery address.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          default_delivery_zone: showAddressSection && deliveryZone ? deliveryZone : null,
          default_delivery_address: showAddressSection && deliveryAddress.trim() ? deliveryAddress.trim() : null,
        },
      },
    });

    setIsSubmitting(false);

    if (error) {
      setErrors({ form: error.message || 'Could not create your account. Please try again.' });
      return;
    }

    // If email confirmation is required by your Supabase project settings,
    // signUp succeeds but no active session is returned yet.
    const needsEmailConfirmation = !data.session;

    navigate('/account', {
      state: {
        name: fullName.trim(),
        justSignedUp: true,
        needsEmailConfirmation,
      },
    });
  };

  return (
    <AuthLayout
      eyebrow="Join Miracle Natural"
      title="Create Your Account"
      subtitle="Sign up to track orders and check out faster."
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {errors.form && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[0.85rem] text-red-700">
            {errors.form}
          </div>
        )}

        <div>
          <label htmlFor="signup-name" className="mb-1.5 block text-[0.78rem] font-semibold tracking-[0.04em] text-text-secondary">
            Full Name
          </label>
          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`${inputClasses} pl-9`}
            />
          </div>
          {errors.fullName && <p className="mt-1 text-[0.78rem] text-red-600">{errors.fullName}</p>}
        </div>

        <div>
          <label htmlFor="signup-email" className="mb-1.5 block text-[0.78rem] font-semibold tracking-[0.04em] text-text-secondary">
            Email Address
          </label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="signup-email"
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
          <label htmlFor="signup-phone" className="mb-1.5 block text-[0.78rem] font-semibold tracking-[0.04em] text-text-secondary">
            Phone Number
          </label>
          <div className="relative">
            <Phone size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="signup-phone"
              type="tel"
              autoComplete="tel"
              placeholder="07XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`${inputClasses} pl-9`}
            />
          </div>
          {errors.phone && <p className="mt-1 text-[0.78rem] text-red-600">{errors.phone}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="signup-password" className="mb-1.5 block text-[0.78rem] font-semibold tracking-[0.04em] text-text-secondary">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 6 characters"
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
            <label htmlFor="signup-confirm-password" className="mb-1.5 block text-[0.78rem] font-semibold tracking-[0.04em] text-text-secondary">
              Confirm Password
            </label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="signup-confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`${inputClasses} pl-9`}
              />
            </div>
            {errors.confirmPassword && <p className="mt-1 text-[0.78rem] text-red-600">{errors.confirmPassword}</p>}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border-light)] bg-white/60 p-3">
          <button
            type="button"
            onClick={() => setShowAddressSection((prev) => !prev)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-[0.85rem] font-semibold text-foreground">
              Add delivery address <span className="font-normal text-muted-foreground">(optional, you can skip this)</span>
            </span>
            <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-200 ${showAddressSection ? 'rotate-180' : ''}`} />
          </button>

          {showAddressSection && (
            <div className="mt-3 space-y-3">
              <select
                value={deliveryZone}
                onChange={(e) => setDeliveryZone(e.target.value)}
                className={inputClasses}
              >
                <option value="">Select Delivery Zone</option>
                {Object.entries(DELIVERY_ZONES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.deliveryZone && <p className="text-[0.78rem] text-red-600">{errors.deliveryZone}</p>}

              <div className="relative">
                <MapPin size={16} className="pointer-events-none absolute left-3 top-3 text-muted-foreground" />
                <textarea
                  placeholder="Delivery Address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={3}
                  className={`${inputClasses} pl-9 resize-none`}
                />
              </div>
              {errors.deliveryAddress && <p className="text-[0.78rem] text-red-600">{errors.deliveryAddress}</p>}
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-[0.88rem] text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Signup;
