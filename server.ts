import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Force production mode if not explicitly set to eliminate Vite middleware interference
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log Supabase configuration status at startup
console.log('Environment:', process.env.NODE_ENV);
console.log('Supabase URL configured:', !!process.env.VITE_SUPABASE_URL);
console.log('Supabase Anon Key configured:', !!process.env.VITE_SUPABASE_ANON_KEY);
console.log('Service Role Key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Initialize Supabase Admin Client (for admin tasks)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Initialize Supabase Auth Client (using anon key for user auth)
const supabaseAuth = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.VITE_SUPABASE_ANON_KEY || ""
);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // IMPORTANT: Register all middleware and API routes BEFORE Vite middleware
  app.use(express.json());

  // Debug route to confirm API is reachable
  app.post("/api/auth/test", (req, res) => {
    console.log('Test route hit with body:', req.body);
    res.json({ reached: true, body: req.body });
  });

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  // Test connection route
  app.get("/api/test-connection", async (req, res) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(
        `${supabaseUrl}/auth/v1/health`,
        {
          headers: { 'apikey': supabaseAnonKey || '' },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);
      const data = await response.json();
      res.json({
        canReachSupabase: true,
        httpStatus: response.status,
        supabaseResponse: data
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      res.json({
        canReachSupabase: false,
        errorName: err.name,
        errorMessage: err.message,
        wasAborted: err.name === 'AbortError'
      });
    }
  });

  // Admin Middleware
  const verifyAdmin = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "No authorization header" });
      }

      const token = authHeader.split(" ")[1];
      if (!token || !supabaseAdmin) {
        return res.status(401).json({ error: "Invalid token or server not configured" });
      }

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ error: "Invalid session" });
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.is_admin) {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Admin verification error:", error);
      res.status(500).json({ error: "Internal server error during verification" });
    }
  };

  app.get("/api/admin/verify", verifyAdmin, (req, res) => {
    res.json({ status: "ok", isAdmin: true });
  });

  // Gemini API Proxy
  app.post("/api/gemini", async (req, res) => {
    try {
      const { model, contents, config } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: model || "gemini-3-flash-preview",
        contents,
        config,
      });

      res.json(response);
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "An error occurred while calling Gemini API." });
    }
  });

  // Direct Supabase Auth Proxy Route
  app.post("/api/auth/login", async (req, res) => {
    console.log('Login attempt for:', req.body.email);
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: { message: 'Email and password are required' }
        });
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({
          error: { message: 'Server configuration error - missing env vars' }
        });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      let response;
      try {
        response = await fetch(
          `${supabaseUrl}/auth/v1/token?grant_type=password`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({ email, password }),
            signal: controller.signal
          }
        );
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        console.error('Fetch error during login:', fetchErr);
        if (fetchErr.name === 'AbortError') {
          return res.status(504).json({
            error: { message: 'Connection to Supabase timed out. Check your VITE_SUPABASE_URL.' }
          });
        }
        return res.status(500).json({
          error: { message: `Network error: ${fetchErr.message}` }
        });
      }

      clearTimeout(timeoutId);

      const result = await response.json();

      if (!response.ok) {
        console.log('Supabase auth failed:', result);
        return res.status(401).json({
          data: null,
          error: { message: result.error_description || result.msg || 'Invalid credentials' }
        });
      }

      console.log('Supabase auth success for:', email);
      return res.status(200).json({
        data: {
          session: {
            access_token: result.access_token,
            refresh_token: result.refresh_token,
            expires_in: result.expires_in,
            token_type: result.token_type,
            user: result.user
          },
          user: result.user
        },
        error: null
      });

    } catch (err: any) {
      console.error('Login route crashed:', err);
      return res.status(500).json({
        data: null,
        error: { message: err.message || 'Server error' }
      });
    }
  });

  // Vite/Static block - MUST be after all API routes
  if (process.env.NODE_ENV !== "production") {
    console.log('Starting Vite in middleware mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving static files from dist...');
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
}

startServer();
