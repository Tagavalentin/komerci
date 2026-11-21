import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin } from '@/lib/homeRoute';

export default function AdminGuard() {
  const { user } = useAuth();
  if (!isAdmin(user)) return <Navigate to="/vendeur" replace />;
  return <Outlet />;
}