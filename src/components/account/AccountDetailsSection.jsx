import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const cardClasses = "rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 sm:p-6 shadow-[0_10px_24px_rgba(31,44,35,0.06)]";

const StatusMessage = ({ status }) => {
  if (!status) return null;
  return (
    <p className={`mt-3 text-[0.82rem] ${status.type === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>
      {status.text}
    </p>
  );
};

// Account details, email, and password are three independent forms/requests
// on purpose — updating name/phone (profiles table), changing email
// (Supabase Auth, triggers a confirmation flow), and changing password
// (Supabase Auth) are unrelated operations with different failure modes, so
// each gets its own submit button and its own status message.
const AccountDetailsSection = () => {
  const { user, profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState(null);

  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null);

  useEffect(() => {
    setFullName(profile?.full_name || '');
    setPhone(profile?.phone || '');
  }, [profile]);

  useEffect(() => {
    setNewEmail(user?.email || '');
  }, [user]);

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setProfileStatus(null);

    if (!fullName.trim()) {
      setProfileStatus({ type: 'error', text: 'Please enter your name.' });
      return;
    }

    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    setSavingProfile(false);

    if (error) {
      setProfileStatus({ type: 'error', text: 'Could not save your details. Please try again.' });
      return;
    }

    setProfileStatus({ type: 'success', text: 'Your details have been updated.' });
    refreshProfile();
  };

  const handleUpdateEmail = async (event) => {
    event.preventDefault();
    setEmailStatus(null);

    const trimmedEmail = newEmail.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailStatus({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    if (trimmedEmail === user.email) {
      setEmailStatus({ type: 'error', text: 'That is already your current email address.' });
      return;
    }

    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: trimmedEmail });
    setSavingEmail(false);

    if (error) {
      setEmailStatus({ type: 'error', text: error.message || 'Could not update your email.' });
      return;
    }

    setEmailStatus({ type: 'success', text: 'Check your inbox (both your old and new address) to confirm this change.' });
  };

  const handleUpdatePassword = async (event) => {
    event.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      setPasswordStatus({ type: 'error', text: error.message || 'Could not update your password.' });
      return;
    }

    setPasswordStatus({ type: 'success', text: 'Your password has been updated.' });
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-5">
      <div className={cardClasses}>
        <Typography variant="h4" className="text-foreground mb-4">Profile Details</Typography>
        <form onSubmit={handleSaveProfile} className="space-y-3.5">
          <Input
            id="account-name"
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
          <Input
            id="account-phone"
            label="Phone Number"
            type="text"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <Button type="submit" className="px-5 py-2.5 text-[0.74rem]" icon={Save} disabled={savingProfile}>
            {savingProfile ? 'Saving...' : 'Save Details'}
          </Button>
          <StatusMessage status={profileStatus} />
        </form>
      </div>

      <div className={cardClasses}>
        <Typography variant="h4" className="text-foreground mb-1.5">Email Address</Typography>
        <p className="text-[0.8rem] text-muted-foreground mb-4">Current: {user?.email}</p>
        <form onSubmit={handleUpdateEmail} className="space-y-3.5">
          <Input
            id="account-email"
            label="New Email Address"
            type="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
          />
          <Button type="submit" variant="secondary" className="px-5 py-2.5 text-[0.74rem]" disabled={savingEmail}>
            {savingEmail ? 'Sending...' : 'Update Email'}
          </Button>
          <StatusMessage status={emailStatus} />
        </form>
      </div>

      <div className={cardClasses}>
        <Typography variant="h4" className="text-foreground mb-4">Password</Typography>
        <form onSubmit={handleUpdatePassword} className="space-y-3.5">
          <Input
            id="account-new-password"
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <Input
            id="account-confirm-password"
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          <Button type="submit" variant="secondary" className="px-5 py-2.5 text-[0.74rem]" disabled={savingPassword}>
            {savingPassword ? 'Updating...' : 'Update Password'}
          </Button>
          <StatusMessage status={passwordStatus} />
        </form>
      </div>
    </div>
  );
};

export default AccountDetailsSection;
