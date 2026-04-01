/**
 * SUPABASE ADMIN CLIENT
 *
 * WARNING: This file uses the SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
 * It must NEVER be imported in any client-side file (src/app, src/components, etc.).
 * It should ONLY be used in server-side logic (e.g., server.ts or server-only services).
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  // Note: Using process.env instead of import.meta.env as this is for server-side
  throw new Error('Missing Supabase Admin environment variables.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
