'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api-client';
import { UserRole } from '@campus-os/shared-types';
import Link from 'next/link';

export default function RecruiterDashboardPage() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<{ profile: any; company: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecruiterData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.getRecruiterMe();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load recruiter workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecruiterData();
  }, []);

  const company = data?.company;
  const profile = data?.profile;

  // Calculate deterministic company profile completion
  const calculateCompanyCompletion = () => {
    if (!company) return 0;
    let score = 0;
    if (company.name && company.industry) score += 25; // Basic info
    if (company.description && company.website) score += 25; // Profile details
    if (company.contacts && company.contacts.length > 0) score += 20; // Contacts
    if (company.documents && company.documents.length > 0) score += 15; // Compliance docs
    if (company.hiringPreference) score += 15; // Preferences
    return score;
  };

  const completionScore = calculateCompanyCompletion();

  return (
    <ProtectedRoute allowedRoles={[UserRole.RECRUITER]}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Header */}
        <header className="border-b border-blue-900/40 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/30">
                💼
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-white">Placement Intelligence</span>
                <span className="ml-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-950 border border-blue-800 text-blue-300">
                  Recruiter Portal
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-200">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-blue-400 font-mono">
                  {profile?.designation || 'Corporate Recruiter'}
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="text-xs px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-mono">
              Loading employer workspace...
            </div>
          ) : error ? (
            <div className="p-6 bg-red-950/40 border border-red-900 rounded-2xl text-red-300 text-sm">
              {error}
            </div>
          ) : (
            <>
              {/* Top Banner Card */}
              <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-slate-900/40 border border-blue-900/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                      {company?.name || 'Partner Employer'}
                    </h1>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        company?.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : company?.verificationStatus === 'REJECTED'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {company?.verificationStatus || 'PENDING'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm">
                    {company?.industry} • {company?.companyType} • {company?.headquarters || 'Remote'}
                  </p>
                  <p className="text-slate-500 text-xs font-mono">
                    Official Slug: <span className="text-blue-400">{company?.slug}</span>
                  </p>
                </div>

                {/* Company Completion */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl min-w-[240px] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Company Profile Health</span>
                    <span className="font-bold text-blue-400 font-mono">{completionScore}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${completionScore}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">Complete contacts & docs for drive eligibility</p>
                </div>
              </div>

              {/* Navigation Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Recruiter Profile */}
                <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-200">Recruiter Profile</h3>
                    <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400">Personal</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500">Designation:</span>
                      <div className="font-semibold text-slate-300">{profile?.designation || 'Corporate Recruiter'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Department:</span>
                      <div className="text-slate-300">{profile?.department || 'Human Resources'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Work Email:</span>
                      <div className="text-slate-300">{profile?.workEmail || user?.email}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Verification State:</span>
                      <div className="font-semibold text-amber-400">{profile?.verificationStatus}</div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Compliance Documents */}
                <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-200">Legal Compliance</h3>
                    <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400">Verification</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="text-slate-400 leading-relaxed">
                      Corporate certificates (PAN, GST, Registration) uploaded for campus accreditation.
                    </p>
                    <div className="pt-2">
                      <span className="text-slate-300 font-semibold">
                        Uploaded Documents: {company?.documents?.length || 0}
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/recruiter/company"
                    className="inline-block text-xs px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg border border-slate-700 transition"
                  >
                    Manage Documents →
                  </Link>
                </div>

                {/* Card 3: Hiring Preferences */}
                <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-200">Hiring Preferences</h3>
                    <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400">Targeting</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500">CGPA Threshold:</span>
                      <div className="font-semibold text-amber-300">
                        {company?.hiringPreference?.minimumCgpa?.toFixed(2) || 'None set'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Max Backlogs Allowed:</span>
                      <div className="text-slate-300">
                        {company?.hiringPreference?.maximumBacklogs ?? 'Any'}
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/recruiter/company"
                    className="inline-block text-xs px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg border border-slate-700 transition"
                  >
                    Edit Preferences →
                  </Link>
                </div>
              </div>

              {/* Placement Drive Activity Placeholder (Section 22 strict requirement) */}
              <div className="p-8 bg-slate-900/30 border border-slate-800/80 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/60 flex items-center justify-center text-xl">
                  🚀
                </div>
                <h3 className="text-base font-semibold text-slate-200">Campus Placement Drives</h3>
                <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                  No placement drives yet. Placement drive management and candidate shortlisting will appear here once enabled in subsequent platform phases.
                </p>
                <div className="pt-2">
                  <Link
                    href="/recruiter/company"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition inline-block shadow-md shadow-blue-600/20"
                  >
                    Open Full Company Workspace
                  </Link>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
