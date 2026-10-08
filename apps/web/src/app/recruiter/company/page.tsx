'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import { apiClient } from '../../../services/api-client';
import { UserRole } from '@campus-os/shared-types';
import Link from 'next/link';

export default function RecruiterCompanyWorkspacePage() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<{ profile: any; company: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'documents' | 'preferences'>('overview');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Form states
  const [editProfile, setEditProfile] = useState<any>({});
  const [newContact, setNewContact] = useState({ name: '', designation: '', email: '', phone: '', contactType: 'HR', isPrimary: false });
  const [editPrefs, setEditPrefs] = useState({ minimumCgpa: 7.0, maximumBacklogs: 0, preferredWorkModes: ['ONSITE'] });
  const [docType, setDocType] = useState('REGISTRATION_CERTIFICATE');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getRecruiterMe();
      if (res.success && res.data) {
        setData(res.data);
        setEditProfile({
          name: res.data.company?.name || '',
          description: res.data.company?.description || '',
          website: res.data.company?.website || '',
          headquarters: res.data.company?.headquarters || '',
          contactEmail: res.data.company?.contactEmail || '',
          contactPhone: res.data.company?.contactPhone || '',
        });
        if (res.data.company?.hiringPreference) {
          setEditPrefs({
            minimumCgpa: res.data.company.hiringPreference.minimumCgpa ?? 7.0,
            maximumBacklogs: res.data.company.hiringPreference.maximumBacklogs ?? 0,
            preferredWorkModes: res.data.company.hiringPreference.preferredWorkModes || ['ONSITE'],
          });
        }
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const company = data?.company;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    try {
      setStatusMsg(null);
      await apiClient.updateCompany(company.id, editProfile);
      setStatusMsg('Company profile details successfully updated.');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update company');
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    try {
      setStatusMsg(null);
      await apiClient.createCompanyContact(company.id, newContact);
      setNewContact({ name: '', designation: '', email: '', phone: '', contactType: 'HR', isPrimary: false });
      setStatusMsg('Institutional contact created.');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add contact');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!company) return;
    try {
      await apiClient.deleteCompanyContact(company.id, contactId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete contact');
    }
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!company || !e.target.files?.[0]) return;
    try {
      setUploadingDoc(true);
      setStatusMsg(null);
      await apiClient.uploadCompanyDocument(company.id, e.target.files[0], docType);
      setStatusMsg('Compliance document uploaded for university administrative verification.');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    try {
      setStatusMsg(null);
      await apiClient.updateCompanyPreferences(company.id, {
        minimumCgpa: parseFloat(String(editPrefs.minimumCgpa)),
        maximumBacklogs: parseInt(String(editPrefs.maximumBacklogs), 10),
        preferredWorkModes: editPrefs.preferredWorkModes,
      });
      setStatusMsg('Company recruitment criteria updated.');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update preferences');
    }
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.RECRUITER]}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Header */}
        <header className="border-b border-blue-900/40 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/recruiter" className="text-sm text-slate-400 hover:text-white transition">
                ← Back to Dashboard
              </Link>
              <span className="text-slate-600">|</span>
              <span className="font-bold text-lg tracking-tight text-white">Company Workspace</span>
            </div>

            <div className="flex items-center space-x-4">
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
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-mono">Loading company workspace...</div>
          ) : !company ? (
            <div className="p-8 text-center text-slate-500">No company profile associated with this account.</div>
          ) : (
            <>
              {/* Workspace Header */}
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    {company.name}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        company.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {company.verificationStatus}
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400">{company.industry} • {company.headquarters || 'Remote'}</p>
                </div>

                {statusMsg && (
                  <div className="px-4 py-2 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-semibold">
                    ✓ {statusMsg}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-800 pb-3 space-x-2 text-xs">
                {(['overview', 'contacts', 'documents', 'preferences'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl capitalize font-semibold transition ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab 1: Profile Editing */}
              {activeTab === 'overview' && (
                <form onSubmit={handleUpdateProfile} className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4 text-xs">
                  <h3 className="font-bold text-sm text-slate-200">Company Profile Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 block mb-1">Company Display Name</label>
                      <input
                        type="text"
                        value={editProfile.name}
                        onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Website URL</label>
                      <input
                        type="url"
                        value={editProfile.website}
                        onChange={(e) => setEditProfile({ ...editProfile, website: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Headquarters Location</label>
                      <input
                        type="text"
                        value={editProfile.headquarters}
                        onChange={(e) => setEditProfile({ ...editProfile, headquarters: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Official Contact Email</label>
                      <input
                        type="email"
                        value={editProfile.contactEmail}
                        onChange={(e) => setEditProfile({ ...editProfile, contactEmail: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Company Bio & Overview</label>
                    <textarea
                      rows={4}
                      value={editProfile.description}
                      onChange={(e) => setEditProfile({ ...editProfile, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition"
                  >
                    Save Changes
                  </button>
                </form>
              )}

              {/* Tab 2: Contacts */}
              {activeTab === 'contacts' && (
                <div className="space-y-6 text-xs">
                  {/* Create contact */}
                  <form onSubmit={handleAddContact} className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
                    <h3 className="font-bold text-sm text-slate-200">Add Corporate Contact</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Name"
                        value={newContact.name}
                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Designation"
                        value={newContact.designation}
                        onChange={(e) => setNewContact({ ...newContact, designation: e.target.value })}
                        className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="email"
                        required
                        placeholder="Email"
                        value={newContact.email}
                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                        className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition"
                    >
                      Add Contact
                    </button>
                  </form>

                  {/* List contacts */}
                  <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
                    <h3 className="font-bold text-sm text-slate-200">Existing Contacts</h3>
                    {company.contacts?.length === 0 ? (
                      <p className="text-slate-500">No contacts registered.</p>
                    ) : (
                      company.contacts?.map((ct: any) => (
                        <div key={ct.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-200">{ct.name} ({ct.contactType})</div>
                            <div className="text-slate-400 text-[11px]">{ct.email} • {ct.designation || 'Staff'}</div>
                          </div>
                          <button
                            onClick={() => handleDeleteContact(ct.id)}
                            className="px-2.5 py-1 bg-red-950 border border-red-800 text-red-300 rounded hover:bg-red-900 text-[11px]"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Documents */}
              {activeTab === 'documents' && (
                <div className="space-y-6 text-xs">
                  {/* Upload */}
                  <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
                    <h3 className="font-bold text-sm text-slate-200">Upload Compliance Document</h3>
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none"
                      >
                        <option value="REGISTRATION_CERTIFICATE">Certificate of Incorporation</option>
                        <option value="COMPANY_PAN">Company PAN Card</option>
                        <option value="GST_CERTIFICATE">GST Certificate</option>
                        <option value="AUTHORIZATION_LETTER">Campus Placement Authorization</option>
                        <option value="OTHER">Other Compliance Document</option>
                      </select>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.docx"
                        onChange={handleUploadDocument}
                        disabled={uploadingDoc}
                        className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Documents List */}
                  <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
                    <h3 className="font-bold text-sm text-slate-200">Uploaded Compliance Documents</h3>
                    {company.documents?.length === 0 ? (
                      <p className="text-slate-500">No documents uploaded.</p>
                    ) : (
                      company.documents?.map((d: any) => (
                        <div key={d.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-200">{d.fileName}</div>
                            <div className="text-slate-400 text-[11px]">{d.documentType} • {(Number(d.fileSize) / 1024).toFixed(1)} KB</div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              d.verificationStatus === 'VERIFIED'
                                ? 'bg-emerald-950 text-emerald-400'
                                : 'bg-amber-950 text-amber-400'
                            }`}
                          >
                            {d.verificationStatus}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Hiring Preferences */}
              {activeTab === 'preferences' && (
                <form onSubmit={handleUpdatePreferences} className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4 text-xs">
                  <h3 className="font-bold text-sm text-slate-200">Recruitment & Eligibility Benchmarks</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 block mb-1">Minimum CGPA Requirement</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={editPrefs.minimumCgpa}
                        onChange={(e) => setEditPrefs({ ...editPrefs, minimumCgpa: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Maximum Permitted Active Backlogs</label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={editPrefs.maximumBacklogs}
                        onChange={(e) => setEditPrefs({ ...editPrefs, maximumBacklogs: parseInt(e.target.value, 10) })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition"
                  >
                    Save Preferences
                  </button>
                </form>
              )}
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
