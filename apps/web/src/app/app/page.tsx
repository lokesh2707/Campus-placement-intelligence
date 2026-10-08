'use client';

import React from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

export default function AppPortalShell() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                🎓
              </div>
              <span className="font-bold text-lg tracking-tight">Placement OS</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                User Portal
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-slate-200">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-indigo-400 font-mono">{user?.role}</div>
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
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold">Authenticated Session Active</h1>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl">
              You are signed in as <span className="text-white font-medium">{user?.email}</span> with role{' '}
              <span className="text-indigo-400 font-mono font-semibold">{user?.role}</span>.
              This confirms the Phase 2 user identity, JWT session, and protected route verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="text-xs text-slate-400 uppercase font-semibold">User ID</div>
              <div className="font-mono text-xs text-slate-200 break-all">{user?.id}</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="text-xs text-slate-400 uppercase font-semibold">Verification Status</div>
              <div className="text-sm font-semibold flex items-center space-x-2">
                <span className={user?.emailVerified ? 'text-emerald-400' : 'text-amber-400'}>
                  {user?.emailVerified ? '✓ Verified' : '⏳ Pending Verification'}
                </span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="text-xs text-slate-400 uppercase font-semibold">Account State</div>
              <div className="text-sm font-semibold text-emerald-400">{user?.status}</div>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap gap-3">
            <Link
              href="/"
              className="text-xs px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            >
              ← Back to Platform Overview
            </Link>
            <Link
              href="/admin"
              className="text-xs px-4 py-2 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 rounded-lg border border-indigo-800/50 transition"
            >
              Test Admin Route Protection →
            </Link>
            <Link
              href="/recruiter"
              className="text-xs px-4 py-2 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 rounded-lg border border-indigo-800/50 transition"
            >
              Test Recruiter Route Protection →
            </Link>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
