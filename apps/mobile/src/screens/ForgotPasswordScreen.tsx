import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { mobileApi } from '../services/api-client';

interface ForgotPasswordScreenProps {
  onNavigateLogin: () => void;
}

export function ForgotPasswordScreen({ onNavigateLogin }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleForgot = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await mobileApi.post('/api/v1/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>🔑</Text>
        <Text style={styles.title}>Password Recovery</Text>
        <Text style={styles.subtitle}>Reset your campus portal password</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {submitted ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              If an account exists for {email}, instructions have been sent. Check your inbox.
            </Text>
            <TouchableOpacity onPress={onNavigateLogin} style={[styles.button, { marginTop: 16 }]}>
              <Text style={styles.buttonText}>Return to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Registered Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="student@campus.edu"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <TouchableOpacity
              onPress={handleForgot}
              disabled={loading}
              style={[styles.button, loading && styles.buttonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={onNavigateLogin} style={styles.switchBtn}>
              <Text style={styles.linkText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
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
  icon: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    color: '#f87171',
    backgroundColor: '#450a0a',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 12,
    textAlign: 'center',
  },
  successBox: {
    padding: 16,
    backgroundColor: '#064e3b',
    borderRadius: 8,
  },
  successText: {
    color: '#a7f3d0',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#d97706',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  switchBtn: {
    marginTop: 18,
    alignItems: 'center',
  },
  linkText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '600',
  },
});
