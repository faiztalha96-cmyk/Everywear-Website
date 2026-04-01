import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "motion/react";
import { Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/auth-context";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabase automatically handles the hash in the URL for password reset
    // We just need to make sure the user is on this page when they click the link
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      
      setSuccess(true);
      toast.success("Password updated successfully!");
      
      // Redirect to login after a short delay
      setTimeout(() => {
        setLocation("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold uppercase tracking-tight">Password Reset</h1>
          <p className="text-muted-foreground">
            Your password has been updated successfully. You will be redirected to the login page in a few seconds.
          </p>
          <button 
            onClick={() => setLocation("/login")}
            className="w-full bg-foreground text-background py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-primary transition-all"
          >
            Go to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-serif font-bold uppercase tracking-tight">New Password</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold">
            Enter your new secure password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-secondary/30 border border-border/50 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-secondary/30 border border-border/50 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
