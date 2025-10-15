// Mock Supabase client for development
export const supabase = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        order: (column: string, options?: any) => ({
          limit: (count: number) => Promise.resolve({ data: [], error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        limit: (count: number) => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
      }),
      order: (column: string, options?: any) => ({
        limit: (count: number) => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
      }),
      limit: (count: number) => Promise.resolve({ data: [], error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
    }),
    insert: (data: any) => Promise.resolve({ data: null, error: null }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
    }),
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: (callback: any) => {
      // Mock auth state change
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signInWithPassword: (credentials: any) => Promise.resolve({ data: null, error: null }),
    signUp: (credentials: any) => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  },
};

// Database types
export interface User {
  id: string;
  username: string;
  email: string;
  profile_pic?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface FishSpecies {
  id: string;
  name: string;
  scientific_name?: string;
  region: string;
  photo_url?: string;
  description?: string;
  habitat?: string;
  feeding_habits?: string;
  best_baits?: string[];
  legal_size_limit?: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  water_type: 'freshwater' | 'saltwater' | 'estuary';
  created_at: string;
}

export interface Catch {
  id: string;
  user_id: string;
  species_id: string;
  photo_url?: string;
  weight?: number;
  length?: number;
  bait_used?: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  time: string;
  date: string;
  weather_data?: any;
  privacy: 'public' | 'friends' | 'private';
  notes?: string;
  created_at: string;
  species?: FishSpecies;
  user?: User;
}

export interface WeatherForecast {
  id: string;
  location: string;
  date: string;
  pressure: number;
  wind_speed: number;
  wind_direction: number;
  temperature: number;
  humidity: number;
  cloud_cover: number;
  solunar_data?: any;
  tide_data?: any;
  fishing_rating: number;
  created_at: string;
}

export interface Spot {
  id: string;
  user_id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  notes?: string;
  is_public: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: 'catch' | 'friend' | 'achievement' | 'weather';
  data?: any;
  read: boolean;
  created_at: string;
}

// Additional interfaces for enhanced features
export interface Comment {
  id: string;
  user_id: string;
  catch_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface Like {
  id: string;
  user_id: string;
  catch_id: string;
  created_at: string;
}

export interface FishingReport {
  id: string;
  user_id: string;
  location: string;
  coordinates: { lat: number; lng: number };
  conditions: string;
  species_caught: string[];
  best_baits: string[];
  notes?: string;
  created_at: string;
  user?: User;
}

export interface FishingTip {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  user?: User;
}

export interface UserPreference {
  id: string;
  user_id: string;
  key: string;
  value: string;
  created_at: string;
}

export interface HotSpot {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  description?: string;
  species_common: string[];
  best_times: string[];
  created_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'species' | 'weight' | 'count' | 'location';
  target: any;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface BaitEffectiveness {
  id: string;
  user_id: string;
  bait_name: string;
  species_id: string;
  conditions: string;
  success_rate: number;
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  earned_at: string;
  user?: User;
}