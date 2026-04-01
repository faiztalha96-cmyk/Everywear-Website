import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// In-memory fallback storage for iframe environments where localStorage might be restricted
const memoryStore: Record<string, string> = {};

const iframeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key) ?? memoryStore[key] ?? null;
    } catch {
      return memoryStore[key] ?? null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
    memoryStore[key] = value;
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    delete memoryStore[key];
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: iframeStorage,
    // Disable navigator.locks as it's often blocked in cross-origin iframes
    lock: async (_name, _acquireTimeout, fn) => fn(),
  }
});
