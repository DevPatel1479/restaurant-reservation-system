import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div className="page-center">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return children;
}
