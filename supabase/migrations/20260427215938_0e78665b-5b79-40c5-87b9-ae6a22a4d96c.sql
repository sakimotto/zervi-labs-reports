-- ============================================================
-- Production audit fixes — schema layer (notes 1, 2, 5)
-- ============================================================

-- Note 1: customer_test_requests.customer_id  CASCADE -> SET NULL
ALTER TABLE public.customer_test_requests
  DROP CONSTRAINT IF EXISTS customer_test_requests_customer_id_fkey;
ALTER TABLE public.customer_test_requests
  ADD CONSTRAINT customer_test_requests_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;

-- Note 2: samples.test_program_id  NO ACTION -> SET NULL
ALTER TABLE public.samples
  DROP CONSTRAINT IF EXISTS samples_test_program_id_fkey;
ALTER TABLE public.samples
  ADD CONSTRAINT samples_test_program_id_fkey
  FOREIGN KEY (test_program_id) REFERENCES public.test_programs(id) ON DELETE SET NULL;

-- Note 5: test_results.test_item_id  CASCADE -> RESTRICT
-- This is the highest-risk FK. Methods must be deprecated, not deleted.
ALTER TABLE public.test_results
  DROP CONSTRAINT IF EXISTS test_results_test_item_id_fkey;
ALTER TABLE public.test_results
  ADD CONSTRAINT test_results_test_item_id_fkey
  FOREIGN KEY (test_item_id) REFERENCES public.test_items(id) ON DELETE RESTRICT;
