import { supabase } from '../lib/supabaseClient';
import { Coupon } from '../types';

export function mapSupabaseToCoupon(data: any): Coupon {
  return {
    id: data.id,
    code: data.code,
    discountType: data.discount_type,
    discountValue: data.discount_value,
    minOrderAmount: data.min_order_amount || 0,
    expiryDate: data.expiry_date,
    isActive: data.is_active,
    isStackable: data.is_stackable || false,
    usageLimitPerUser: data.usage_limit_per_user || 1
  };
}

export async function validateCoupon(code: string, cartTotal: number): Promise<Coupon> {
  const uppercaseCode = code.trim().toUpperCase();

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', uppercaseCode)
    .single();

  if (error || !data) {
    throw new Error('Invalid promo code. Please check and try again.');
  }

  const coupon = mapSupabaseToCoupon(data);

  if (!coupon.isActive) {
    throw new Error('This promo code is no longer active.');
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
    throw new Error('This promo code has expired.');
  }

  if (cartTotal < coupon.minOrderAmount) {
    throw new Error(`This code requires a minimum order of ৳${coupon.minOrderAmount.toLocaleString()}.`);
  }

  // Check Usage Limit (if user is logged in)
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (user) {
    const { count, error: usageError } = await supabase
      .from('coupon_usage')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)
      .eq('user_id', user.id);

    if (!usageError && count !== null && count >= coupon.usageLimitPerUser) {
      throw new Error(`You have already used this promo code ${coupon.usageLimitPerUser} time(s).`);
    }
  }

  return coupon;
}

// Admin Functions
export async function getCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapSupabaseToCoupon);
}

export async function createCoupon(coupon: Partial<Coupon>): Promise<Coupon> {
  const { data, error } = await supabase
    .from('coupons')
    .insert([{
      code: coupon.code?.toUpperCase(),
      discount_type: coupon.discountType,
      discount_value: coupon.discountValue,
      min_order_amount: coupon.minOrderAmount,
      expiry_date: coupon.expiryDate,
      is_active: coupon.isActive,
      is_stackable: coupon.isStackable,
      usage_limit_per_user: coupon.usageLimitPerUser
    }])
    .select()
    .single();

  if (error) throw error;
  return mapSupabaseToCoupon(data);
}

export async function updateCoupon(id: string, coupon: Partial<Coupon>): Promise<Coupon> {
  const { data, error } = await supabase
    .from('coupons')
    .update({
      code: coupon.code?.toUpperCase(),
      discount_type: coupon.discountType,
      discount_value: coupon.discountValue,
      min_order_amount: coupon.minOrderAmount,
      expiry_date: coupon.expiryDate,
      is_active: coupon.isActive,
      is_stackable: coupon.isStackable,
      usage_limit_per_user: coupon.usageLimitPerUser
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapSupabaseToCoupon(data);
}

export async function deleteCoupon(id: string): Promise<void> {
  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

