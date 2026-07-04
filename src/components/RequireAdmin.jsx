import React from 'react';
import { Navigate } from 'react-router-dom';
import { Typography } from './ui/Typography';
import { useAuth } from '../context/AuthContext';

// Gates a route to signed-in admins only. Anyone else is redirected rather
// than shown a "forbidden" page — RLS on the backend is the real security
// boundary, this is just a UX nicety so non-admins don't land on an empty
// dashboard full of failed queries.
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
