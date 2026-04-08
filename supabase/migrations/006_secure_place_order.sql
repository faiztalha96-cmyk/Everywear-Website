-- ============================================================
-- MIGRATION 006: Security & Logic Hardening
-- Phase 1 of Remediation Plan
-- ============================================================

-- 1. REFACTOR place_order RPC (CRITICAL: Prevents Price Tampering)
CREATE OR REPLACE FUNCTION public.place_order(
  p_items           JSONB,
  p_address         JSONB,
  p_payment_method  TEXT,
  p_coupon_code     TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id        UUID;
  v_item            JSONB;
  v_subtotal        NUMERIC := 0;
  v_item_price      NUMERIC;
  v_discount_amount NUMERIC := 0;
  v_total_amount    NUMERIC := 0;
  v_shipping_cost   NUMERIC := 100; -- Hardcoded for now, matches frontend
  v_coupon_id       UUID := NULL;
  v_coupon_discount_type TEXT;
  v_coupon_discount_value NUMERIC;
  v_coupon_min_amount NUMERIC;
BEGIN
  -- A. CALCULATE CORRECT PRICE (SERVER-SIDE)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Get price from source of truth
    IF (v_item->>'variantId') IS NOT NULL AND (v_item->>'variantId') != 'null' THEN
      SELECT price INTO v_item_price 
      FROM public.product_variants 
      WHERE id = (v_item->>'variantId')::UUID;
    ELSE
      SELECT COALESCE(sale_price, price) INTO v_item_price 
      FROM public.products 
      WHERE id = (v_item->>'productId')::UUID;
    END IF;

    IF v_item_price IS NULL THEN
      RAISE EXCEPTION 'Product with ID % not found', (v_item->>'productId');
    END IF;

    v_subtotal := v_subtotal + (v_item_price * (v_item->>'quantity')::INTEGER);
  END LOOP;

  -- B. VALIDATE COUPON (SERVER-SIDE)
  IF p_coupon_code IS NOT NULL AND p_coupon_code != '' THEN
    SELECT id, discount_type, discount_value, min_order_amount 
    INTO v_coupon_id, v_coupon_discount_type, v_coupon_discount_value, v_coupon_min_amount
    FROM public.coupons 
    WHERE code = p_coupon_code 
      AND is_active = TRUE 
      AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE);
    
    IF v_coupon_id IS NOT NULL THEN
      IF v_subtotal >= v_coupon_min_amount THEN
        IF v_coupon_discount_type = 'percentage' THEN
          v_discount_amount := (v_subtotal * v_coupon_discount_value / 100);
        ELSE
          v_discount_amount := v_coupon_discount_value;
        END IF;
      END IF;
    END IF;
  END IF;

  v_total_amount := v_subtotal - v_discount_amount + v_shipping_cost;

  -- C. CREATE ORDER RECORD
  INSERT INTO public.orders (
    user_id,
    total_amount,
    shipping_address,
    payment_method,
    payment_status,
    coupon_code,
    discount_amount,
    status
  )
  VALUES (
    auth.uid(),
    v_total_amount,
    p_address,
    p_payment_method,
    'unpaid', -- ALWAYS start as unpaid, update via verified callback/admin
    p_coupon_code,
    v_discount_amount,
    'pending'
  )
  RETURNING id INTO v_order_id;

  -- D. INSERT ITEMS & DEDUCT STOCK
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Stock deduction
    IF (v_item->>'variantId') IS NOT NULL AND (v_item->>'variantId') != 'null' THEN
      UPDATE public.product_variants
      SET    stock = stock - (v_item->>'quantity')::INTEGER
      WHERE  id    = (v_item->>'variantId')::UUID
        AND  stock >= (v_item->>'quantity')::INTEGER;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for variant %', (v_item->>'variantId');
      END IF;
    ELSE
      UPDATE public.products
      SET    stock_quantity = stock_quantity - (v_item->>'quantity')::INTEGER
      WHERE  id             = (v_item->>'productId')::UUID
        AND  stock_quantity >= (v_item->>'quantity')::INTEGER;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for product %', (v_item->>'productId');
      END IF;
    END IF;

    -- Re-fetch current unit price for the record
    IF (v_item->>'variantId') IS NOT NULL AND (v_item->>'variantId') != 'null' THEN
      SELECT price INTO v_item_price FROM public.product_variants WHERE id = (v_item->>'variantId')::UUID;
    ELSE
      SELECT COALESCE(sale_price, price) INTO v_item_price FROM public.products WHERE id = (v_item->>'productId')::UUID;
    END IF;

    INSERT INTO public.order_items (
      order_id, product_id, variant_id, quantity, 
      unit_price, size, color
    )
    VALUES (
      v_order_id,
      (v_item->>'productId')::UUID,
      CASE WHEN (v_item->>'variantId') = 'null' THEN NULL ELSE (v_item->>'variantId')::UUID END,
      (v_item->>'quantity')::INTEGER,
      v_item_price,
      v_item->>'selectedSize',
      v_item->>'selectedColor'
    );
  END LOOP;

  -- E. RECORD COUPON USAGE
  IF v_coupon_id IS NOT NULL THEN
    INSERT INTO public.coupon_usage (coupon_id, user_id, order_id)
    VALUES (v_coupon_id, auth.uid(), v_order_id);
  END IF;

  -- F. CLEAR CART
  DELETE FROM public.cart_items WHERE user_id = auth.uid();

  RETURN v_order_id;
END;
$$;

-- 2. LOCK DOWN ORDERS TABLE (Prevents RLS Bypass)
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own order items" ON public.order_items;
-- NO direct INSERT policy for orders/order_items. Must use RPC.

-- 3. REFACTOR AUTH TRIGGER (Removes Hardcoded Admin)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    is_admin
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    FALSE -- No more hardcoded admins. Set manually in DB or via admin panel.
  )
  ON CONFLICT (id) DO UPDATE SET
    email        = EXCLUDED.email,
    full_name    = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url   = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FIX ADMIN STATS
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_revenue', COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled'), 0),
    'total_orders', COUNT(*),
    'pending_orders', COUNT(*) FILTER (WHERE status = 'pending'),
    'completed_orders', COUNT(*) FILTER (WHERE status = 'delivered'),
    'total_customers', (SELECT COUNT(*) FROM public.profiles WHERE is_admin = FALSE),
    'revenue_history', (
      SELECT jsonb_agg(jsonb_build_object('date', date, 'revenue', revenue))
      FROM (
        SELECT 
          TO_CHAR(created_at, 'Mon DD') as date,
          SUM(total_amount) as revenue
        FROM public.orders
        WHERE created_at > NOW() - INTERVAL '30 days'
        AND status != 'cancelled'
        GROUP BY 1
        ORDER BY MIN(created_at)
      ) daily_revenue
    )
  )
  INTO v_result
  FROM public.orders;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
