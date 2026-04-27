-- 1. Extend customer_test_requests with origin + scope fields
ALTER TABLE public.customer_test_requests
  ADD COLUMN IF NOT EXISTS request_type TEXT NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS internal_department TEXT,
  ADD COLUMN IF NOT EXISTS test_program_id UUID REFERENCES public.test_programs(id) ON DELETE SET NULL;

ALTER TABLE public.customer_test_requests
  ALTER COLUMN customer_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ctr_request_type ON public.customer_test_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_ctr_supplier_id ON public.customer_test_requests(supplier_id);
CREATE INDEX IF NOT EXISTS idx_ctr_test_program_id ON public.customer_test_requests(test_program_id);

-- 2. Update validation trigger
CREATE OR REPLACE FUNCTION public.validate_customer_test_request()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.priority NOT IN ('Low','Normal','High','Urgent') THEN
    RAISE EXCEPTION 'Invalid priority: %', NEW.priority;
  END IF;
  IF NEW.status NOT IN ('Requested','Quoted','Approved','In Progress','Completed','Reported','Cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF NEW.due_date IS NOT NULL AND NEW.requested_date IS NOT NULL AND NEW.due_date < NEW.requested_date THEN
    RAISE EXCEPTION 'due_date cannot be before requested_date';
  END IF;
  IF NEW.request_type NOT IN ('customer','supplier','incoming_goods','internal_qa','production_issue','rd_trial') THEN
    RAISE EXCEPTION 'Invalid request_type: %', NEW.request_type;
  END IF;
  IF NEW.request_type = 'customer' AND NEW.customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer requests must have a customer_id';
  END IF;
  IF NEW.request_type = 'supplier' AND NEW.supplier_id IS NULL THEN
    RAISE EXCEPTION 'Supplier requests must have a supplier_id';
  END IF;
  IF NEW.request_type IN ('incoming_goods','internal_qa','production_issue','rd_trial')
     AND (NEW.internal_department IS NULL OR length(trim(NEW.internal_department)) = 0) THEN
    RAISE EXCEPTION 'Internal-origin requests must have an internal_department';
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Join table: test_request_methods
CREATE TABLE IF NOT EXISTS public.test_request_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.customer_test_requests(id) ON DELETE CASCADE,
  test_item_id INTEGER NOT NULL REFERENCES public.test_items(id) ON DELETE CASCADE,
  direction TEXT,
  notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (request_id, test_item_id, direction)
);

CREATE INDEX IF NOT EXISTS idx_trm_request_id ON public.test_request_methods(request_id);
CREATE INDEX IF NOT EXISTS idx_trm_test_item_id ON public.test_request_methods(test_item_id);

ALTER TABLE public.test_request_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view request methods"
  ON public.test_request_methods FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Lab staff can manage request methods"
  ON public.test_request_methods FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'lab_tech'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'lab_tech'));

CREATE TRIGGER update_test_request_methods_updated_at
  BEFORE UPDATE ON public.test_request_methods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Join table: test_request_materials
CREATE TABLE IF NOT EXISTS public.test_request_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.customer_test_requests(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  quantity TEXT,
  notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (request_id, material_id)
);

CREATE INDEX IF NOT EXISTS idx_trmat_request_id ON public.test_request_materials(request_id);
CREATE INDEX IF NOT EXISTS idx_trmat_material_id ON public.test_request_materials(material_id);

ALTER TABLE public.test_request_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view request materials"
  ON public.test_request_materials FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Lab staff can manage request materials"
  ON public.test_request_materials FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'lab_tech'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'lab_tech'));

CREATE TRIGGER update_test_request_materials_updated_at
  BEFORE UPDATE ON public.test_request_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();