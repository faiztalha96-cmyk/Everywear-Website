import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';

// Use getSession() instead of getUser() for local reads — getUser() makes a
// network round-trip to Supabase auth servers every call, which is very slow.
async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  // Skip the extra is_admin check when fetching own profile (the 99% case).
  if (user.id !== userId) {
    const { data: selfProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    if (!selfProfile?.is_admin) {
      throw new Error('Unauthorized: You can only access your own profile.');
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching profile:', error);
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    name: data.full_name || data.name,
    phone: data.phone,
    address: data.address,
    city: data.city,
    postalCode: data.postal_code,
    avatarUrl: data.avatar_url,
    isAdmin: data.is_admin || false,
    theme: data.theme,
    createdAt: new Date(data.created_at),
    orderCount: data.order_count || 0
  };
}

export async function updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!currentUserProfile?.is_admin && user.id !== userId) {
    throw new Error('Unauthorized: You can only update your own profile.');
  }

  const supabaseData: any = {
    full_name: profile.name,
    phone: profile.phone,
    address: profile.address,
    city: profile.city,
    postal_code: profile.postalCode,
    avatar_url: profile.avatarUrl,
    theme: profile.theme,
    is_admin: profile.isAdmin
  };

  if (!currentUserProfile?.is_admin) {
    delete supabaseData.is_admin;
  }

  const { error } = await supabase
    .from('profiles')
    .update(supabaseData)
    .eq('id', userId);

  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!currentUserProfile?.is_admin) {
    throw new Error('Unauthorized: Admin access required.');
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profilesError) {
    console.error('Error fetching all users:', profilesError);
    throw profilesError;
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('user_id');

  const orderCounts = (orders || []).reduce((acc: any, order: any) => {
    acc[order.user_id] = (acc[order.user_id] || 0) + 1;
    return acc;
  }, {});

  return (profiles || []).map(item => ({
    id: item.id,
    email: item.email,
    name: item.full_name || item.name,
    phone: item.phone,
    address: item.address,
    avatarUrl: item.avatar_url,
    isAdmin: item.is_admin || false,
    theme: item.theme || 'light',
    createdAt: new Date(item.created_at),
    orderCount: orderCounts[item.id] || 0
  }));
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  } catch (err: any) {
    return { data: { user: null, session: null }, error: { message: err.message || 'Network error' } };
  }
}

export async function signUp(email: string, password: string, fullName: string, phone?: string) {
  const result = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone } },
  });

  if (!result.error && result.data.user) {
    try {
      await supabase.from('profiles').upsert({
        id: result.data.user.id,
        email: result.data.user.email,
        full_name: fullName,
        phone
      }, { onConflict: 'id', ignoreDuplicates: true });
    } catch {
      // Profile creation by DB trigger is the primary mechanism; fallback failure is non-fatal
    }
  }

  return result;
}

export async function updatePassword(password: string) {
  return await supabase.auth.updateUser({ password });
}

export async function signInWithOAuth(provider: 'google' | 'github') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      skipBrowserRedirect: true,
    },
  });

  if (error) return { error };

  if (data?.url) {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(data.url, 'oauth_popup', `width=${width},height=${height},left=${left},top=${top}`);
  }

  return { data, error: null };
}

export async function signOut() {
  try {
    await supabase.auth.signOut();
  } finally {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
  }
}

export async function resetPassword(email: string) {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}
