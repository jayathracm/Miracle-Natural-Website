import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';

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

  // Loads the profile row (name, phone, role) for the signed-in user.
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
    // Superadmin counts as admin everywhere isAdmin is checked.
    isAdmin: profile?.role === 'admin' || profile?.role === 'superadmin',
    isSuperAdmin: profile?.role === 'superadmin',
    isCorporatePartner: profile?.role === 'corporate_partner',
    signOut: () => supabase.auth.signOut(),
    // Re-pulls the profile after an edit, without a full auth-state event.
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
