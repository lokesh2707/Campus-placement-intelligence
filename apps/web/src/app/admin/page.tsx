'use client';

import React from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@campus-os/shared-types';
import Link from 'next/link';

export default function AdminPortalShell() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN]}>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="border-b border-rose-900/40 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center font-bold text-white shadow-md">
                🛡️
              </div>
              <span className="font-bold text-lg tracking-tight">Placement OS</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-300">
                Admin Console
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-slate-200">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-rose-400 font-mono">{user?.role}</div>
              </div>
              <button
                onClick={() => logout()}
                className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="bg-slate-900/40 border border-rose-900/30 rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold">Admin Route Authorization Verified</h1>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl">
              You are authorized as <span className="text-rose-300 font-mono font-semibold">{user?.role}</span>.
              This route enforces role-based access control (RBAC), verifying that non-admin roles receive an access denied 403 response.
            </p>
          </div>

          <div className="pt-4 flex gap-3">
            <Link
              href="/app"
              className="text-xs px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            >
              ← Back to User Portal
            </Link>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
