import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { MobileAuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <MobileAuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </MobileAuthProvider>
  );
}
