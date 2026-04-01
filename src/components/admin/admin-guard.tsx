import React from "react";
import { Redirect } from "wouter";
import { useAuth } from "../../contexts/auth-context";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-secondary/30">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">Loading Admin Panel</p>
          <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Verifying Credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (!isAdmin) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}
