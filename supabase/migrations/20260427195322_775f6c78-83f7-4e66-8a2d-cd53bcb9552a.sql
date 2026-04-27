-- 1. Add traceability/commercial reference columns on customer_test_requests
ALTER TABLE public.customer_test_requests
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS batch_number TEXT,
  ADD COLUMN IF NOT EXISTS sales_order_number TEXT,
  ADD COLUMN IF NOT EXISTS delivery_note_number TEXT,
  ADD COLUMN IF NOT EXISTS customer_reference TEXT;

CREATE INDEX IF NOT EXISTS idx_ctr_po_number ON public.customer_test_requests(po_number);
CREATE INDEX IF NOT EXISTS idx_ctr_sales_order ON public.customer_test_requests(sales_order_number);
CREATE INDEX IF NOT EXISTS idx_ctr_delivery_note ON public.customer_test_requests(delivery_note_number);
CREATE INDEX IF NOT EXISTS idx_ctr_batch_number ON public.customer_test_requests(batch_number);
CREATE INDEX IF NOT EXISTS idx_ctr_sku ON public.customer_test_requests(sku);

-- 2. Per-material override columns on test_request_materials
ALTER TABLE public.test_request_materials
  ADD COLUMN IF NOT EXISTS sku_override TEXT,
  ADD COLUMN IF NOT EXISTS batch_number TEXT;

-- 3. Update validation trigger with smart conditional rules + length limits
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

  -- Length limits on traceability fields
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

  -- Smart conditional requirements (warnings via exception only when clearly wrong)
  IF NEW.request_type = 'incoming_goods'
     AND (NEW.po_number IS NULL OR length(trim(NEW.po_number)) = 0)
     AND (NEW.delivery_note_number IS NULL OR length(trim(NEW.delivery_note_number)) = 0) THEN
    RAISE EXCEPTION 'Incoming-goods requests need either a PO number or a delivery note number for traceability';
  END IF;

  RETURN NEW;
END;
$function$;
