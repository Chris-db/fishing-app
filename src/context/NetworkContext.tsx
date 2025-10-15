import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Network from 'expo-network';
import { offlineStorage } from '../utils/offlineStorage';

interface NetworkContextType {
  isConnected: boolean;
  isOnline: boolean;
  pendingSyncCount: number;
  lastSyncTime: string | null;
  syncInProgress: boolean;
  syncOfflineData: () => Promise<void>;
  checkConnection: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncInProgress, setSyncInProgress] = useState<boolean>(false);

  // Check network connection
  const checkConnection = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      const connected = networkState.isConnected && networkState.isInternetReachable;
      
      setIsConnected(networkState.isConnected || false);
      setIsOnline(connected || false);
      
      // Update pending sync count
      if (connected) {
        const pendingCatches = await offlineStorage.getPendingCatches();
        setPendingSyncCount(pendingCatches.length);
      }
    } catch (error) {
      console.error('Failed to check network connection:', error);
      setIsConnected(false);
      setIsOnline(false);
    }
  };

  // Sync offline data when connection is restored
  const syncOfflineData = async () => {
    if (!isOnline || syncInProgress) return;

    setSyncInProgress(true);
    
    try {
      const pendingCatches = await offlineStorage.getPendingCatches();
      
      for (const catchData of pendingCatches) {
        try {
          // Here you would sync with your backend
          // For now, we'll just mark as synced
          await offlineStorage.markCatchAsSynced(catchData.id);
        } catch (error) {
          console.error('Failed to sync catch:', catchData.id, error);
        }
      }

      // Clean up synced catches
      await offlineStorage.removeSyncedCatches();
      
      // Update sync time
      setLastSyncTime(new Date().toISOString());
      setPendingSyncCount(0);
      
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    } finally {
      setSyncInProgress(false);
    }
  };

  // Monitor network state changes
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const startMonitoring = () => {
      checkConnection();
      interval = setInterval(checkConnection, 5000); // Check every 5 seconds
    };

    startMonitoring();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  // Auto-sync when connection is restored
  useEffect(() => {
    if (isOnline && pendingSyncCount > 0) {
      const syncTimer = setTimeout(() => {
        syncOfflineData();
      }, 2000); // Wait 2 seconds after connection is restored

      return () => clearTimeout(syncTimer);
    }
  }, [isOnline, pendingSyncCount]);

  const contextValue: NetworkContextType = {
    isConnected,
    isOnline,
    pendingSyncCount,
    lastSyncTime,
    syncInProgress,
    syncOfflineData,
    checkConnection,
  };

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
