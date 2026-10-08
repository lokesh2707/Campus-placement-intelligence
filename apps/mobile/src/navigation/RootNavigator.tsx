import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { UnauthRouteName } from './types';
import { useMobileAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { RoleHomeScreen } from '../screens/RoleHomeScreen';

export function RootNavigator() {
  const { user, loading, isAuthenticated } = useMobileAuth();
  const [unauthRoute, setUnauthRoute] = useState<UnauthRouteName>('Login');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isAuthenticated && user ? (
        <RoleHomeScreen />
      ) : unauthRoute === 'Login' ? (
        <LoginScreen
          onNavigateRegister={() => setUnauthRoute('Register')}
          onNavigateForgotPassword={() => setUnauthRoute('ForgotPassword')}
        />
      ) : unauthRoute === 'Register' ? (
        <RegisterScreen onNavigateLogin={() => setUnauthRoute('Login')} />
      ) : (
        <ForgotPasswordScreen onNavigateLogin={() => setUnauthRoute('Login')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#090d16',
  },
});
