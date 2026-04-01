-- EVERYWEAR SUPABASE DATABASE SETUP
-- COMPLETE, CORRECTED, FINAL VERSION
-- Idempotent script for Supabase SQL Editor

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 1: EXTENSIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 2: TABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    theme TEXT DEFAULT 'light',
    order_count INTEGER DEFAULT 0,
    recently_viewed JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    sale_price NUMERIC(10,2),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    stock_quantity INTEGER DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    sizes TEXT[] DEFAULT '{}',
    colors JSONB DEFAULT '[]', -- Array of {name, hex}
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_new BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
    total_amount NUMERIC(10,2) NOT NULL,
    shipping_address JSONB NOT NULL, -- {firstName, lastName, email, phone, address, city, postalCode, notes}
    payment_method TEXT NOT NULL,
    payment_status TEXT CHECK (payment_status IN ('unpaid', 'paid', 'refunded')) DEFAULT 'unpaid',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. ORDER_ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL,
    size TEXT,
    color TEXT,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. CART_ITEMS
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, variant_id)
);

-- 7. WISHLIST_ITEMS
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, product_id)
);

-- 8. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(product_id, user_id)
);

-- 9. ABANDONED_CARTS
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_email TEXT,
    cart_snapshot JSONB NOT NULL,
    recovery_email_sent BOOLEAN DEFAULT FALSE,
    recovery_email_sent_at TIMESTAMPTZ,
    recovered BOOLEAN DEFAULT FALSE,
    recovered_at TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY, -- 'default' or specific key
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. RECENTLY_VIEWED (Table version as requested)
CREATE TABLE IF NOT EXISTS public.recently_viewed (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, product_id)
);

-- 12. NEWSLETTER_SUBSCRIBERS
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) NOT NULL,
    discount_value NUMERIC NOT NULL,
    min_order_amount NUMERIC DEFAULT 0,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 3: INDEXES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- products
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_new ON public.products(is_new);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- categories
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);

-- orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- cart_items
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_last_activity ON public.cart_items(last_activity);

-- reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- recently_viewed
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_id ON public.recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_at ON public.recently_viewed(viewed_at DESC);

-- settings
-- Primary key 'id' is already indexed

-- abandoned_carts
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_user_id ON public.abandoned_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovered ON public.abandoned_carts(recovered);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email_sent ON public.abandoned_carts(recovery_email_sent);

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 4: UPDATED_AT TRIGGER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);
        EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION handle_updated_at()', t);
    END LOOP;
END $$;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 5: AUTH TRIGGER (profile auto-creation)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
    CASE WHEN NEW.email = 'faiztalha96@gmail.com' THEN TRUE ELSE FALSE END
  )
  ON CONFLICT (id) DO UPDATE SET
    email        = EXCLUDED.email,
    full_name    = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url   = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 6: ROW LEVEL SECURITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles 
     WHERE id = auth.uid()),
    FALSE
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id OR is_admin());
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND (is_admin = profiles.is_admin OR is_admin()));
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (is_admin());

-- CATEGORIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "categories_all_admin" ON public.categories;
CREATE POLICY "categories_all_admin" ON public.categories FOR ALL USING (is_admin());

-- PRODUCTS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_select" ON public.products;
CREATE POLICY "products_select" ON public.products FOR SELECT USING (is_active = TRUE OR is_admin());
DROP POLICY IF EXISTS "products_all_admin" ON public.products;
CREATE POLICY "products_all_admin" ON public.products FOR ALL USING (is_admin());

-- ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_select" ON public.orders;
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);
DROP POLICY IF EXISTS "orders_update" ON public.orders;
CREATE POLICY "orders_update" ON public.orders FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "orders_delete" ON public.orders;
CREATE POLICY "orders_delete" ON public.orders FOR DELETE USING (is_admin());

-- ORDER_ITEMS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (user_id = auth.uid() OR is_admin())));
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (user_id = auth.uid() OR auth.uid() IS NULL)));
DROP POLICY IF EXISTS "order_items_all_admin" ON public.order_items;
CREATE POLICY "order_items_all_admin" ON public.order_items FOR ALL USING (is_admin());

-- CART_ITEMS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cart_items_all_user" ON public.cart_items;
CREATE POLICY "cart_items_all_user" ON public.cart_items FOR ALL USING (auth.uid() = user_id);

-- WISHLIST_ITEMS
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wishlist_items_all_user" ON public.wishlist_items;
CREATE POLICY "wishlist_items_all_user" ON public.wishlist_items FOR ALL USING (auth.uid() = user_id);

-- REVIEWS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_select" ON public.reviews;
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "reviews_update" ON public.reviews;
CREATE POLICY "reviews_update" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "reviews_delete" ON public.reviews;
CREATE POLICY "reviews_delete" ON public.reviews FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- ABANDONED_CARTS
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "abandoned_carts_all_admin" ON public.abandoned_carts;
CREATE POLICY "abandoned_carts_all_admin" ON public.abandoned_carts FOR ALL USING (is_admin());

-- SETTINGS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_select" ON public.settings;
CREATE POLICY "settings_select" ON public.settings FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "settings_all_admin" ON public.settings;
CREATE POLICY "settings_all_admin" ON public.settings FOR ALL USING (is_admin());

-- RECENTLY_VIEWED
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recently_viewed_all_user" ON public.recently_viewed;
CREATE POLICY "recently_viewed_all_user" ON public.recently_viewed FOR ALL USING (auth.uid() = user_id);

-- NEWSLETTER_SUBSCRIBERS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "newsletter_insert" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_insert" ON public.newsletter_subscribers FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "newsletter_all_admin" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_all_admin" ON public.newsletter_subscribers FOR ALL USING (is_admin());

-- COUPONS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coupons_select" ON public.coupons;
CREATE POLICY "coupons_select" ON public.coupons FOR SELECT USING (is_active = TRUE OR is_admin());
DROP POLICY IF EXISTS "coupons_all_admin" ON public.coupons;
CREATE POLICY "coupons_all_admin" ON public.coupons FOR ALL USING (is_admin());

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 7: PLACE_ORDER RPC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION public.place_order(
  p_items JSONB,
  p_total NUMERIC,
  p_address JSONB,
  p_payment_method TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
BEGIN
  -- 1. Create the order record
  INSERT INTO public.orders (
    user_id, total_amount, shipping_address, payment_method, status, payment_status
  )
  VALUES (
    auth.uid(), p_total, p_address, p_payment_method, 'pending',
    CASE WHEN p_payment_method = 'online' THEN 'paid' ELSE 'unpaid' END
  )
  RETURNING id INTO v_order_id;

  -- 2. Insert each order item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Deduct stock
    IF (v_item->>'variantId') IS NOT NULL THEN
      -- Deduct from variant
      UPDATE public.product_variants
      SET stock = stock - (v_item->>'quantity')::INTEGER
      WHERE id = (v_item->>'variantId')::UUID
      AND stock >= (v_item->>'quantity')::INTEGER;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for variant of %', v_item->>'name';
      END IF;
    ELSE
      -- Deduct from main product
      UPDATE public.products
      SET stock_quantity = stock_quantity - (v_item->>'quantity')::INTEGER
      WHERE id = (v_item->>'productId')::UUID
      AND stock_quantity >= (v_item->>'quantity')::INTEGER;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for product %', v_item->>'name';
      END IF;
    END IF;

    INSERT INTO public.order_items (
      order_id, product_id, variant_id, quantity, 
      unit_price, size, color
    )
    VALUES (
      v_order_id,
      (v_item->>'productId')::UUID,
      (v_item->>'variantId')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::NUMERIC,
      v_item->>'selectedSize',
      v_item->>'selectedColor'
    );
  END LOOP;

  -- 3. Clear the user's cart (if applicable)
  DELETE FROM public.cart_items WHERE user_id = auth.uid();

  -- 4. Return the new order id
  RETURN v_order_id;
END;
$$;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 8: HELPER FUNCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Product average rating
CREATE OR REPLACE FUNCTION get_product_rating(p_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 1), 0)
  FROM public.reviews WHERE product_id = p_id;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- 2. Product review count
CREATE OR REPLACE FUNCTION get_review_count(p_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.reviews WHERE product_id = p_id;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- 3. Admin dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_revenue', 
      COALESCE(SUM(total_amount), 0),
    'total_orders',  
      COUNT(*),
    'pending_orders', 
      COUNT(*) FILTER (WHERE status = 'pending'),
    'total_customers', 
      (SELECT COUNT(*) FROM public.profiles WHERE is_admin = FALSE)
  )
  INTO v_result
  FROM public.orders;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Detailed admin stats
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_revenue', COALESCE(SUM(total_amount), 0),
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

-- 4. Abandoned cart detection function
CREATE OR REPLACE FUNCTION detect_abandoned_carts()
RETURNS void AS $$
BEGIN
  INSERT INTO public.abandoned_carts (user_id, cart_snapshot, user_email)
  SELECT 
    user_id,
    jsonb_agg(
      jsonb_build_object(
        'product_id', product_id,
        'quantity', quantity,
        'size', size,
        'color', color
      )
    ),
    (SELECT email FROM public.profiles WHERE id = user_id)
  FROM public.cart_items
  WHERE last_activity < NOW() - INTERVAL '1 hour'
  AND user_id NOT IN (
    SELECT user_id FROM public.abandoned_carts 
    WHERE recovered = FALSE
  )
  GROUP BY user_id
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 9: STORAGE BUCKETS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Product images bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- Storage RLS policies:

-- Public read on product images
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Admin only upload
DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
CREATE POLICY "product_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND is_admin());

-- Admin only update
DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
CREATE POLICY "product_images_admin_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND is_admin());

-- Admin only delete
DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "product_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND is_admin());

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 10: SEED DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. DEFAULT SETTINGS
INSERT INTO public.settings (id, data)
VALUES
  ('default', '{
    "announcement": {
      "enabled": true,
      "text": "Free shipping on orders over ৳5000"
    },
    "theme": {
      "primaryColor": "#000000"
    },
    "hero": {
      "title": "Quality craftsmanship meets contemporary design",
      "subtitle": "Discover EVERYWEAR",
      "backgroundImage": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
    },
    "paymentMethods": {
      "cod": {
        "enabled": true,
        "instructions": "Pay with cash upon delivery."
      },
      "online": {
        "enabled": true,
        "storeId": "everywear_live",
        "storePassword": "password",
        "sandbox": true
      }
    }
  }')
ON CONFLICT (id) DO NOTHING;

-- 2. SAMPLE CATEGORIES
INSERT INTO public.categories (name, slug, description, is_active)
VALUES
  ('Men', 'men', 'Premium menswear collection', TRUE),
  ('Women', 'women', 'Contemporary womenswear', TRUE),
  ('Accessories', 'accessories', 'Curated accessories', TRUE),
  ('New Arrivals', 'new-arrivals', 'Latest additions', TRUE),
  ('Sale', 'sale', 'Discounted items', TRUE)
ON CONFLICT (slug) DO NOTHING;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 11: EXECUTION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ╔══════════════════════════════════════════╗
-- ║   EVERYWEAR — DATABASE SETUP CHECKLIST  ║
-- ╚══════════════════════════════════════════╝
--
-- Run each section IN ORDER in Supabase SQL Editor.
-- If any section errors, fix it before continuing.
--
-- [ ] Step 1  → Run Section 1  (Extensions)
-- [ ] Step 2  → Run Section 2  (Tables)
-- [ ] Step 3  → Run Section 3  (Indexes)
-- [ ] Step 4  → Run Section 4  (Updated_at triggers)
-- [ ] Step 5  → Run Section 5  (Auth trigger)
-- [ ] Step 6  → Run Section 6  (RLS policies)
-- [ ] Step 7  → Run Section 7  (place_order RPC)
-- [ ] Step 8  → Run Section 8  (Helper functions)
-- [ ] Step 9  → Run Section 9  (Storage buckets)
-- [ ] Step 10 → Run Section 10 (Seed data — settings + categories)
--
-- MANUAL STEPS IN SUPABASE DASHBOARD:
-- [ ] Step 11 → Authentication → Users → Create admin user (faiztalha96@gmail.com)
-- [ ] Step 12 → Run UPDATE profiles SET is_admin = TRUE WHERE email = 'faiztalha96@gmail.com'
-- [ ] Step 13 → Storage → Confirm product-images bucket is set to PUBLIC
-- [ ] Step 14 → Authentication → URL Configuration
--              Add: https://ais-dev-3klu4djddulsbl27xdptd2-175108788815.asia-southeast1.run.app
--              Add: https://ais-dev-3klu4djddulsbl27xdptd2-175108788815.asia-southeast1.run.app/auth/callback
-- [ ] Step 15 → Authentication → Providers → Enable Google OAuth
--
-- EVERYWEAR database setup complete. ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 12: PRODUCT VARIANTS & DISCOUNTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Update products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_value NUMERIC;

-- Create product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    sku TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add index for product_id
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

-- Prevent duplicate variant combinations
ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_size_color_key;
ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_product_id_size_color_key UNIQUE (product_id, size, color);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "product_variants_select" ON public.product_variants;
CREATE POLICY "product_variants_select" ON public.product_variants FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "product_variants_all_admin" ON public.product_variants;
CREATE POLICY "product_variants_all_admin" ON public.product_variants FOR ALL USING (is_admin());

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.product_variants;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
