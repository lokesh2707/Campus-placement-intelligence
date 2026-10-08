import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useMobileAuth } from '../context/AuthContext';
import { UserRole } from '@campus-os/shared-types';
import { mobileApi } from '../services/api-client';

export function RoleHomeScreen() {
  const { user, logout } = useMobileAuth();
  const [profile, setProfile] = useState<any>(null);
  const [recruiterData, setRecruiterData] = useState<{ profile: any; company: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isStudent = user?.role === UserRole.STUDENT;
  const isRecruiter = user?.role === UserRole.RECRUITER;

  const loadDashboardData = async () => {
    if (isStudent) {
      try {
        setLoading(true);
        const res = await mobileApi.getStudentProfile();
        if (res.success && res.data) {
          setProfile(res.data);
        }
      } catch {
        // Ignored
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    } else if (isRecruiter) {
      try {
        setLoading(true);
        const res = await mobileApi.getRecruiterMe();
        if (res.success && res.data) {
          setRecruiterData(res.data);
        }
      } catch {
        // Ignored
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getRoleBadgeStyle = (role?: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.PLACEMENT_ADMIN:
        return { bg: '#450a0a', text: '#fca5a5', label: 'Admin Console' };
      case UserRole.DEPARTMENT_COORDINATOR:
        return { bg: '#431407', text: '#fdba74', label: 'Dept Coordinator' };
      case UserRole.RECRUITER:
        return { bg: '#172554', text: '#93c5fd', label: 'Recruiter Hub' };
      default:
        return { bg: '#064e3b', text: '#6ee7b7', label: 'Student Portal' };
    }
  };

  const badge = getRoleBadgeStyle(user?.role);
  const completion = profile?.profileCompletion || { score: 0 };
  const company = recruiterData?.company;
  const recProfile = recruiterData?.profile;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
    >
      {/* Top Header Card */}
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.icon}>{isRecruiter ? '💼' : '🎓'}</Text>
          <View style={styles.headerText}>
            <Text style={styles.title}>Placement Intelligence</Text>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.greeting}>
            Welcome, {user?.firstName} {user?.lastName}!
          </Text>
          <Text style={styles.metaText}>{user?.email}</Text>
          {profile?.department && (
            <Text style={styles.academicSubtitle}>
              {profile.department.name} • {profile.batch?.name || 'Class of 2026'}
            </Text>
          )}
          {isRecruiter && company && (
            <Text style={styles.academicSubtitle}>
              {company.name} • {recProfile?.designation || 'Corporate Recruiter'}
            </Text>
          )}
        </View>
      </View>

      {/* ================= STUDENT NATIVE EXPERIENCE ================= */}
      {isStudent && (
        <>
          {loading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#6366f1" />
              <Text style={styles.loadingText}>Fetching academic records...</Text>
            </View>
          ) : profile ? (
            <>
              {/* Profile Completion Card */}
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.sectionTitle}>Profile Completion</Text>
                  <Text style={styles.completionScore}>{completion.score}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${completion.score}%` }]} />
                </View>

                {/* Completion checklist pills */}
                <View style={styles.checklistRow}>
                  <View style={[styles.pill, completion.basicInfo ? styles.pillDone : styles.pillPending]}>
                    <Text style={styles.pillText}>Basic {completion.basicInfo ? '✓' : '•'}</Text>
                  </View>
                  <View style={[styles.pill, completion.academicInfo ? styles.pillDone : styles.pillPending]}>
                    <Text style={styles.pillText}>Academics {completion.academicInfo ? '✓' : '•'}</Text>
                  </View>
                  <View style={[styles.pill, completion.skills ? styles.pillDone : styles.pillPending]}>
                    <Text style={styles.pillText}>Skills {completion.skills ? '✓' : '•'}</Text>
                  </View>
                  <View style={[styles.pill, completion.resume ? styles.pillDone : styles.pillPending]}>
                    <Text style={styles.pillText}>Resume {completion.resume ? '✓' : '•'}</Text>
                  </View>
                </View>
              </View>

              {/* Academic Overview Card */}
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.sectionTitle}>Academic Status</Text>
                  <View
                    style={[
                      styles.statusTag,
                      profile.verificationStatus === 'VERIFIED'
                        ? styles.statusVerified
                        : profile.verificationStatus === 'REJECTED'
                        ? styles.statusRejected
                        : styles.statusPending,
                    ]}
                  >
                    <Text style={styles.statusTagText}>{profile.verificationStatus}</Text>
                  </View>
                </View>

                <View style={styles.metricsGrid}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>CGPA</Text>
                    <Text style={styles.metricValueHighlight}>{profile.cgpa?.toFixed(2) ?? 'N/A'}</Text>
                  </View>

                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Active Backlogs</Text>
                    <Text
                      style={[
                        styles.metricValue,
                        profile.activeBacklogs > 0 ? styles.textDanger : styles.textSuccess,
                      ]}
                    >
                      {profile.activeBacklogs}
                    </Text>
                  </View>

                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>10th %</Text>
                    <Text style={styles.metricValue}>{profile.tenthPercentage ?? '-'}%</Text>
                  </View>

                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>12th %</Text>
                    <Text style={styles.metricValue}>{profile.twelfthPercentage ?? '-'}%</Text>
                  </View>
                </View>
              </View>

              {/* Skills Tags Card */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Skills Profile</Text>
                <View style={styles.skillChipsContainer}>
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((sk: any) => (
                      <View key={sk.id} style={styles.skillChip}>
                        <Text style={styles.skillChipText}>{sk.skill?.name}</Text>
                        <Text style={styles.skillChipProficiency}>
                          {sk.proficiency.charAt(0)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No skills added yet.</Text>
                  )}
                </View>
              </View>

              {/* Active Resume Card */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Resume Status</Text>
                {profile.resumes && profile.resumes.some((r: any) => r.isActive) ? (
                  (() => {
                    const active = profile.resumes.find((r: any) => r.isActive);
                    return (
                      <View style={styles.resumeBox}>
                        <Text style={styles.resumeFileName}>{active.originalFilename}</Text>
                        <Text style={styles.resumeMeta}>
                          Version {active.version} • Active for applications
                        </Text>
                      </View>
                    );
                  })()
                ) : (
                  <Text style={styles.emptyText}>No active resume file uploaded.</Text>
                )}
              </View>
            </>
          ) : (
            <View style={styles.card}>
              <Text style={styles.emptyText}>No academic student profile record found.</Text>
            </View>
          )}
        </>
      )}

      {/* ================= RECRUITER NATIVE EXPERIENCE (PHASE 4) ================= */}
      {isRecruiter && (
        <>
          {loading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#3b82f6" />
              <Text style={styles.loadingText}>Fetching corporate profile...</Text>
            </View>
          ) : company ? (
            <>
              {/* Corporate Overview Card */}
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.sectionTitle}>Employer Accreditation</Text>
                  <View
                    style={[
                      styles.statusTag,
                      company.verificationStatus === 'VERIFIED'
                        ? styles.statusVerified
                        : styles.statusPending,
                    ]}
                  >
                    <Text style={styles.statusTagText}>{company.verificationStatus}</Text>
                  </View>
                </View>

                <View style={styles.metricsGrid}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Industry</Text>
                    <Text style={styles.metricValue}>{company.industry}</Text>
                  </View>

                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Scale</Text>
                    <Text style={styles.metricValue}>{company.companySize}</Text>
                  </View>

                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Headquarters</Text>
                    <Text style={styles.metricValue}>{company.headquarters || 'Remote'}</Text>
                  </View>

                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Website</Text>
                    <Text style={styles.metricValue}>{company.website ? 'Linked' : 'None'}</Text>
                  </View>
                </View>
              </View>

              {/* Recruiter Credentials Card */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Recruiter Credentials</Text>
                <View style={styles.recruiterBox}>
                  <Text style={styles.recruiterName}>
                    {user?.firstName} {user?.lastName}
                  </Text>
                  <Text style={styles.recruiterMeta}>
                    {recProfile?.designation || 'Corporate Recruiter'} • {recProfile?.department || 'Talent Acquisition'}
                  </Text>
                  <Text style={styles.recruiterEmail}>{recProfile?.workEmail || user?.email}</Text>
                </View>
              </View>

              {/* Corporate Contacts Summary */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Authorized Contacts</Text>
                {company.contacts && company.contacts.length > 0 ? (
                  company.contacts.map((c: any) => (
                    <View key={c.id} style={styles.contactItem}>
                      <Text style={styles.contactName}>{c.name} ({c.contactType})</Text>
                      <Text style={styles.contactDetail}>{c.email} • {c.designation || 'Staff'}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No secondary contacts listed.</Text>
                )}
              </View>

              {/* Hiring Preferences Card */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Target Hiring Benchmarks</Text>
                <View style={styles.metricsGrid}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Min CGPA</Text>
                    <Text style={styles.metricValueHighlight}>
                      {company.hiringPreference?.minimumCgpa?.toFixed(2) ?? 'None'}
                    </Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Max Backlogs</Text>
                    <Text style={styles.metricValue}>
                      {company.hiringPreference?.maximumBacklogs ?? 'Any'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Placement Activity Placeholder */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Campus Recruitment Activity</Text>
                <Text style={styles.emptyText}>
                  No active placement drives scheduled. Job opening and candidate shortlisting features will be available in the upcoming placement workflow modules.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.card}>
              <Text style={styles.emptyText}>No corporate account linked yet.</Text>
            </View>
          )}
        </>
      )}

      {/* Sign Out Button */}
      <TouchableOpacity onPress={() => logout()} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  section: {
    marginTop: 8,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  academicSubtitle: {
    fontSize: 12,
    color: '#38bdf8',
    marginTop: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 4,
  },
  checklistRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillDone: {
    backgroundColor: '#064e3b',
  },
  pillPending: {
    backgroundColor: '#1e293b',
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusVerified: {
    backgroundColor: '#064e3b',
    borderColor: '#059669',
  },
  statusPending: {
    backgroundColor: '#451a03',
    borderColor: '#d97706',
  },
  statusRejected: {
    backgroundColor: '#450a0a',
    borderColor: '#dc2626',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#f8fafc',
    textTransform: 'uppercase',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  metricBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#090d16',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 2,
  },
  metricValueHighlight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginTop: 2,
  },
  textDanger: {
    color: '#f87171',
  },
  textSuccess: {
    color: '#34d399',
  },
  skillChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  skillChipText: {
    fontSize: 11,
    color: '#e2e8f0',
  },
  skillChipProficiency: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  resumeBox: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  resumeFileName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f8fafc',
  },
  resumeMeta: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  recruiterBox: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
  },
  recruiterName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  recruiterMeta: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  recruiterEmail: {
    fontSize: 11,
    color: '#38bdf8',
    marginTop: 4,
  },
  contactItem: {
    backgroundColor: '#090d16',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 6,
  },
  contactName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f8fafc',
  },
  contactDetail: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 12,
  },
  logoutBtn: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoutText: {
    color: '#f87171',
    fontWeight: '600',
    fontSize: 14,
  },
});
