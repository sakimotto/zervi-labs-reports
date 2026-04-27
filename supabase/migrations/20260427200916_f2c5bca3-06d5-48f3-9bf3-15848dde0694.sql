-- Add is_temp_sku tracking to requests and add sku + is_temp_sku to samples
ALTER TABLE public.customer_test_requests
  ADD COLUMN IF NOT EXISTS is_temp_sku boolean NOT NULL DEFAULT false;

ALTER TABLE public.samples
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS is_temp_sku boolean NOT NULL DEFAULT false;

-- Length cap on samples.sku via validation trigger (samples has none yet for this field)
CREATE OR REPLACE FUNCTION public.validate_sample_sku()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.sku IS NOT NULL AND length(NEW.sku) > 100 THEN
    RAISE EXCEPTION 'sku must be 100 characters or less';
  END IF;
  -- Soft convention: temp SKUs should start with TMP-
  IF NEW.is_temp_sku = true AND NEW.sku IS NOT NULL
     AND length(trim(NEW.sku)) > 0
     AND NEW.sku NOT ILIKE 'TMP-%' THEN
    RAISE EXCEPTION 'Temporary SKUs must start with TMP-';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_sample_sku ON public.samples;
CREATE TRIGGER trg_validate_sample_sku
  BEFORE INSERT OR UPDATE ON public.samples
  FOR EACH ROW EXECUTE FUNCTION public.validate_sample_sku();

-- Update the existing customer_test_requests validator to enforce TMP- prefix when is_temp_sku
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

  IF NEW.sku IS NOT NULL AND length(NEW.sku) > 100 THEN
    RAISE EXCEPTION 'sku must be 100 characters or less';
  END IF;
  IF NEW.batch_number IS NOT NULL AND length(NEW.batch_number) > 100 THEN
    RAISE EXCEPTION 'batch_number must be 100 characters or less';
  END IF;
  IF NEW.po_number IS NOT NULL AND length(NEW.po_number) > 100 THEN
    RAISE EXCEPTION 'po_number must be 100 characters or less';
  END IF;
  IF NEW.sales_order_number IS NOT NULL AND length(NEW.sales_order_number) > 100 THEN
    RAISE EXCEPTION 'sales_order_number must be 100 characters or less';
  END IF;
  IF NEW.delivery_note_number IS NOT NULL AND length(NEW.delivery_note_number) > 100 THEN
    RAISE EXCEPTION 'delivery_note_number must be 100 characters or less';
  END IF;
  IF NEW.customer_reference IS NOT NULL AND length(NEW.customer_reference) > 100 THEN
    RAISE EXCEPTION 'customer_reference must be 100 characters or less';
  END IF;

  IF NEW.request_type = 'incoming_goods'
     AND (NEW.po_number IS NULL OR length(trim(NEW.po_number)) = 0)
     AND (NEW.delivery_note_number IS NULL OR length(trim(NEW.delivery_note_number)) = 0) THEN
    RAISE EXCEPTION 'Incoming-goods requests need either a PO number or a delivery note number for traceability';
  END IF;

  -- Enforce TMP- prefix when flagged temporary
  IF NEW.is_temp_sku = true AND NEW.sku IS NOT NULL
     AND length(trim(NEW.sku)) > 0
     AND NEW.sku NOT ILIKE 'TMP-%' THEN
    RAISE EXCEPTION 'Temporary SKUs must start with TMP-';
  END IF;

  RETURN NEW;
END;
$function$;

-- Indexes for SKU lookup performance
CREATE INDEX IF NOT EXISTS idx_materials_sku_lookup ON public.materials (lower(material_code));
CREATE INDEX IF NOT EXISTS idx_materials_name_lookup ON public.materials (lower(name));
CREATE INDEX IF NOT EXISTS idx_ctr_is_temp_sku ON public.customer_test_requests (is_temp_sku) WHERE is_temp_sku = true;
CREATE INDEX IF NOT EXISTS idx_samples_is_temp_sku ON public.samples (is_temp_sku) WHERE is_temp_sku = true;
