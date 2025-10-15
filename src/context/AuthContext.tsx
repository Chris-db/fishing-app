import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mock user for development
    setUser({
      id: 'mock-user-id',
      username: 'Demo User',
      email: 'demo@fishtimes.com',
      profile_pic: undefined,
      location: 'Demo Location',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setSession({ user: { id: 'mock-user-id' } });
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Mock sign in
    console.log('Mock sign in:', email);
  };

  const signUp = async (email: string, password: string, username: string) => {
    // Mock sign up
    console.log('Mock sign up:', email, username);
  };

  const signOut = async () => {
    // Mock sign out
    setUser(null);
    setSession(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    setUser({ ...user, ...updates });
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};