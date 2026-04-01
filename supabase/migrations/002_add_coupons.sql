-- 1. Create the coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  min_order_amount numeric DEFAULT 0,
  expiry_date timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Add RLS policies for coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can select active coupons" ON coupons;
CREATE POLICY "Public can select active coupons" ON coupons
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage all coupons" ON coupons;
CREATE POLICY "Admins can manage all coupons" ON coupons
  FOR ALL USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- 3. Modify orders table to store applied coupon data
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS coupon_code text,
ADD COLUMN IF NOT EXISTS discount_amount numeric;

-- 4. Create a default test promotional code "WELCOME20" (20% off over 1,000 BDT)
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, is_active)
VALUES ('WELCOME20', 'percentage', 20, 1000, true)
ON CONFLICT (code) DO NOTHING;
