-- Expand customers table to a business-grade module
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS customer_code text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS secondary_email text,
  ADD COLUMN IF NOT EXISTS address_line text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state_region text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS payment_terms text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS credit_limit numeric,
  ADD COLUMN IF NOT EXISTS rating integer,
  ADD COLUMN IF NOT EXISTS account_manager text,
  ADD COLUMN IF NOT EXISTS notes text;

-- Unique customer code (when set)
CREATE UNIQUE INDEX IF NOT EXISTS customers_customer_code_key
  ON public.customers (customer_code) WHERE customer_code IS NOT NULL;

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_customer()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.name IS NULL OR length(trim(NEW.name)) = 0 THEN
    RAISE EXCEPTION 'Customer name is required';
  END IF;
  IF NEW.customer_type NOT IN ('OEM','Client','Distributor','Internal','Other') THEN
    RAISE EXCEPTION 'Invalid customer_type: %', NEW.customer_type;
  END IF;
  IF NEW.status NOT IN ('Active','On Hold','Inactive','Prospect') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF NEW.rating IS NOT NULL AND (NEW.rating < 1 OR NEW.rating > 5) THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;
  IF NEW.credit_limit IS NOT NULL AND NEW.credit_limit < 0 THEN
    RAISE EXCEPTION 'credit_limit must be non-negative';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_customer ON public.customers;
CREATE TRIGGER trg_validate_customer
  BEFORE INSERT OR UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.validate_customer();

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link samples to customers (in addition to existing oem_brand text)
ALTER TABLE public.samples
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_samples_customer ON public.samples(customer_id);
