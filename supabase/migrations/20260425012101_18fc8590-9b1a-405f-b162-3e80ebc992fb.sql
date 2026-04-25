-- Phase out the redundant testing_standard text column on test_items.
-- The canonical source for a method's standards is now method_standards
-- (with is_primary = true marking the principal one).
ALTER TABLE public.test_items DROP COLUMN IF EXISTS testing_standard;