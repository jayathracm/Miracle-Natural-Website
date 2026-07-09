import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Fetch the profile row (name, phone, role) for whoever's currently signed
  // in, so the rest of the app can gate admin-only UI and prefill account
  // forms without a separate call. profiles.full_name/phone are the single
  // source of truth for display purposes — not auth user_metadata, which is
  // only ever a snapshot from signup time.
  const loadProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role')
      .eq('id', userId)
      .single();

    setProfile(error ? null : data);
    setProfileLoading(false);
  };

  useEffect(() => {
    loadProfile(session?.user?.id);
  }, [session?.user?.id]);

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    profile,
    profileLoading,
    role: profile?.role ?? 'customer',
    // Superadmin is a rank above admin, not a separate track — anything
    // gated on isAdmin (RequireAdmin route guard, admin nav links) should
    // also be visible to superadmins. isSuperAdmin is the stricter check,
    // used only to gate the account-management page/nav link itself.
    isAdmin: profile?.role === 'admin' || profile?.role === 'superadmin',
    isSuperAdmin: profile?.role === 'superadmin',
    isCorporatePartner: profile?.role === 'corporate_partner',
    signOut: () => supabase.auth.signOut(),
    // Lets a component re-pull the profile row after editing it (name/phone
    // changes), without waiting for a full auth-state change event.
    refreshProfile: () => loadProfile(session?.user?.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components -- hook is intentionally colocated with its provider
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
