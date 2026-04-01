-- ===============================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ===============================================================

-- 1. USERS / PROFILES table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
CREATE POLICY "Users can read their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- 2. PRODUCTS table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can select products" ON products;
CREATE POLICY "Public can select products" ON products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert products" ON products;
CREATE POLICY "Admins can insert products" ON products
  FOR INSERT WITH CHECK (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

DROP POLICY IF EXISTS "Admins can update products" ON products;
CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- 3. CATEGORIES table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can select categories" ON categories;
CREATE POLICY "Public can select categories" ON categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
CREATE POLICY "Admins can insert categories" ON categories
  FOR INSERT WITH CHECK (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

DROP POLICY IF EXISTS "Admins can update categories" ON categories;
CREATE POLICY "Admins can update categories" ON categories
  FOR UPDATE USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
CREATE POLICY "Admins can delete categories" ON categories
  FOR DELETE USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- 4. ORDERS table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select their own orders" ON orders;
CREATE POLICY "Users can select their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
CREATE POLICY "Users can insert their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can select all orders" ON orders;
CREATE POLICY "Admins can select all orders" ON orders
  FOR SELECT USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

DROP POLICY IF EXISTS "Admins can delete all orders" ON orders;
CREATE POLICY "Admins can delete all orders" ON orders
  FOR DELETE USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- 5. ORDER_ITEMS table (linked to orders)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select their own order items" ON order_items;
CREATE POLICY "Users can select their own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;
CREATE POLICY "Users can insert their own order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can select all order items" ON order_items;
CREATE POLICY "Admins can select all order items" ON order_items
  FOR SELECT USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- 6. CART table (assuming it exists for active carts)
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own cart" ON cart;
CREATE POLICY "Users can manage their own cart" ON cart
  FOR ALL USING (auth.uid() = user_id);

-- 7. REVIEWS table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can select reviews" ON reviews;
CREATE POLICY "Public can select reviews" ON reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;
CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can delete any review" ON reviews;
CREATE POLICY "Admins can delete any review" ON reviews
  FOR DELETE USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- 8. SETTINGS table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can select settings" ON settings;
CREATE POLICY "Public can select settings" ON settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
CREATE POLICY "Admins can manage settings" ON settings
  FOR ALL USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- 9. ABANDONED_CARTS table
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage abandoned carts" ON abandoned_carts;
CREATE POLICY "Admins can manage abandoned carts" ON abandoned_carts
  FOR ALL USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- 10. NEWSLETTER_SUBSCRIBERS table
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert newsletter subscribers" ON newsletter_subscribers;
CREATE POLICY "Public can insert newsletter subscribers" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can select newsletter subscribers" ON newsletter_subscribers;
CREATE POLICY "Admins can select newsletter subscribers" ON newsletter_subscribers
  FOR SELECT USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );
