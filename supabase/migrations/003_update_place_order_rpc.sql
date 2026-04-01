-- 1. Redefine the place_order RPC to support promotional discounts
CREATE OR REPLACE FUNCTION place_order(
  p_items jsonb,
  p_total numeric,
  p_address jsonb,
  p_payment_method text,
  p_coupon_code text DEFAULT NULL,
  p_discount_amount numeric DEFAULT 0
) RETURNS uuid AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
BEGIN
  -- Insert into the "orders" table
  INSERT INTO orders (
    user_id,
    total_amount,
    shipping_address,
    payment_method,
    coupon_code,
    discount_amount,
    status,
    created_at
  ) VALUES (
    auth.uid(),
    p_total,
    p_address,
    p_payment_method,
    p_coupon_code,
    p_discount_amount,
    'pending',
    now()
  ) RETURNING id INTO v_order_id;

  -- Insert items into "order_items" table from the provided JSON array
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      unit_price,
      size,
      color,
      variant_id
    ) VALUES (
      v_order_id,
      (v_item->>'productId')::uuid,
      (v_item->>'quantity')::int,
      (v_item->>'price')::numeric,
      (v_item->>'selectedSize'),
      (v_item->>'selectedColor'),
      (v_item->>'variantId')::uuid
    );
  END LOOP;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
