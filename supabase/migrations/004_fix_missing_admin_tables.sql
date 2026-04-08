-- ============================================================
-- MIGRATION 004: Create Missing Admin Tables
-- Found missing during Everywear Admin Panel Audit
-- ============================================================

-- 1. SETTINGS (Customization & Payments)
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select" ON public.settings;
CREATE POLICY "settings_select" ON public.settings FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "settings_all_admin" ON public.settings;
CREATE POLICY "settings_all_admin" ON public.settings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
);

-- 2. PRODUCT VARIANTS (Stock & Options)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    price NUMERIC NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    sku TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "variants_select" ON public.product_variants;
CREATE POLICY "variants_select" ON public.product_variants FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "variants_all_admin" ON public.product_variants;
CREATE POLICY "variants_all_admin" ON public.product_variants FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
);

-- 3. ABANDONED CARTS (Recovery Center)
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    products JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_updated TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "abandoned_carts_all_admin" ON public.abandoned_carts;
CREATE POLICY "abandoned_carts_all_admin" ON public.abandoned_carts FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
);

-- 4. NEWSLETTER SUBSCRIBERS
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletter_insert" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_insert" ON public.newsletter_subscribers FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "newsletter_all_admin" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_all_admin" ON public.newsletter_subscribers FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
);

-- 5. COUPON USAGE (Tracking)
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupon_usage_all_admin" ON public.coupon_usage;
CREATE POLICY "coupon_usage_all_admin" ON public.coupon_usage FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
);

-- 6. RECENTLY VIEWED
CREATE TABLE IF NOT EXISTS public.recently_viewed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recently_viewed_all_user" ON public.recently_viewed;
CREATE POLICY "recently_viewed_all_user" ON public.recently_viewed FOR ALL USING (auth.uid() = user_id);

-- Initialize default settings if none exist
INSERT INTO public.settings (id, data)
VALUES ('default', '{
  "announcement": {"enabled": true, "text": "Welcome to Everywear Bangladesh - Luxury Redefined"},
  "theme": {"primaryColor": "#000000"},
  "hero": {
    "title": "THE ART OF TIMELESS ELEGANCE",
    "subtitle": "Discover our exclusive collection of luxury apparel designed for the modern lifestyle.",
    "backgroundImage": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070"
  },
  "paymentMethods": {
    "cod": {"enabled": true, "instructions": "Pay with cash upon delivery"},
    "online": {"enabled": true, "storeId": "EVERYWEAR_PROD", "storePassword": "***", "sandbox": true}
  },
  "storeCurrency": "BDT",
  "taxRate": 0
}'::jsonb)
ON CONFLICT (id) DO NOTHING;
