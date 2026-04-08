import { supabase } from '../lib/supabaseClient';
import { AbandonedCart, Product } from '../types';

// getSession() reads from local storage — instant vs getUser()'s network call
async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

export async function getAllAbandonedCarts(): Promise<AbandonedCart[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) throw new Error('Unauthorized: Admin access required.');

  const { data, error } = await supabase
    .from('abandoned_carts')
    .select('*')
    .order('lastUpdated', { ascending: false });

  if (error) {
    console.error('Error fetching abandoned carts:', error);
    return [];
  }

  return data.map(item => ({
    ...item,
    id: item.id.toString(),
    lastUpdated: new Date(item.lastUpdated)
  }));
}

export async function deleteAbandonedCart(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) throw new Error('Unauthorized: Admin access required.');

  const { error } = await supabase
    .from('abandoned_carts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting abandoned cart:', error);
    throw error;
  }
}

export async function updateRecentlyViewed(userId: string, recent: Product[]): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  if (user.id !== userId) throw new Error('Unauthorized: You can only update your own recently viewed list.');

  const { error } = await supabase
    .from('profiles')
    .update({ recently_viewed: recent })
    .eq('id', userId);

  if (error) {
    console.error('Error updating recently viewed:', error);
    throw error;
  }
}

export async function getRecentlyViewed(userId: string): Promise<Product[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  if (user.id !== userId) throw new Error('Unauthorized: You can only access your own recently viewed list.');

  const { data, error } = await supabase
    .from('profiles')
    .select('recently_viewed')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching recently viewed:', error);
    return [];
  }

  return data?.recently_viewed || [];
}

export async function subscribeToNewsletter(email: string) {
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert([{ email }]);
  
  if (error) {
    console.error('Error subscribing to newsletter:', error);
    throw error;
  }
}
