import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { mobileApi, MobileApiError } from '../services/api-client';
import { ServiceHealth, ServiceReadiness } from '@campus-os/shared-types';

export function FoundationScreen() {
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [readiness, setReadiness] = useState<ServiceReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [hRes, rRes] = await Promise.all([
        mobileApi.get<ServiceHealth>('/health'),
        mobileApi.get<ServiceReadiness>('/health/ready'),
      ]);
      setHealth(hRes.data);
      setReadiness(rRes.data);
    } catch (err: any) {
      if (err instanceof MobileApiError) {
        setError(`${err.code}: ${err.message}`);
      } else {
        setError(err.message || 'Cannot connect to backend API');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Phase 1 Mobile Foundation</Text>
          </View>
          <Text style={styles.title}>Campus Placement</Text>
          <Text style={styles.subtitle}>Student Mobile App Shell</Text>
        </View>

        {/* Running confirmation card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Application Status</Text>
          <Text style={styles.cardBody}>
            React Native + Expo mobile client is running successfully with TypeScript.
          </Text>
        </View>

        {/* Backend API status card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeader}>Backend Connectivity</Text>
            {loading && <ActivityIndicator size="small" color="#38bdf8" />}
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.hintText}>Ensure backend is running at http://localhost:4000</Text>
            </View>
          )}

          {health && (
            <View style={styles.statusGrid}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>API Service:</Text>
                <Text style={styles.statusValueSuccess}>{health.service} ({health.status})</Text>
              </View>

              {readiness && (
                <>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Database:</Text>
                    <Text
                      style={
                        readiness.checks.database.status === 'connected'
                          ? styles.statusValueSuccess
                          : styles.statusValueWarn
                      }
                    >
                      {readiness.checks.database.status}
                    </Text>
                  </View>

                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Redis:</Text>
                    <Text style={styles.statusValueMuted}>{readiness.checks.redis.status}</Text>
                  </View>

                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>AI/ML Engine:</Text>
                    <Text
                      style={
                        readiness.checks.mlService.status === 'available'
                          ? styles.statusValueSuccess
                          : styles.statusValueMuted
                      }
                    >
                      {readiness.checks.mlService.status}
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.refreshButton} onPress={fetchStatus} disabled={loading}>
            <Text style={styles.refreshButtonText}>
              {loading ? 'Testing Connection...' : 'Re-test API Connection'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Navigation architecture notice */}
        <View style={styles.cardMuted}>
          <Text style={styles.cardMutedHeader}>Role-Based Architecture</Text>
          <Text style={styles.cardMutedBody}>
            Navigation state is decoupled and ready for Student (drives, applications, profile) and
            Recruiter/Admin screens in subsequent phases.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  container: {
    padding: 20,
    gap: 16,
  },
  header: {
    marginTop: 10,
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  badgeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  cardBody: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '500',
  },
  hintText: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 4,
  },
  statusGrid: {
    gap: 6,
    marginVertical: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statusValueSuccess: {
    fontSize: 12,
    color: '#34d399',
    fontWeight: '600',
  },
  statusValueWarn: {
    fontSize: 12,
    color: '#fbbf24',
    fontWeight: '600',
  },
  statusValueMuted: {
    fontSize: 12,
    color: '#64748b',
  },
  refreshButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  cardMuted: {
    backgroundColor: '#070b14',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#172033',
    gap: 4,
  },
  cardMutedHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  cardMutedBody: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
});
