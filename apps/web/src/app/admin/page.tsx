'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api-client';
import { UserRole } from '@campus-os/shared-types';
import Link from 'next/link';

export default function AdminConsolePage() {
  const { user, logout } = useAuth();
  const [mainTab, setMainTab] = useState<'students' | 'companies'>('students');

  // ================= STUDENT STATE =================
  const [students, setStudents] = useState<any[]>([]);
  const [studentPagination, setStudentPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [studentLoading, setStudentLoading] = useState(true);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentVerificationFilter, setStudentVerificationFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Colleges
  const [colleges, setColleges] = useState<any[]>([]);

  // ================= COMPANY STATE =================
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyPagination, setCompanyPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [companySearch, setCompanySearch] = useState('');
  const [companyStatusFilter, setCompanyStatusFilter] = useState('');
  const [companyVerificationFilter, setCompanyVerificationFilter] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [companyDetailTab, setCompanyDetailTab] = useState<'overview' | 'recruiters' | 'contacts' | 'documents' | 'preferences'>('overview');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDesignation, setInviteDesignation] = useState('');
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  // Load students
  const loadStudents = async (page = 1) => {
    try {
      setStudentLoading(true);
      setStudentError(null);
      const params: any = { page, limit: 10 };
      if (studentSearch) params.search = studentSearch;
      if (studentVerificationFilter) params.verificationStatus = studentVerificationFilter;

      const res = await apiClient.getAdminStudents(params);
      if (res.success && res.data) {
        setStudents(res.data);
        if (res.meta) {
          setStudentPagination(res.meta as any);
        }
      }
    } catch (err: any) {
      setStudentError(err.message || 'Failed to load students');
    } finally {
      setStudentLoading(false);
    }
  };

  // Load companies
  const loadCompanies = async (page = 1) => {
    try {
      setCompanyLoading(true);
      setCompanyError(null);
      const params: any = { page, limit: 10 };
      if (companySearch) params.search = companySearch;
      if (companyStatusFilter) params.status = companyStatusFilter;
      if (companyVerificationFilter) params.verificationStatus = companyVerificationFilter;

      const res = await apiClient.getCompanies(params);
      if (res.success && res.data) {
        setCompanies(res.data);
        if (res.meta) {
          setCompanyPagination(res.meta as any);
        }
      }
    } catch (err: any) {
      setCompanyError(err.message || 'Failed to load companies');
    } finally {
      setCompanyLoading(false);
    }
  };

  const loadAcademicData = async () => {
    try {
      const res = await apiClient.getColleges();
      if (res.success && res.data) {
        setColleges(res.data);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    if (mainTab === 'students') {
      loadStudents(1);
    } else {
      loadCompanies(1);
    }
    loadAcademicData();
  }, [mainTab, studentVerificationFilter, companyStatusFilter, companyVerificationFilter]);

  const handleStudentSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudents(1);
  };

  const handleCompanySearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCompanies(1);
  };

  const handleVerifyStudent = async (studentId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      const notes = prompt(`Enter optional remarks for ${status}:`) || '';
      await apiClient.verifyAdminStudent(studentId, status, notes);
      await loadStudents(studentPagination.page);
      if (selectedStudent && selectedStudent.id === studentId) {
        const updated = await apiClient.getAdminStudentById(studentId);
        if (updated.success && updated.data) setSelectedStudent(updated.data);
      }
    } catch (err: any) {
      alert(err.message || 'Verification update failed');
    }
  };

  const handleVerifyCompany = async (companyId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      const notes = prompt(`Enter optional remarks for ${status}:`) || '';
      if (status === 'VERIFIED') {
        await apiClient.verifyCompany(companyId, notes);
      } else {
        await apiClient.rejectCompany(companyId, notes);
      }
      await loadCompanies(companyPagination.page);
      if (selectedCompany && selectedCompany.id === companyId) {
        const updated = await apiClient.getCompanyById(companyId);
        if (updated.success && updated.data) setSelectedCompany(updated.data);
      }
    } catch (err: any) {
      alert(err.message || 'Company verification failed');
    }
  };

  const handleToggleSuspendCompany = async (companyId: string, currentStatus: string) => {
    try {
      if (currentStatus === 'SUSPENDED') {
        await apiClient.activateCompany(companyId);
      } else {
        const notes = prompt('Enter reason for suspension:') || '';
        await apiClient.suspendCompany(companyId, notes);
      }
      await loadCompanies(companyPagination.page);
      if (selectedCompany && selectedCompany.id === companyId) {
        const updated = await apiClient.getCompanyById(companyId);
        if (updated.success && updated.data) setSelectedCompany(updated.data);
      }
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleInspectCompany = async (companyId: string) => {
    try {
      const res = await apiClient.getCompanyById(companyId);
      if (res.success && res.data) {
        setSelectedCompany(res.data);
        setCompanyDetailTab('overview');
        setInviteMessage(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to inspect company');
    }
  };

  const handleInviteRecruiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !inviteEmail) return;
    try {
      setInviteMessage(null);
      await apiClient.inviteRecruiter(selectedCompany.id, {
        email: inviteEmail,
        designation: inviteDesignation || undefined,
      });
      setInviteMessage(`Invitation successfully dispatched to ${inviteEmail}`);
      setInviteEmail('');
      setInviteDesignation('');
      // refresh company details
      const updated = await apiClient.getCompanyById(selectedCompany.id);
      if (updated.success && updated.data) setSelectedCompany(updated.data);
    } catch (err: any) {
      alert(err.message || 'Failed to invite recruiter');
    }
  };

  const handleVerifyDocument = async (documentId: string, status: 'VERIFIED' | 'REJECTED') => {
    if (!selectedCompany) return;
    try {
      const notes = prompt(`Optional remarks for document ${status}:`) || '';
      if (status === 'VERIFIED') {
        await apiClient.verifyCompanyDocument(selectedCompany.id, documentId, notes);
      } else {
        await apiClient.rejectCompanyDocument(selectedCompany.id, documentId, notes);
      }
      const updated = await apiClient.getCompanyById(selectedCompany.id);
      if (updated.success && updated.data) setSelectedCompany(updated.data);
    } catch (err: any) {
      alert(err.message || 'Document verification update failed');
    }
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.PLACEMENT_ADMIN, UserRole.DEPARTMENT_COORDINATOR, UserRole.PLACEMENT_COORDINATOR]}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center font-bold text-white shadow-lg shadow-amber-600/20">
                🏛️
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-white">Placement Intelligence</span>
                <span className="ml-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/50 text-amber-300">
                  {user?.role === UserRole.DEPARTMENT_COORDINATOR ? 'Dept Coordinator' : 'Admin Console'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-200">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-amber-400 font-mono">{user?.role}</div>
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

        {/* Content */}
        <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
          {/* Main Module Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex space-x-3">
              <button
                onClick={() => setMainTab('students')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
                  mainTab === 'students'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🎓 Student & Academic
              </button>
              <button
                onClick={() => setMainTab('companies')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
                  mainTab === 'companies'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                💼 Companies & Recruiters
              </button>
            </div>

            <div className="text-xs text-slate-400 hidden sm:block font-mono">
              Institutional Hierarchy: Apex Institute of Technology
            </div>
          </div>

          {/* ================= TAB 1: STUDENTS ================= */}
          {mainTab === 'students' && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <form onSubmit={handleStudentSearch} className="flex gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by student ID, name, email..."
                    className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 w-full sm:w-80 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
                  >
                    Search
                  </button>
                </form>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <select
                    value={studentVerificationFilter}
                    onChange={(e) => setStudentVerificationFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="">All Verification States</option>
                    <option value="PENDING">Pending Verification</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Student Directory Table */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Registration ID</th>
                        <th className="py-3 px-4">Department & Batch</th>
                        <th className="py-3 px-4">CGPA</th>
                        <th className="py-3 px-4">Backlogs</th>
                        <th className="py-3 px-4">Completion</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {studentLoading ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-500">
                            Loading students...
                          </td>
                        </tr>
                      ) : students.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-500">
                            No student profiles match the filter criteria.
                          </td>
                        </tr>
                      ) : (
                        students.map((st: any) => (
                          <tr key={st.id} className="hover:bg-slate-800/30 transition">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-200">
                                {st.user?.firstName} {st.user?.lastName}
                              </div>
                              <div className="text-slate-500 text-[11px]">{st.user?.email}</div>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-300">{st.studentId}</td>
                            <td className="py-3 px-4 text-slate-400">
                              <div>{st.department?.code} ({st.degree?.code})</div>
                              <div className="text-[10px] text-slate-500">{st.batch?.name}</div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-amber-300">{st.cgpa?.toFixed(2) || 'N/A'}</td>
                            <td className="py-3 px-4 text-slate-300">
                              {st.activeBacklogs > 0 ? (
                                <span className="text-red-400 font-semibold">{st.activeBacklogs} active</span>
                              ) : (
                                <span className="text-emerald-400">0</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-amber-500 rounded-full"
                                    style={{ width: `${st.profileCompletion?.score || 0}%` }}
                                  />
                                </div>
                                <span className="text-[11px] text-slate-400">{st.profileCompletion?.score || 0}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                  st.verificationStatus === 'VERIFIED'
                                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                                    : st.verificationStatus === 'REJECTED'
                                    ? 'bg-red-950/80 text-red-400 border border-red-800'
                                    : 'bg-amber-950/80 text-amber-400 border border-amber-800'
                                }`}
                              >
                                {st.verificationStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                onClick={() => setSelectedStudent(st)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
                  <div>Total Students: {studentPagination.total}</div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={studentPagination.page <= 1}
                      onClick={() => loadStudents(studentPagination.page - 1)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-300"
                    >
                      Previous
                    </button>
                    <span>Page {studentPagination.page} of {studentPagination.totalPages || 1}</span>
                    <button
                      disabled={studentPagination.page >= studentPagination.totalPages}
                      onClick={() => loadStudents(studentPagination.page + 1)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-300"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: COMPANIES & RECRUITERS ================= */}
          {mainTab === 'companies' && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <form onSubmit={handleCompanySearch} className="flex gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    placeholder="Search company name, industry, headquarters..."
                    className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 w-full sm:w-80 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
                  >
                    Search
                  </button>
                </form>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <select
                    value={companyVerificationFilter}
                    onChange={(e) => setCompanyVerificationFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="">All Verification States</option>
                    <option value="PENDING">Pending Verification</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                  </select>

                  <select
                    value={companyStatusFilter}
                    onChange={(e) => setCompanyStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="">All Lifecycle Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              {/* Company Directory Table */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Company</th>
                        <th className="py-3 px-4">Industry & Type</th>
                        <th className="py-3 px-4">Size</th>
                        <th className="py-3 px-4">Recruiters</th>
                        <th className="py-3 px-4">Verification</th>
                        <th className="py-3 px-4">Lifecycle Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {companyLoading ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500">
                            Loading company profiles...
                          </td>
                        </tr>
                      ) : companies.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500">
                            No companies match the search or filter criteria.
                          </td>
                        </tr>
                      ) : (
                        companies.map((c: any) => (
                          <tr key={c.id} className="hover:bg-slate-800/30 transition">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-200">{c.name}</div>
                              <div className="text-[11px] text-blue-400 font-mono">slug: {c.slug}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-400">
                              <div>{c.industry}</div>
                              <div className="text-[10px] text-slate-500">{c.companyType}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-300 font-medium">{c.companySize}</td>
                            <td className="py-3 px-4 text-slate-400">
                              <span className="px-2 py-0.5 bg-slate-800 rounded-md text-slate-300 font-mono">
                                {c._count?.recruiters || 0}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                  c.verificationStatus === 'VERIFIED'
                                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                                    : c.verificationStatus === 'REJECTED'
                                    ? 'bg-red-950/80 text-red-400 border border-red-800'
                                    : 'bg-amber-950/80 text-amber-400 border border-amber-800'
                                }`}
                              >
                                {c.verificationStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                  c.status === 'ACTIVE'
                                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900'
                                    : 'bg-red-950/60 text-red-300 border border-red-900'
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                onClick={() => handleInspectCompany(c.id)}
                                className="px-2.5 py-1 bg-blue-900/60 hover:bg-blue-800 text-blue-200 rounded-lg text-xs transition border border-blue-800/60"
                              >
                                Manage Company
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Company Pagination */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
                  <div>Total Companies: {companyPagination.total}</div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={companyPagination.page <= 1}
                      onClick={() => loadCompanies(companyPagination.page - 1)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-300"
                    >
                      Previous
                    </button>
                    <span>Page {companyPagination.page} of {companyPagination.totalPages || 1}</span>
                    <button
                      disabled={companyPagination.page >= companyPagination.totalPages}
                      onClick={() => loadCompanies(companyPagination.page + 1)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-300"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= MODAL: STUDENT DETAILS ================= */}
          {selectedStudent && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-bold text-lg text-white">
                      {selectedStudent.user?.firstName} {selectedStudent.user?.lastName}
                    </h3>
                    <p className="text-xs text-slate-400">{selectedStudent.user?.email} • ID: {selectedStudent.studentId}</p>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                    <span className="text-slate-400">Department</span>
                    <div className="font-semibold text-slate-200">{selectedStudent.department?.name}</div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                    <span className="text-slate-400">Degree & Batch</span>
                    <div className="font-semibold text-slate-200">{selectedStudent.degree?.name} ({selectedStudent.batch?.name})</div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                    <span className="text-slate-400">Current CGPA</span>
                    <div className="font-semibold text-amber-300 text-sm">{selectedStudent.cgpa?.toFixed(2) || 'N/A'}</div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                    <span className="text-slate-400">Active Backlogs</span>
                    <div className="font-semibold text-red-400 text-sm">{selectedStudent.activeBacklogs}</div>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Skills Profile</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.skills?.map((sk: any) => (
                      <span key={sk.id} className="text-xs px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200">
                        {sk.skill?.name} ({sk.proficiency})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Projects */}
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Projects</h4>
                  <div className="space-y-2">
                    {selectedStudent.projects?.map((p: any) => (
                      <div key={p.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                        <div className="font-semibold text-slate-200">{p.title}</div>
                        <div className="text-slate-400">{p.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-3">
                  <button
                    onClick={() => handleVerifyStudent(selectedStudent.id, 'VERIFIED')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Verify Academic Credentials
                  </button>
                  <button
                    onClick={() => handleVerifyStudent(selectedStudent.id, 'REJECTED')}
                    className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Reject Verification
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= MODAL: COMPANY MANAGEMENT ================= */}
          {selectedCompany && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-800/80 flex items-center justify-center text-xl shadow-md">
                      🏢
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white flex items-center gap-2">
                        {selectedCompany.name}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            selectedCompany.verificationStatus === 'VERIFIED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {selectedCompany.verificationStatus}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        {selectedCompany.industry} • {selectedCompany.companyType} • {selectedCompany.headquarters || 'Remote'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* Sub-Tabs */}
                <div className="flex border-b border-slate-800 pb-2 space-x-2 text-xs">
                  {(['overview', 'recruiters', 'contacts', 'documents', 'preferences'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setCompanyDetailTab(tab)}
                      className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                        companyDetailTab === tab
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Sub-Tab 1: Overview */}
                {companyDetailTab === 'overview' && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-slate-400">Legal Business Name</span>
                        <div className="font-semibold text-slate-200">{selectedCompany.legalName || selectedCompany.name}</div>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-slate-400">Website</span>
                        <div className="font-semibold text-blue-400 truncate">
                          {selectedCompany.website ? (
                            <a href={selectedCompany.website} target="_blank" rel="noreferrer" className="underline">
                              {selectedCompany.website}
                            </a>
                          ) : (
                            'None provided'
                          )}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-slate-400">Company Size</span>
                        <div className="font-semibold text-slate-200">{selectedCompany.companySize}</div>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-slate-400">Founded Year</span>
                        <div className="font-semibold text-slate-200">{selectedCompany.foundedYear || 'Not specified'}</div>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-slate-400">Contact Email</span>
                        <div className="font-semibold text-slate-200">{selectedCompany.contactEmail || 'N/A'}</div>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-slate-400">Contact Phone</span>
                        <div className="font-semibold text-slate-200">{selectedCompany.contactPhone || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-slate-400">Company Overview</span>
                      <p className="text-slate-300 leading-relaxed">{selectedCompany.description || 'No description provided.'}</p>
                    </div>

                    {/* Verification & Lifecycle Controls */}
                    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                      <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                        Administrative Governance Controls
                      </span>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={() => handleVerifyCompany(selectedCompany.id, 'VERIFIED')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition"
                        >
                          Approve & Verify Company
                        </button>
                        <button
                          onClick={() => handleVerifyCompany(selectedCompany.id, 'REJECTED')}
                          className="px-3.5 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-lg font-semibold transition"
                        >
                          Reject Verification
                        </button>
                        <button
                          onClick={() => handleToggleSuspendCompany(selectedCompany.id, selectedCompany.status)}
                          className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
                            selectedCompany.status === 'SUSPENDED'
                              ? 'bg-amber-600 hover:bg-amber-500 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {selectedCompany.status === 'SUSPENDED' ? 'Reactivate Company' : 'Suspend Company'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 2: Recruiters */}
                {companyDetailTab === 'recruiters' && (
                  <div className="space-y-4 text-xs">
                    {/* Invite Recruiter Form */}
                    <form onSubmit={handleInviteRecruiter} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                      <span className="font-semibold text-slate-300">Invite Authorized Recruiter</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="email"
                          required
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="Recruiter official work email..."
                          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          value={inviteDesignation}
                          onChange={(e) => setInviteDesignation(e.target.value)}
                          placeholder="Designation (e.g. Lead Campus Recruiter)"
                          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition"
                      >
                        Dispatch Invitation Link
                      </button>
                      {inviteMessage && (
                        <p className="text-emerald-400 text-xs font-semibold">{inviteMessage}</p>
                      )}
                    </form>

                    {/* Current Recruiters List */}
                    <div className="space-y-2">
                      <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                        Active Recruiters ({selectedCompany.recruiters?.length || 0})
                      </span>
                      {selectedCompany.recruiters?.length === 0 ? (
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-slate-500">
                          No recruiters currently linked to this company profile.
                        </div>
                      ) : (
                        selectedCompany.recruiters?.map((rec: any) => (
                          <div
                            key={rec.id}
                            className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
                          >
                            <div>
                              <div className="font-semibold text-slate-200">
                                {rec.user?.firstName} {rec.user?.lastName}
                              </div>
                              <div className="text-slate-400 text-[11px]">
                                {rec.user?.email} • {rec.designation || 'Recruiter'}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                rec.verificationStatus === 'VERIFIED'
                                  ? 'bg-emerald-950 text-emerald-400'
                                  : 'bg-amber-950 text-amber-400'
                              }`}
                            >
                              {rec.verificationStatus}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-Tab 3: Contacts */}
                {companyDetailTab === 'contacts' && (
                  <div className="space-y-3 text-xs">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                      Authorized Institutional Contacts ({selectedCompany.contacts?.length || 0})
                    </span>
                    {selectedCompany.contacts?.length === 0 ? (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-slate-500">
                        No secondary contacts registered.
                      </div>
                    ) : (
                      selectedCompany.contacts?.map((ct: any) => (
                        <div
                          key={ct.id}
                          className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-slate-200 flex items-center gap-2">
                              {ct.name}
                              {ct.isPrimary && (
                                <span className="px-1.5 py-0.5 bg-blue-950 border border-blue-800 text-blue-300 text-[9px] rounded">
                                  PRIMARY
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-[11px]">
                              {ct.designation || 'Staff'} • {ct.email} • {ct.phone || 'No phone'}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-300 font-mono text-[10px]">
                            {ct.contactType}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Sub-Tab 4: Documents */}
                {companyDetailTab === 'documents' && (
                  <div className="space-y-3 text-xs">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                      Corporate Compliance Documents ({selectedCompany.documents?.length || 0})
                    </span>
                    {selectedCompany.documents?.length === 0 ? (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-slate-500">
                        No compliance documents uploaded.
                      </div>
                    ) : (
                      selectedCompany.documents?.map((doc: any) => (
                        <div
                          key={doc.id}
                          className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
                        >
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-200">{doc.fileName}</div>
                            <div className="text-slate-400 text-[11px]">
                              Type: {doc.documentType} • Size: {(Number(doc.fileSize) / 1024).toFixed(1)} KB
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                doc.verificationStatus === 'VERIFIED'
                                  ? 'bg-emerald-950 text-emerald-400'
                                  : doc.verificationStatus === 'REJECTED'
                                  ? 'bg-red-950 text-red-400'
                                  : 'bg-amber-950 text-amber-400'
                              }`}
                            >
                              {doc.verificationStatus}
                            </span>
                            <button
                              onClick={() => handleVerifyDocument(doc.id, 'VERIFIED')}
                              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px]"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleVerifyDocument(doc.id, 'REJECTED')}
                              className="px-2 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-[11px]"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Sub-Tab 5: Preferences */}
                {companyDetailTab === 'preferences' && (
                  <div className="space-y-3 text-xs">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                      Hiring Preferences & Future Drive Eligibility Criteria
                    </span>
                    {selectedCompany.hiringPreference ? (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-slate-400">Minimum CGPA Benchmark</span>
                            <div className="font-semibold text-amber-300 text-sm">
                              {selectedCompany.hiringPreference.minimumCgpa?.toFixed(2) || 'None set'}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400">Maximum Allowed Backlogs</span>
                            <div className="font-semibold text-slate-200 text-sm">
                              {selectedCompany.hiringPreference.maximumBacklogs ?? 'Any'}
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-400">Preferred Work Modes:</span>
                          <div className="flex gap-2 mt-1">
                            {selectedCompany.hiringPreference.preferredWorkModes?.map((wm: string) => (
                              <span key={wm} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono">
                                {wm}
                              </span>
                            )) || <span className="text-slate-500">None specified</span>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-slate-500">
                        No hiring preferences configured yet by the employer.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
