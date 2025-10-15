import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { UnitsProvider } from './src/context/UnitsContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { PremiumProvider } from './src/context/PremiumContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <UnitsProvider>
        <NetworkProvider>
          <PremiumProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </PremiumProvider>
        </NetworkProvider>
      </UnitsProvider>
    </AuthProvider>
  );
}
