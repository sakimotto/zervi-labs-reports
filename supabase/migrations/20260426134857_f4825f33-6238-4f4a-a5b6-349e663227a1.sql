-- Expand suppliers with business fields
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS supplier_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS supplier_type text NOT NULL DEFAULT 'Manufacturer',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Active',
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
  ADD COLUMN IF NOT EXISTS rating integer,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text;

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_supplier()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.name IS NULL OR length(trim(NEW.name)) = 0 THEN
    RAISE EXCEPTION 'Supplier name is required';
  END IF;
  IF NEW.rating IS NOT NULL AND (NEW.rating < 1 OR NEW.rating > 5) THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;
  IF NEW.supplier_type NOT IN ('Manufacturer','Distributor','Trader','Service Provider','Other') THEN
    RAISE EXCEPTION 'Invalid supplier_type: %', NEW.supplier_type;
  END IF;
  IF NEW.status NOT IN ('Active','On Hold','Inactive','Blacklisted') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF NEW.approval_status NOT IN ('Pending','Approved','Rejected') THEN
    RAISE EXCEPTION 'Invalid approval_status: %', NEW.approval_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_supplier ON public.suppliers;
CREATE TRIGGER trg_validate_supplier
  BEFORE INSERT OR UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.validate_supplier();

-- Documents / certifications table
CREATE TABLE IF NOT EXISTS public.supplier_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_number text,
  issuer text,
  valid_from date,
  valid_to date,
  document_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_documents_supplier ON public.supplier_documents(supplier_id);

ALTER TABLE public.supplier_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read supplier_documents"
  ON public.supplier_documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff insert supplier_documents"
  ON public.supplier_documents FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role));

CREATE POLICY "Staff update supplier_documents"
  ON public.supplier_documents FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role));

CREATE POLICY "Admins delete supplier_documents"
  ON public.supplier_documents FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_supplier_documents_updated_at
  BEFORE UPDATE ON public.supplier_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();