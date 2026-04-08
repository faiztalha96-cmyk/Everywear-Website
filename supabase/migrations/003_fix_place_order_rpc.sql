-- ============================================================
-- MIGRATION 003: Fix place_order RPC
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Drop and recreate place_order with coupon support + fixed JSONB field names
CREATE OR REPLACE FUNCTION public.place_order(
  p_items           JSONB,
  p_total           NUMERIC,
  p_address         JSONB,
  p_payment_method  TEXT,
  p_coupon_code     TEXT    DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_item     JSONB;
BEGIN
  -- 1. Create the order record
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
    p_total,
    p_address,
    p_payment_method,
    CASE WHEN p_payment_method = 'online' THEN 'paid' ELSE 'unpaid' END,
    p_coupon_code,
    p_discount_amount,
    'pending'
  )
  RETURNING id INTO v_order_id;

  -- 2. Insert each order item and deduct stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Try variant stock deduction first
    IF (v_item->>'variantId') IS NOT NULL AND (v_item->>'variantId') != 'null' THEN
      UPDATE public.product_variants
      SET    stock = stock - (v_item->>'quantity')::INTEGER
      WHERE  id    = (v_item->>'variantId')::UUID
        AND  stock >= (v_item->>'quantity')::INTEGER;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for variant of "%"', v_item->>'name';
      END IF;
    ELSE
      -- Deduct from main product stock_quantity
      UPDATE public.products
      SET    stock_quantity = stock_quantity - (v_item->>'quantity')::INTEGER
      WHERE  id             = (v_item->>'productId')::UUID
        AND  stock_quantity >= (v_item->>'quantity')::INTEGER;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for product "%"', v_item->>'name';
      END IF;
    END IF;

    -- Insert the order item
    INSERT INTO public.order_items (
      order_id,
      product_id,
      variant_id,
      quantity,
      unit_price,
      size,
      color
    )
    VALUES (
      v_order_id,
      (v_item->>'productId')::UUID,
      NULLIF(v_item->>'variantId', 'null')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::NUMERIC,
      NULLIF(v_item->>'selectedSize', 'null'),
      NULLIF(v_item->>'selectedColor', 'null')
    );
  END LOOP;

  -- 3. Clear the user's server-side cart
  DELETE FROM public.cart_items WHERE user_id = auth.uid();

  -- 4. Return the new order id
  RETURN v_order_id;
END;
$$;

-- Grant execute to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.place_order(JSONB, NUMERIC, JSONB, TEXT, TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(JSONB, NUMERIC, JSONB, TEXT, TEXT, NUMERIC) TO anon;
