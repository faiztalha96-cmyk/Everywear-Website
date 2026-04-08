-- Migration: Add position column for category ordering
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Update existing categories to have a distinct position (optional, but helps with ordering)
WITH ranked_categories AS (
  SELECT id, row_number() OVER (ORDER BY name ASC) as new_position
  FROM public.categories
)
UPDATE public.categories
SET position = ranked_categories.new_position
FROM ranked_categories
WHERE public.categories.id = ranked_categories.id;
