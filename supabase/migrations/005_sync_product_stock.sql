-- EVERYWEAR STOCK SYNCHRONIZATION
-- This migration ensures that products.stock_quantity is always equal 
-- to the sum of its variant stocks.

-- 1. Create the synchronization function
CREATE OR REPLACE FUNCTION public.sync_product_stock_sum()
RETURNS TRIGGER AS $$
BEGIN
  -- We sum the stock of all variants for the product_id involved in the change
  -- and update the products table's stock_quantity.
  
  -- Use COALESCE in CASE there are no variants left (sum will be NULL)
  UPDATE public.products
  SET stock_quantity = (
    SELECT COALESCE(SUM(stock), 0)
    FROM public.product_variants
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
  )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN NULL; -- AFTER trigger can return NULL
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on product_variants
DROP TRIGGER IF EXISTS trig_sync_product_stock ON public.product_variants;
CREATE TRIGGER trig_sync_product_stock
AFTER INSERT OR UPDATE OR DELETE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.sync_product_stock_sum();

-- 3. One-time backfill for existing products
-- This synchronizes all current products with their variant sums
UPDATE public.products p
SET stock_quantity = (
  SELECT COALESCE(SUM(stock), 0)
  FROM public.product_variants v
  WHERE v.product_id = p.id
)
WHERE EXISTS (
  SELECT 1 
  FROM public.product_variants v 
  WHERE v.product_id = p.id
);

-- Note: We only update products that HAVE variants. 
-- Simple products without variants remain as they are.
