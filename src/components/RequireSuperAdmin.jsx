import React from 'react';
import { Navigate } from 'react-router-dom';
import { Typography } from './ui/Typography';
import { useAuth } from '../context/AuthContext';

// Gates a route to signed-in superadmins only. Regular admins are bounced to
// /account, same as RequireAdmin does for non-admins — the account
// management page (role assignment) is a rank above ordinary admin access.
// RLS/RPC-side private.is_superadmin() checks remain the real security
// boundary; this is just a UX nicety.
const RequireSuperAdmin = ({ children }) => {
  const { user, isSuperAdmin, loading, profileLoading } = useAuth();

  if (loading || profileLoading) {
    return (
      <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center">
        <Typography variant="small">Checking access...</Typography>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/account" replace />;
  }

  return children;
};

export default RequireSuperAdmin;
