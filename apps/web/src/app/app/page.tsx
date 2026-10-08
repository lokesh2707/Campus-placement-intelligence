'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api-client';
import Link from 'next/link';

export default function StudentDashboardPage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'projects' | 'internships' | 'resume' | 'preferences'>('overview');

  // Skill addition modal state
  const [taxonomySkills, setTaxonomySkills] = useState<any[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [skillProficiency, setSkillProficiency] = useState('INTERMEDIATE');

  // Resume upload state
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(null);

  // Load student profile & taxonomy
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.getStudentProfile();
      if (res.success && res.data) {
        setProfile(res.data);
      }
    } catch (err: any) {
      if (err.statusCode === 404) {
        setProfile(null);
      } else {
        setError(err.message || 'Failed to load student profile');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadSkills = async () => {
    try {
      const res = await apiClient.getTaxonomySkills();
      if (res.success && res.data) {
        setTaxonomySkills(res.data);
        if (res.data.length > 0) setSelectedSkillId(res.data[0].id);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    if (activeTab === 'skills' && taxonomySkills.length === 0) {
      loadSkills();
    }
  }, [activeTab]);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillId) return;
    try {
      await apiClient.addStudentSkill({ skillId: selectedSkillId, proficiency: skillProficiency });
      await loadProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to add skill');
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    if (!confirm('Remove this skill?')) return;
    try {
      await apiClient.removeStudentSkill(skillId);
      await loadProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to remove skill');
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setResumeUploadError('File exceeds maximum size of 5 MB');
      return;
    }

    try {
      setUploadingResume(true);
      setResumeUploadError(null);
      await apiClient.uploadResume(file);
      await loadProfile();
    } catch (err: any) {
      setResumeUploadError(err.message || 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
      e.target.value = '';
    }
  };

  const handleSetActiveResume = async (resumeId: string) => {
    try {
      await apiClient.setActiveResume(resumeId);
      await loadProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to set active resume');
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm('Delete this resume version?')) return;
    try {
      await apiClient.deleteResume(resumeId);
      await loadProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to delete resume');
    }
  };

  const completion = profile?.profileCompletion || { score: 0 };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Top Navbar */}
        <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                🎓
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-white">Placement Intelligence</span>
                <span className="ml-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300">
                  Student Portal
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-200">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-indigo-400 font-mono">{user?.role}</div>
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

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Loading placement profile...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-950/30 border border-red-800/50 rounded-2xl text-red-200 text-sm">
              <p className="font-bold mb-1">Error Loading Profile</p>
              <p>{error}</p>
            </div>
          ) : !profile ? (
            <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-2xl text-center max-w-xl mx-auto space-y-4">
              <div className="text-4xl">📋</div>
              <h2 className="text-xl font-bold">No Student Profile Found</h2>
              <p className="text-slate-400 text-sm">
                Your user account is registered, but your academic student profile has not been initialized.
                Please contact your department placement coordinator.
              </p>
            </div>
          ) : (
            <>
              {/* Hero Banner: Greeting & Profile Completion Bar */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/80 p-6 sm:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300">
                        {profile.verificationStatus === 'VERIFIED' ? '✓ Academic Record Verified' : '⏳ Verification Pending'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{profile.studentId}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      Welcome, {user?.firstName}!
                    </h1>
                    <p className="text-slate-400 text-sm">
                      {profile.department?.name || 'Engineering'} • {profile.degree?.name || 'B.Tech'} • {profile.batch?.name || 'Class of 2026'}
                    </p>
                  </div>

                  {/* Profile Completion Gauge */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 min-w-[260px] space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300">Profile Completion</span>
                      <span className="font-bold text-indigo-400 font-mono text-sm">{completion.score}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${completion.score}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 flex justify-between">
                      <span>{completion.score === 100 ? 'All milestones fulfilled' : 'Add details to reach 100%'}</span>
                      <span className="text-indigo-400 font-medium">Deterministic</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-800 space-x-2 sm:space-x-4 overflow-x-auto pb-1">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'skills', label: `Skills (${profile.skills?.length || 0})` },
                  { id: 'projects', label: `Projects (${profile.projects?.length || 0})` },
                  { id: 'internships', label: `Internships (${profile.internships?.length || 0})` },
                  { id: 'resume', label: `Resumes (${profile.resumes?.length || 0})` },
                  { id: 'preferences', label: 'Career Preferences' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Academic Summary Card */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 className="font-bold text-white text-base flex items-center space-x-2">
                      <span>📊</span>
                      <span>Academic Summary</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <div className="text-xs text-slate-400">Current CGPA</div>
                        <div className="text-xl font-bold text-indigo-400 font-mono mt-0.5">
                          {profile.cgpa ? Number(profile.cgpa).toFixed(2) : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <div className="text-xs text-slate-400">Active Backlogs</div>
                        <div className={`text-xl font-bold font-mono mt-0.5 ${profile.activeBacklogs > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {profile.activeBacklogs ?? 0}
                        </div>
                      </div>
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <div className="text-xs text-slate-400">10th Grade</div>
                        <div className="text-base font-semibold text-slate-200 mt-0.5">
                          {profile.tenthPercentage ? `${profile.tenthPercentage}%` : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <div className="text-xs text-slate-400">12th Grade</div>
                        <div className="text-base font-semibold text-slate-200 mt-0.5">
                          {profile.twelfthPercentage ? `${profile.twelfthPercentage}%` : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 border-t border-slate-800 pt-3">
                      Institution-controlled academic data verified by Placement Administration.
                    </div>
                  </div>

                  {/* Skills Snapshot Card */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-white text-base flex items-center space-x-2">
                        <span>⚡</span>
                        <span>Key Skills</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('skills')}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        Manage →
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {profile.skills && profile.skills.length > 0 ? (
                        profile.skills.slice(0, 8).map((sk: any) => (
                          <span
                            key={sk.id}
                            className="text-xs px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-200 font-medium flex items-center space-x-1"
                          >
                            <span>{sk.skill?.name || 'Skill'}</span>
                            <span className="text-[10px] text-indigo-400">({sk.proficiency.charAt(0)})</span>
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400">No skills added yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Active Resume Card */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-white text-base flex items-center space-x-2">
                        <span>📄</span>
                        <span>Active Resume</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('resume')}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        Manage →
                      </button>
                    </div>
                    {profile.resumes && profile.resumes.some((r: any) => r.isActive) ? (
                      (() => {
                        const active = profile.resumes.find((r: any) => r.isActive);
                        return (
                          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                            <div className="font-medium text-sm text-slate-200 truncate">{active.originalFilename}</div>
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <span>Version v{active.version}</span>
                              <span className="text-emerald-400 font-medium">✓ Active</span>
                            </div>
                            <a
                              href={`http://localhost:4000/api/v1/resumes/${active.id}/download`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block mt-2 text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition font-medium"
                            >
                              View / Download Resume
                            </a>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-center py-4 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl space-y-2">
                        <p className="text-xs text-slate-400">No active resume uploaded</p>
                        <button
                          onClick={() => setActiveTab('resume')}
                          className="text-xs px-3 py-1 bg-indigo-600 text-white rounded-md font-medium"
                        >
                          Upload Resume
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: SKILLS */}
              {activeTab === 'skills' && (
                <div className="space-y-6">
                  {/* Add Skill Form */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 className="font-bold text-white text-base">Add Skill from Taxonomy</h3>
                    <form onSubmit={handleAddSkill} className="flex flex-wrap gap-4 items-end">
                      <div className="space-y-1.5 flex-1 min-w-[200px]">
                        <label className="text-xs text-slate-400 font-medium">Skill</label>
                        <select
                          value={selectedSkillId}
                          onChange={(e) => setSelectedSkillId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                          {taxonomySkills.map((sk) => (
                            <option key={sk.id} value={sk.id}>
                              {sk.name} ({sk.category})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5 w-44">
                        <label className="text-xs text-slate-400 font-medium">Proficiency</label>
                        <select
                          value={skillProficiency}
                          onChange={(e) => setSkillProficiency(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="BEGINNER">Beginner</option>
                          <option value="INTERMEDIATE">Intermediate</option>
                          <option value="ADVANCED">Advanced</option>
                          <option value="EXPERT">Expert</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition"
                      >
                        Add Skill
                      </button>
                    </form>
                  </div>

                  {/* Skills Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {profile.skills?.map((sk: any) => (
                      <div
                        key={sk.id}
                        className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-sm text-white">{sk.skill?.name}</div>
                          <div className="text-xs text-slate-400">{sk.skill?.category} • {sk.proficiency}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveSkill(sk.skillId)}
                          className="text-xs text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-950/50 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: PROJECTS */}
              {activeTab === 'projects' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profile.projects?.map((prj: any) => (
                      <div key={prj.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-white text-base">{prj.title}</h4>
                          {prj.isCurrent && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">{prj.description}</p>
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {prj.technologies?.map((t: string) => (
                            <span key={t} className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md">
                              {t}
                            </span>
                          ))}
                        </div>
                        <div className="flex space-x-3 pt-3 border-t border-slate-800/80 text-xs">
                          {prj.githubUrl && (
                            <a href={prj.githubUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                              GitHub Repository ↗
                            </a>
                          )}
                          {prj.projectUrl && (
                            <a href={prj.projectUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                              Live Demo ↗
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: INTERNSHIPS */}
              {activeTab === 'internships' && (
                <div className="space-y-4">
                  {profile.internships && profile.internships.length > 0 ? (
                    profile.internships.map((intn: any) => (
                      <div key={intn.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-white text-base">{intn.role}</h4>
                            <div className="text-xs text-indigo-400 font-medium">{intn.companyName} • {intn.location || 'Remote'}</div>
                          </div>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            {new Date(intn.startDate).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 pt-1">{intn.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 bg-slate-900/40 border border-slate-800 rounded-2xl">
                      No internship experience added yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: RESUMES */}
              {activeTab === 'resume' && (
                <div className="space-y-6">
                  {/* Upload Card */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 className="font-bold text-white text-base">Upload New Resume</h3>
                    <p className="text-xs text-slate-400">
                      Upload in PDF or Word format (.pdf, .docx). Maximum size: 5 MB. New uploads automatically become the latest version.
                    </p>
                    <label className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold cursor-pointer transition shadow-md shadow-indigo-600/20">
                      {uploadingResume ? 'Uploading...' : 'Select File to Upload'}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        disabled={uploadingResume}
                        className="hidden"
                      />
                    </label>
                    {resumeUploadError && (
                      <div className="text-xs text-red-400 font-medium">{resumeUploadError}</div>
                    )}
                  </div>

                  {/* Resumes List */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Resume History</h4>
                    {profile.resumes?.map((res: any) => (
                      <div
                        key={res.id}
                        className={`p-4 rounded-xl border flex items-center justify-between ${
                          res.isActive
                            ? 'bg-indigo-950/30 border-indigo-700/60'
                            : 'bg-slate-900/40 border-slate-800'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-sm text-white flex items-center space-x-2">
                            <span>{res.originalFilename}</span>
                            {res.isActive && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
                                Active Version
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            Version v{res.version} • {Math.round(Number(res.sizeBytes) / 1024)} KB • Uploaded {new Date(res.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <a
                            href={`http://localhost:4000/api/v1/resumes/${res.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                          >
                            Download
                          </a>
                          {!res.isActive && (
                            <button
                              onClick={() => handleSetActiveResume(res.id)}
                              className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium"
                            >
                              Make Active
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteResume(res.id)}
                            className="text-xs px-2.5 py-1.5 text-red-400 hover:bg-red-950/40 rounded-lg transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: CAREER PREFERENCES */}
              {activeTab === 'preferences' && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-2xl">
                  <h3 className="font-bold text-white text-base">Placement & Career Preferences</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Preferred Roles</div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {profile.careerPreference?.preferredRoles?.map((r: string) => (
                          <span key={r} className="text-xs px-2.5 py-1 bg-indigo-950/60 border border-indigo-800/40 text-indigo-200 rounded-lg">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400 font-medium">Preferred Locations</div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {profile.careerPreference?.preferredLocations?.map((loc: string) => (
                          <span key={loc} className="text-xs px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg">
                            {loc}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                        <div className="text-xs text-slate-400">Target Minimum CTC</div>
                        <div className="text-base font-bold text-slate-200 mt-0.5">
                          ₹{profile.careerPreference?.minimumSalary?.toLocaleString('en-IN') || '8,00,000'}
                        </div>
                      </div>
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                        <div className="text-xs text-slate-400">Work Mode</div>
                        <div className="text-base font-bold text-indigo-400 mt-0.5">
                          {profile.careerPreference?.workPreference || 'HYBRID'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
