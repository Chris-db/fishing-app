import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PREMIUM_FEATURES, isFeatureAvailable, getFeatureUsageText } from '../constants/premiumFeatures';

interface PremiumContextType {
  isPremium: boolean;
  featureUsage: { [key: string]: number };
  checkFeatureAccess: (featureId: string) => boolean;
  getFeatureUsageInfo: (featureId: string) => string;
  useFeature: (featureId: string) => boolean;
  resetMonthlyUsage: () => void;
  upgradeToPremium: () => Promise<void>;
  downgradeToFree: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

interface PremiumProviderProps {
  children: ReactNode;
}

export const PremiumProvider: React.FC<PremiumProviderProps> = ({ children }) => {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [featureUsage, setFeatureUsage] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadPremiumStatus();
    loadFeatureUsage();
  }, []);

  const loadPremiumStatus = async () => {
    try {
      // In a real app, this would check with your backend
      // For now, we'll use local storage simulation
      const premiumStatus = localStorage.getItem('premium_status');
      setIsPremium(premiumStatus === 'true');
    } catch (error) {
      console.error('Failed to load premium status:', error);
    }
  };

  const loadFeatureUsage = async () => {
    try {
      // In a real app, this would come from your backend
      // For now, we'll use local storage simulation
      const usage = localStorage.getItem('feature_usage');
      if (usage) {
        setFeatureUsage(JSON.parse(usage));
      }
    } catch (error) {
      console.error('Failed to load feature usage:', error);
    }
  };

  const savePremiumStatus = async (premium: boolean) => {
    try {
      localStorage.setItem('premium_status', premium.toString());
      setIsPremium(premium);
    } catch (error) {
      console.error('Failed to save premium status:', error);
    }
  };

  const saveFeatureUsage = async (usage: { [key: string]: number }) => {
    try {
      localStorage.setItem('feature_usage', JSON.stringify(usage));
      setFeatureUsage(usage);
    } catch (error) {
      console.error('Failed to save feature usage:', error);
    }
  };

  const checkFeatureAccess = (featureId: string): boolean => {
    const currentUsage = featureUsage[featureId] || 0;
    return isFeatureAvailable(featureId, isPremium, currentUsage);
  };

  const getFeatureUsageInfo = (featureId: string): string => {
    const currentUsage = featureUsage[featureId] || 0;
    return getFeatureUsageText(featureId, isPremium, currentUsage);
  };

  const useFeature = (featureId: string): boolean => {
    if (!checkFeatureAccess(featureId)) {
      return false;
    }

    const feature = PREMIUM_FEATURES.find(f => f.id === featureId);
    if (!feature) return false;

    // If it's a free feature with usage limits, increment usage
    if (feature.isFree && feature.freeUsageLimit && !isPremium) {
      const newUsage = { ...featureUsage };
      newUsage[featureId] = (newUsage[featureId] || 0) + 1;
      saveFeatureUsage(newUsage);
    }

    return true;
  };

  const resetMonthlyUsage = () => {
    // This would typically be called by a scheduled job or on app startup
    // For demo purposes, we'll reset all usage
    const resetUsage: { [key: string]: number } = {};
    PREMIUM_FEATURES.forEach(feature => {
      if (feature.isFree && feature.freeUsageLimit) {
        resetUsage[feature.id] = 0;
      }
    });
    saveFeatureUsage(resetUsage);
  };

  const upgradeToPremium = async () => {
    try {
      // In a real app, this would integrate with payment processing
      // For demo purposes, we'll just set the status
      await savePremiumStatus(true);
      console.log('Upgraded to Premium!');
    } catch (error) {
      console.error('Failed to upgrade to premium:', error);
      throw error;
    }
  };

  const downgradeToFree = async () => {
    try {
      // In a real app, this would handle subscription cancellation
      await savePremiumStatus(false);
      console.log('Downgraded to Free');
    } catch (error) {
      console.error('Failed to downgrade to free:', error);
      throw error;
    }
  };

  const contextValue: PremiumContextType = {
    isPremium,
    featureUsage,
    checkFeatureAccess,
    getFeatureUsageInfo,
    useFeature,
    resetMonthlyUsage,
    upgradeToPremium,
    downgradeToFree,
  };

  return (
    <PremiumContext.Provider value={contextValue}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = (): PremiumContextType => {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};
