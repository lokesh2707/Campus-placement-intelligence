'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@campus-os/shared-types';
import { LoadingSpinner } from './LoadingSpinner';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <LoadingSpinner message="Verifying session credentials..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto text-xl">
            🔒
          </div>
          <h2 className="text-xl font-bold">Authentication Required</h2>
          <p className="text-sm text-slate-400">
            You must be logged in to view this application section.
          </p>
          <div className="pt-2">
            <Link
              href="/auth/login"
              className="inline-block w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition"
            >
              Sign In to Continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-900/50 rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto text-xl">
            ⛔
          </div>
          <h2 className="text-xl font-bold text-rose-300">Access Denied (403)</h2>
          <p className="text-sm text-slate-400">
            Your role (<span className="text-indigo-400 font-semibold">{user.role}</span>) does not have authorization to view this resource.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition"
            >
              Return to Platform Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
