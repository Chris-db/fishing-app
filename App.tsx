import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { UnitsProvider } from './src/context/UnitsContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <UnitsProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </UnitsProvider>
    </AuthProvider>
  );
}
