import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If we are in a popup, close it
    if (window.opener) {
      // Small delay to ensure Supabase client has processed the hash/session
      const timeout = setTimeout(() => {
        window.close();
      }, 2000);
      return () => clearTimeout(timeout);
    } else {
      // If not in a popup (e.g. direct redirect), redirect to home
      const timeout = setTimeout(() => {
        setLocation("/");
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [setLocation]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
      <h1 className="text-xl font-serif uppercase tracking-widest font-bold">Authenticating</h1>
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2 font-bold">
        Completing your secure sign-in...
      </p>
    </div>
  );
}
