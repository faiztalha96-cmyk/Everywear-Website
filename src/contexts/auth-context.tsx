import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import * as authService from "../services/authService";
import { UserProfile } from "../types";
import toast from "react-hot-toast";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  const isAdmin = profile?.isAdmin || false;

  const refreshProfile = async () => {
    if (user) {
      try {
        const p = await authService.getProfile(user.id);
        setProfile(p);
      } catch (e) {
        console.error('Profile refresh error:', e);
      }
    }
  };

  const sessionRef = useRef<Session | null>(null);

  // Load session on mount and set up auth listener
  useEffect(() => {
    let mounted = true;
    
    const loadSession = async () => {
      try {
        // getSession() reads from local storage (fast). getUser() would make a
        // network call to Supabase auth servers, blocking the entire app render.
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!mounted) return;
        
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          sessionRef.current = currentSession;
          
          try {
            const p = await authService.getProfile(currentSession.user.id);
            if (mounted) setProfile(p);
          } catch (e) {
            console.error('Profile load error:', e);
          }
        } else {
          if (mounted) {
            setUser(null);
            setSession(null);
            setProfile(null);
            sessionRef.current = null;
          }
        }
      } catch (e) {
        console.error('Session load error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        sessionRef.current = null;
      } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        // Only update if session actually changed to avoid flickering
        if (session?.access_token !== sessionRef.current?.access_token) {
          setSession(session);
          setUser(session?.user ?? null);
          sessionRef.current = session;
          if (session?.user) {
            try {
              const userProfile = await authService.getProfile(session.user.id);
              if (mounted) setProfile(userProfile);
            } catch (err) {
              console.error('Profile fetch failed in listener:', err);
            }
          }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await authService.signIn(email, password);
      if (error) throw error;
      
      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        sessionRef.current = data.session;
        
        let userProfile = null;
        try {
          userProfile = await authService.getProfile(data.session.user.id);
          setProfile(userProfile);
        } catch (err) {
          console.error('Profile fetch failed:', err);
        }
        
        toast.success('Welcome back!');
        
        // Redirect AFTER profile is loaded
        if (userProfile?.isAdmin) {
          setLocation('/admin');
        } else {
          setLocation('/');
        }
      }
    } catch (err: any) {
      throw err;
    }
  };

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    const { data, error } = await authService.signUp(email, password, name, phone);

    if (error) throw error;

    if (data.user && !data.session) {
      toast.success("Verification email sent! Please check your inbox.");
    } else {
      toast.success("Account created successfully!");
    }
  };

  const loginWithGoogle = async () => {
    const { error } = await authService.signInWithOAuth("google");
    if (error) toast.error("Google sign-in failed");
  };

  const logout = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setProfile(null);
      setSession(null);
      toast.success("Signed out successfully");
      setLocation("/");
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await authService.resetPassword(email);
    if (error) throw error;
    toast.success("Reset link sent to your email");
  };

  const updatePassword = async (password: string) => {
    const { error } = await authService.updatePassword(password);
    if (error) throw error;
    toast.success("Password updated successfully");
  };

  return (
    <AuthContext.Provider value={{ 
      user, session, profile, loading, isAdmin, 
      login, signUp, loginWithGoogle, logout, resetPassword, updatePassword, refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
