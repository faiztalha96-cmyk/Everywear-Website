import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../contexts/auth-context";
import { resetPassword as authResetPassword } from "../../services/authService";
import toast from "react-hot-toast";

export default function Login() {
  const { login, loginWithGoogle, user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        const { error } = await authResetPassword(email);
        if (error) {
          toast.error(error.message || "Failed to send reset link");
          return;
        }
        toast.success("Reset link sent to your email");
        setMode("login");
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-secondary/30">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-background border border-border p-10 space-y-10 shadow-2xl"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif font-bold uppercase tracking-widest">
            {mode === "login" ? "Sign In" : "Reset Password"}
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
            {mode === "login" ? "Welcome back to Everywear" : "Enter your email to receive a reset link"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                required
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-secondary border border-border pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {mode === "login" && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-secondary border border-border pl-12 pr-12 py-4 text-sm focus:outline-none focus:border-primary transition-colors"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {mode === "login" && (
            <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => setMode("reset")}
                className="text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
              </>
            ) : (
              <>
                {mode === "login" ? "Sign In" : "Send Reset Link"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {mode === "login" && (
          <>
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
              <span className="relative bg-background px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">or continue with</span>
            </div>

            <button 
              type="button"
              onClick={() => loginWithGoogle()}
              className="w-full border border-border py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-secondary transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
