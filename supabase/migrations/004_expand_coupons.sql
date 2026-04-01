-- 1. Add new columns to the "coupons" table
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS is_stackable boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS usage_limit_per_user integer DEFAULT 1;

-- 2. Create the "coupon_usage" table to track redemptions per user
CREATE TABLE IF NOT EXISTS coupon_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id uuid REFERENCES coupons(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(coupon_id, user_id, order_id)
);

-- 3. Add Row Level Security (RLS) for the usage tracking table
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all coupon usage" ON coupon_usage;
CREATE POLICY "Admins can view all coupon usage" ON coupon_usage
  FOR SELECT USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

DROP POLICY IF EXISTS "Users can view their own usage" ON coupon_usage;
CREATE POLICY "Users can view their own usage" ON coupon_usage
  FOR SELECT USING (auth.uid() = user_id);

-- 4. Initial update for existing test "WELCOME20" code
UPDATE coupons 
SET is_stackable = false, usage_limit_per_user = 1 
WHERE code = 'WELCOME20';
