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
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isStudent = user?.role === UserRole.STUDENT;

  const loadStudentProfile = async () => {
    if (!isStudent) return;
    try {
      setLoading(true);
      const res = await mobileApi.getStudentProfile();
      if (res.success && res.data) {
        setProfile(res.data);
      }
    } catch {
      // Ignored if 404 or network issue
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudentProfile();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStudentProfile();
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
    >
      {/* Top Header Card */}
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.icon}>🎓</Text>
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
        </View>
      </View>

      {/* Student Native Experience */}
      {isStudent && (
        <>
          {loading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#6366f1" size="small" />
              <Text style={styles.loadingText}>Loading profile data...</Text>
            </View>
          ) : profile ? (
            <>
              {/* Profile Completion Card */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.sectionTitle}>Profile Completion</Text>
                  <Text style={styles.completionScore}>{completion.score}%</Text>
                </View>

                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${completion.score}%` }]} />
                </View>

                <View style={styles.milestoneGrid}>
                  <Text style={styles.milestoneItem}>
                    {completion.basicInfo ? '✓' : '○'} Basic Info
                  </Text>
                  <Text style={styles.milestoneItem}>
                    {completion.academicInfo ? '✓' : '○'} Academic
                  </Text>
                  <Text style={styles.milestoneItem}>
                    {completion.skills ? '✓' : '○'} Skills (3+)
                  </Text>
                  <Text style={styles.milestoneItem}>
                    {completion.resume ? '✓' : '○'} Resume
                  </Text>
                </View>
              </View>

              {/* Academic Summary Card */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.sectionTitle}>Academic Summary</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          profile.verificationStatus === 'VERIFIED' ? '#064e3b' : '#451a03',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color:
                            profile.verificationStatus === 'VERIFIED' ? '#6ee7b7' : '#fcd34d',
                        },
                      ]}
                    >
                      {profile.verificationStatus}
                    </Text>
                  </View>
                </View>

                <View style={styles.metricGrid}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>CGPA</Text>
                    <Text style={styles.metricValue}>
                      {profile.cgpa ? Number(profile.cgpa).toFixed(2) : 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Backlogs</Text>
                    <Text
                      style={[
                        styles.metricValue,
                        { color: profile.activeBacklogs > 0 ? '#f59e0b' : '#10b981' },
                      ]}
                    >
                      {profile.activeBacklogs ?? 0}
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
    paddingTop: 48,
    gap: 16,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
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
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    marginTop: 4,
  },
  greeting: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  academicSubtitle: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  completionScore: {
    color: '#818cf8',
    fontSize: 16,
    fontWeight: '800',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  milestoneGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  milestoneItem: {
    color: '#94a3b8',
    fontSize: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#090d16',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  skillChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1b4b',
    borderColor: '#3730a3',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  skillChipText: {
    color: '#e0e7ff',
    fontSize: 11,
    fontWeight: '500',
  },
  skillChipProficiency: {
    color: '#818cf8',
    fontSize: 9,
    fontWeight: '700',
  },
  resumeBox: {
    backgroundColor: '#090d16',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  resumeFileName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  resumeMeta: {
    color: '#10b981',
    fontSize: 11,
    marginTop: 2,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 6,
  },
  loadingBox: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8,
  },
  logoutBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '600',
  },
});
