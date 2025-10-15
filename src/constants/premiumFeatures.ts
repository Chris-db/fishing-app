export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'analytics' | 'offline' | 'export' | 'support' | 'customization';
  isFree: boolean;
  freeUsageLimit?: number;
  currentUsage?: number;
}

export interface PremiumTier {
  id: 'free' | 'premium';
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  description: string;
}

export const PREMIUM_FEATURES: PremiumFeature[] = [
  // Analytics Features
  {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Detailed fishing patterns, success rate tracking, and predictive insights',
    icon: 'analytics',
    category: 'analytics',
    isFree: false,
  },
  {
    id: 'weather_history',
    name: 'Historical Weather Data',
    description: 'Access to 3+ years of weather data for better pattern analysis',
    icon: 'cloud',
    category: 'analytics',
    isFree: false,
  },
  {
    id: 'fishing_predictions',
    name: 'Fishing Predictions',
    description: 'AI-powered predictions for best fishing times and conditions',
    icon: 'bulb',
    category: 'analytics',
    isFree: false,
  },

  // Offline Features
  {
    id: 'offline_maps',
    name: 'Offline Maps',
    description: 'Download maps for offline use in remote fishing locations',
    icon: 'map',
    category: 'offline',
    isFree: false,
  },
  {
    id: 'unlimited_offline_catches',
    name: 'Unlimited Offline Catches',
    description: 'Store unlimited catches offline (free tier: 50 catches)',
    icon: 'cloud-offline',
    category: 'offline',
    isFree: false,
    freeUsageLimit: 50,
  },

  // Export Features
  {
    id: 'data_export',
    name: 'Data Export',
    description: 'Export your catch data to CSV, PDF, or other formats',
    icon: 'download',
    category: 'export',
    isFree: false,
  },
  {
    id: 'detailed_reports',
    name: 'Detailed Reports',
    description: 'Generate comprehensive fishing reports and statistics',
    icon: 'document-text',
    category: 'export',
    isFree: false,
  },

  // Support Features
  {
    id: 'priority_support',
    name: 'Priority Support',
    description: 'Get faster response times and priority customer support',
    icon: 'headset',
    category: 'support',
    isFree: false,
  },
  {
    id: 'beta_features',
    name: 'Early Access',
    description: 'Get early access to new features and beta testing',
    icon: 'rocket',
    category: 'support',
    isFree: false,
  },

  // Customization Features
  {
    id: 'custom_spot_markers',
    name: 'Custom Spot Markers',
    description: 'Create and manage custom fishing spot markers on maps',
    icon: 'location',
    category: 'customization',
    isFree: false,
  },
  {
    id: 'advanced_units',
    name: 'Advanced Units',
    description: 'More unit options and custom unit conversions',
    icon: 'settings',
    category: 'customization',
    isFree: false,
  },

  // Free Features (with limits)
  {
    id: 'basic_analytics',
    name: 'Basic Analytics',
    description: 'Simple catch statistics and basic insights',
    icon: 'stats-chart',
    category: 'analytics',
    isFree: true,
    freeUsageLimit: 3, // 3 free uses per month
  },
  {
    id: 'basic_export',
    name: 'Basic Export',
    description: 'Export last 10 catches to CSV',
    icon: 'download-outline',
    category: 'export',
    isFree: true,
    freeUsageLimit: 1, // 1 free export per month
  },
];

export const PREMIUM_TIERS: PremiumTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      'Unlimited catch logging',
      'Basic weather data',
      'Social features',
      'Basic analytics (3 uses/month)',
      'Basic export (1 use/month)',
      '50 offline catches',
    ],
    description: 'Perfect for casual anglers who want to track their catches',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: {
      monthly: 2.99,
      yearly: 19.99,
    },
    features: [
      'Everything in Free',
      'Advanced analytics & predictions',
      'Historical weather data (3+ years)',
      'Unlimited offline catches',
      'Offline maps',
      'Data export (CSV, PDF)',
      'Custom spot markers',
      'Priority support',
      'Early access to new features',
      'Ad-free experience',
    ],
    description: 'For serious anglers who want the complete fishing experience',
  },
];

export const getFeatureById = (id: string): PremiumFeature | undefined => {
  return PREMIUM_FEATURES.find(feature => feature.id === id);
};

export const getFreeFeatures = (): PremiumFeature[] => {
  return PREMIUM_FEATURES.filter(feature => feature.isFree);
};

export const getPremiumFeatures = (): PremiumFeature[] => {
  return PREMIUM_FEATURES.filter(feature => !feature.isFree);
};

export const getFeaturesByCategory = (category: string): PremiumFeature[] => {
  return PREMIUM_FEATURES.filter(feature => feature.category === category);
};

export const isFeatureAvailable = (featureId: string, isPremium: boolean, currentUsage?: number): boolean => {
  const feature = getFeatureById(featureId);
  if (!feature) return false;

  if (feature.isFree) {
    if (isPremium) return true;
    if (feature.freeUsageLimit && currentUsage !== undefined) {
      return currentUsage < feature.freeUsageLimit;
    }
    return true;
  }

  return isPremium;
};

export const getFeatureUsageText = (featureId: string, isPremium: boolean, currentUsage?: number): string => {
  const feature = getFeatureById(featureId);
  if (!feature) return '';

  if (feature.isFree && !isPremium && feature.freeUsageLimit) {
    const remaining = feature.freeUsageLimit - (currentUsage || 0);
    if (remaining <= 0) {
      return 'Upgrade to Premium for unlimited access';
    }
    return `${remaining} free uses remaining this month`;
  }

  if (!feature.isFree && !isPremium) {
    return 'Premium feature - Upgrade to access';
  }

  return 'Available';
};
