// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'citizen' | 'ngo';
  latitude?: number;
  longitude?: number;
  operation_area?: string;
}

interface Report {
  reportId: string;
  userId: string;
  username: string;
  photo: string;
  description: string;
  location: { lat: number; lng: number };
  address: string;
  ngoList: string[];
  status: 'Reported' | 'Active' | 'Completed';
  citizenApproval?: boolean;
  completionImage?: string;
  timestamp?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;

  reports: Report[];
  addReport: (report: Report) => void;
  approveCompletion: (reportId: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  reports: [],
  addReport: () => {},
  approveCompletion: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);

  const addReport = (report: Report) => {
    setReports(prev => [...prev, report]);
  };

  const approveCompletion = (reportId: string) => {
    setReports(prev =>
      prev.map(r =>
        r.reportId === reportId
          ? { ...r, citizenApproval: true, status: 'Completed' }
          : r
      )
    );
  };

  // Load session on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const userId = session.user.id;

          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error) throw error;

          if (profile) {
            setUser({
              id: profile.user_id,
              email: profile.email,
              full_name: profile.full_name,
              role: profile.role,
              latitude: profile.latitude,
              longitude: profile.longitude,
              operation_area: profile.operation_area,
            });
          }
        }
      } catch (err) {
        console.error('Error loading user session:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Optional: listen for auth state changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // You can fetch profile again if needed
      } else {
        setUser(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Login
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const userId = data.user?.id;
    if (!userId) throw new Error('User ID not found');

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) throw new Error('Profile not found');

    setUser({
      id: profile.user_id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      latitude: profile.latitude,
      longitude: profile.longitude,
      operation_area: profile.operation_area,
    });
  };

  // Signup
  const signup = async (data: any) => {
    const { email, password, full_name, role, latitude, longitude, operation_area } = data;

    const { data: authData, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    const userId = authData.user?.id;
    if (!userId) throw new Error('User ID not found after signup');

    // Insert profile into users table
    const { error: insertError } = await supabase.from('users').insert([
      {
        user_id: userId,
        full_name,
        email,
        role,
        latitude,
        longitude,
        operation_area,
      },
    ]);

    if (insertError) throw insertError;

    setUser({
      id: userId,
      email,
      full_name,
      role,
      latitude,
      longitude,
      operation_area,
    });
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        signup,
        logout,
        reports,
        addReport,
        approveCompletion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
