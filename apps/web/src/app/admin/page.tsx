'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api-client';
import { UserRole } from '@campus-os/shared-types';
import Link from 'next/link';

export default function AdminConsolePage() {
  const { user, logout } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Colleges & Academic Structure
  const [colleges, setColleges] = useState<any[]>([]);

  const loadStudents = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (verificationFilter) params.verificationStatus = verificationFilter;

      const res = await apiClient.getAdminStudents(params);
      if (res.success && res.data) {
        setStudents(res.data);
        if (res.meta) {
          setPagination(res.meta as any);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
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
    loadStudents(1);
    loadAcademicData();
  }, [verificationFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudents(1);
  };

  const handleVerifyStudent = async (studentId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      const notes = prompt(`Enter optional verification remarks for ${status}:`) || '';
      await apiClient.verifyAdminStudent(studentId, status, notes);
      await loadStudents(pagination.page);
      if (selectedStudent && selectedStudent.id === studentId) {
        const updated = await apiClient.getAdminStudentById(studentId);
        if (updated.success && updated.data) setSelectedStudent(updated.data);
      }
    } catch (err: any) {
      alert(err.message || 'Verification update failed');
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
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <div>
              <h1 className="text-2xl font-bold text-white">Student & Academic Management</h1>
              <p className="text-slate-400 text-sm mt-1">
                {user?.role === UserRole.DEPARTMENT_COORDINATOR
                  ? 'Scoped to your assigned department. Verify academic metrics and review candidate profiles.'
                  : 'Centralized institution student database, academic verification, and college structure.'}
              </p>
            </div>
            <Link
              href="/app"
              className="text-xs px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition self-start"
            >
              ← Student View
            </Link>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2 w-full">
              <input
                type="text"
                placeholder="Search by student name, roll number, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition"
              >
                Search
              </button>
            </form>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <span className="text-xs text-slate-400 whitespace-nowrap">Status:</span>
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="VERIFIED">Verified</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading students...
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-400 text-sm">{error}</div>
            ) : students.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No students found matching current query or department scope.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Student</th>
                      <th className="px-5 py-3.5">Registration No.</th>
                      <th className="px-5 py-3.5">Department & Batch</th>
                      <th className="px-5 py-3.5">CGPA</th>
                      <th className="px-5 py-3.5">Backlogs</th>
                      <th className="px-5 py-3.5">Verification</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {students.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">
                            {st.user?.firstName} {st.user?.lastName}
                          </div>
                          <div className="text-xs text-slate-400">{st.user?.email}</div>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-indigo-300">{st.studentId}</td>
                        <td className="px-5 py-4 text-xs">
                          <div className="text-slate-200 font-medium">{st.department?.code}</div>
                          <div className="text-slate-400">{st.batch?.name || `Grad ${st.graduationYear}`}</div>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-slate-200">
                          {st.cgpa ? Number(st.cgpa).toFixed(2) : '-'}
                        </td>
                        <td className="px-5 py-4 font-mono">
                          <span className={st.activeBacklogs > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                            {st.activeBacklogs}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                              st.verificationStatus === 'VERIFIED'
                                ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
                                : st.verificationStatus === 'REJECTED'
                                ? 'bg-red-950/80 border-red-700/60 text-red-300'
                                : 'bg-amber-950/80 border-amber-700/60 text-amber-300'
                            }`}
                          >
                            {st.verificationStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedStudent(st)}
                            className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                          >
                            Details
                          </button>
                          {st.verificationStatus !== 'VERIFIED' && (
                            <button
                              onClick={() => handleVerifyStudent(st.id, 'VERIFIED')}
                              className="text-xs px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition font-medium"
                            >
                              Verify
                            </button>
                          )}
                          {st.verificationStatus !== 'REJECTED' && (
                            <button
                              onClick={() => handleVerifyStudent(st.id, 'REJECTED')}
                              className="text-xs px-2.5 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 rounded-lg transition"
                            >
                              Reject
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                <span>
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} students)
                </span>
                <div className="space-x-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => loadStudents(pagination.page - 1)}
                    className="px-3 py-1 bg-slate-800 rounded-lg disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => loadStudents(pagination.page + 1)}
                    className="px-3 py-1 bg-slate-800 rounded-lg disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Student Detail Modal Drawer */}
          {selectedStudent && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {selectedStudent.user?.firstName} {selectedStudent.user?.lastName}
                    </h3>
                    <div className="text-xs text-slate-400">
                      {selectedStudent.studentId} • {selectedStudent.department?.name}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-400">CGPA</div>
                    <div className="text-lg font-bold text-indigo-400 font-mono">{selectedStudent.cgpa}</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-400">Active Backlogs</div>
                    <div className="text-lg font-bold font-mono text-slate-200">{selectedStudent.activeBacklogs}</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-400">10th / 12th Percentage</div>
                    <div className="text-sm font-semibold text-slate-200">
                      {selectedStudent.tenthPercentage}% / {selectedStudent.twelfthPercentage}%
                    </div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-400">Profile Completion</div>
                    <div className="text-lg font-bold text-emerald-400 font-mono">
                      {selectedStudent.profileCompletion?.score || 0}%
                    </div>
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

                {/* Resumes */}
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Resume Files</h4>
                  <div className="space-y-2">
                    {selectedStudent.resumes?.map((r: any) => (
                      <div key={r.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                        <span>{r.originalFilename} (v{r.version})</span>
                        <a
                          href={`http://localhost:4000/api/v1/resumes/${r.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition font-medium"
                        >
                          Download Resume
                        </a>
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
        </main>
      </div>
    </ProtectedRoute>
  );
}
