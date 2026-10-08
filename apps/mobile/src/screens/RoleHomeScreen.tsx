import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useMobileAuth } from '../context/AuthContext';
import { UserRole } from '@campus-os/shared-types';

export function RoleHomeScreen() {
  const { user, logout } = useMobileAuth();

  const getRoleBadgeStyle = (role?: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.PLACEMENT_ADMIN:
        return { bg: '#450a0a', text: '#fca5a5', label: 'Admin Console' };
      case UserRole.RECRUITER:
        return { bg: '#172554', text: '#93c5fd', label: 'Recruiter Hub' };
      default:
        return { bg: '#064e3b', text: '#6ee7b7', label: 'Student Portal' };
    }
  };

  const badge = getRoleBadgeStyle(user?.role);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.icon}>📱</Text>
          <Text style={styles.title}>Placement Mobile</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.greeting}>
            Welcome, {user?.firstName} {user?.lastName}!
          </Text>
          <Text style={styles.metaText}>{user?.email}</Text>
          <Text style={styles.metaRole}>Role: {user?.role}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Session Status</Text>
          <Text style={styles.infoText}>✓ JWT Access Token Verified</Text>
          <Text style={styles.infoText}>✓ Refresh Token Securely Stored</Text>
          <Text style={styles.infoText}>✓ Role-Based Route Active</Text>
        </View>

        <TouchableOpacity onPress={() => logout()} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#090d16',
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 32,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 2,
  },
  metaRole: {
    fontSize: 12,
    fontWeight: '600',
    color: '#818cf8',
    fontFamily: 'monospace',
  },
  infoBox: {
    backgroundColor: '#1e293b/60',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  logoutBtn: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 13,
  },
});
