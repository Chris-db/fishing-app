// Supabase configuration (disabled for development)
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

export const WEATHER_API_KEY = '2a5bad6fe673c89afe38d0f1cd066760'; // Replace with your OpenWeatherMap API key
export const SOLUNAR_API_KEY = 'YOUR_SOLUNAR_API_KEY'; // Replace with your Solunar API key

export const APP_COLORS = {
  primary: '#2E7D32',
  secondary: '#4CAF50',
  accent: '#81C784',
  background: '#F1F8E9',
  surface: '#FFFFFF',
  text: '#1B5E20',
  textSecondary: '#4CAF50',
  error: '#D32F2F',
  warning: '#FF9800',
  success: '#4CAF50',
};

export const FISHING_CONDITIONS = {
  EXCELLENT: { rating: 9, color: '#4CAF50', label: 'Excellent' },
  GOOD: { rating: 7, color: '#8BC34A', label: 'Good' },
  FAIR: { rating: 5, color: '#FFC107', label: 'Fair' },
  POOR: { rating: 3, color: '#FF9800', label: 'Poor' },
  TERRIBLE: { rating: 1, color: '#F44336', label: 'Terrible' },
};
