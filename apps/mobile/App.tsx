import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MobileApiClient } from './src/services/api';
import { SystemHealthStatus } from '@campus-os/shared-types';

export default function App() {
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    MobileApiClient.getHealth()
      .then((res) => {
        setHealth(res.data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Campus Placement</Text>
          <Text style={styles.subtitle}>Student Intelligence Portal</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mobile Architecture Foundation</Text>
          <Text style={styles.cardDescription}>
            Consumes the unified Node.js API with zero separate backend logic. Designed for students
            to browse drives, monitor eligibility, and receive AI placement coaching.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Backend API Status</Text>
          {loading && <ActivityIndicator color="#38bdf8" style={styles.spinner} />}
          {error && (
            <Text style={styles.statusError}>Backend unavailable (start API at :4000)</Text>
          )}
          {health && (
            <View style={styles.healthContainer}>
              <Text style={styles.statusOk}>System Status: {health.status.toUpperCase()}</Text>
              <Text style={styles.statusDetail}>
                Database: {health.services.database.status}
              </Text>
              <Text style={styles.statusDetail}>
                AI Engine: {health.services.mlService.status}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  content: {
    padding: 24,
    gap: 16,
  },
  header: {
    marginVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#38bdf8',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },
  spinner: {
    marginTop: 8,
  },
  statusOk: {
    fontSize: 14,
    color: '#34d399',
    fontWeight: '600',
  },
  statusError: {
    fontSize: 13,
    color: '#f87171',
  },
  healthContainer: {
    gap: 4,
    marginTop: 4,
  },
  statusDetail: {
    fontSize: 12,
    color: '#cbd5e1',
  },
});
