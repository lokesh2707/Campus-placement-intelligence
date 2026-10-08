'use client';

import React, { useState } from 'react';
import { apiClient } from '../../../services/api-client';
import Link from 'next/link';
import { ErrorAlert } from '../../../components/ErrorAlert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiClient.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Unable to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4 py-12">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl font-bold text-xl mb-2">
            🔑
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Reset Password</h1>
          <p className="text-sm text-slate-400">
            Enter your email to receive recovery instructions
          </p>
        </div>

        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-emerald-300 text-sm">
              If an account exists for <span className="font-semibold text-white">{email}</span>, password reset instructions have been generated.
            </div>
            <p className="text-xs text-slate-400">
              In development mode, check server logs or developer email inbox.
            </p>
            <div className="pt-2">
              <Link
                href="/auth/login"
                className="inline-block w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Registered Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@campus.edu"
                className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition shadow-lg shadow-amber-600/20"
            >
              {loading ? 'Submitting...' : 'Send Reset Instructions'}
            </button>

            <div className="text-center pt-2 text-xs text-slate-400">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-amber-400 hover:text-amber-300 font-medium">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
