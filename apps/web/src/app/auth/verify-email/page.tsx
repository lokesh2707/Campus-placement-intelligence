'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { apiClient } from '../../../services/api-client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setErrorMessage('Verification token was not found in the URL.');
      return;
    }

    let isMounted = true;

    async function verify() {
      try {
        await apiClient.verifyEmail(token!);
        if (isMounted) {
          setSuccess(true);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'Verification token is invalid or has expired.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
      {loading ? (
        <div className="py-8">
          <LoadingSpinner message="Verifying your email address..." />
        </div>
      ) : success ? (
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl font-bold text-3xl mb-2">
            ✓
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-300">Email Verified!</h1>
          <p className="text-sm text-slate-400">
            Your institutional email has been verified. Your account is now fully active.
          </p>
          <div className="pt-4">
            <Link
              href="/auth/login"
              className="inline-block w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition"
            >
              Proceed to Sign In
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl font-bold text-3xl mb-2">
            ⚠️
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-rose-300">Verification Failed</h1>
          <p className="text-sm text-slate-400">
            {errorMessage || 'The verification link is expired or invalid.'}
          </p>
          <div className="pt-4 space-y-2">
            <Link
              href="/auth/login"
              className="inline-block w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition"
            >
              Return to Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4 py-12">
      <Suspense fallback={<LoadingSpinner message="Loading verification interface..." />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
