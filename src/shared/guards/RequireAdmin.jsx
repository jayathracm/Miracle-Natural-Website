import React from 'react';
import { Navigate } from 'react-router';
import { Typography } from '@/shared/ui/Typography';
import { useAuth } from '@/features/auth/AuthContext';

// Gates a route to signed-in admins, redirecting everyone else. RLS on the
// backend is the real security boundary, this is just a UX nicety.
const RequireAdmin = ({ children }) => {
  const { user, isAdmin, loading, profileLoading } = useAuth();

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

  if (!isAdmin) {
    return <Navigate to="/account" replace />;
  }

  return children;
};

export default RequireAdmin;
