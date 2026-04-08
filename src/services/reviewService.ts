import { supabase } from '../lib/supabaseClient';
import { Review } from '../types';

export interface ReviewWithProfile extends Review {
  profiles: {
    full_name: string;
    avatar_url?: string;
  };
}

export async function getReviews(productId: string): Promise<ReviewWithProfile[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }

  return (data || []).map(item => ({
    id: item.id,
    productId: item.product_id,
    userId: item.user_id,
    rating: item.rating,
    comment: item.comment,
    createdAt: new Date(item.created_at),
    profiles: item.profiles
  }));
}

export async function submitReview(productId: string, rating: number, comment: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  if (!user) throw new Error('User must be logged in to submit a review');


  const { data, error } = await supabase
    .from('reviews')
    .upsert({
      product_id: productId,
      user_id: user.id,
      rating,
      comment,
      created_at: new Date().toISOString()
    }, { onConflict: 'product_id, user_id' })
    .select()
    .single();

  if (error) {
    console.error('Error submitting review:', error);
    throw error;
  }

  return data;
}
