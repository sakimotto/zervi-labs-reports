-- 1. Audit table
CREATE TABLE IF NOT EXISTS public.test_request_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.customer_test_requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  changed_by UUID,
  changed_by_name TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tra_request_id ON public.test_request_audit(request_id);
CREATE INDEX IF NOT EXISTS idx_tra_created_at ON public.test_request_audit(created_at DESC);

ALTER TABLE public.test_request_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view request audit"
  ON public.test_request_audit FOR SELECT
  TO authenticated USING (true);

-- 2. Audit trigger on customer_test_requests (insert/update/delete)
CREATE OR REPLACE FUNCTION public.audit_test_request_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_changed jsonb := '{}'::jsonb;
  k text;
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.test_request_audit(request_id, action, changed_by, changed_by_name, details)
    VALUES (NEW.id, 'created', auth.uid(), public.current_user_email(),
      jsonb_build_object('request_number', NEW.request_number, 'request_type', NEW.request_type, 'status', NEW.status));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.test_request_audit(request_id, action, changed_by, changed_by_name, details)
    VALUES (OLD.id, 'deleted', auth.uid(), public.current_user_email(),
      jsonb_build_object('request_number', OLD.request_number));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD); v_new := to_jsonb(NEW);
    FOR k IN SELECT jsonb_object_keys(v_new) LOOP
      IF k IN ('updated_at','created_at') THEN CONTINUE; END IF;
      IF v_old->k IS DISTINCT FROM v_new->k THEN
        v_changed := v_changed || jsonb_build_object(k, jsonb_build_object('from', v_old->k, 'to', v_new->k));
      END IF;
    END LOOP;
    IF v_changed <> '{}'::jsonb THEN
      INSERT INTO public.test_request_audit(request_id, action, changed_by, changed_by_name, details)
      VALUES (NEW.id,
        CASE WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'status_changed' ELSE 'updated' END,
        auth.uid(), public.current_user_email(),
        jsonb_build_object('changes', v_changed));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trg_audit_test_request ON public.customer_test_requests;
CREATE TRIGGER trg_audit_test_request
  AFTER INSERT OR UPDATE OR DELETE ON public.customer_test_requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_test_request_change();

-- 3. Auto-complete request when all linked samples are Approved
CREATE OR REPLACE FUNCTION public.maybe_complete_request_from_samples()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_request_id UUID;
  v_total INT;
  v_approved INT;
  v_status TEXT;
BEGIN
  v_request_id := COALESCE(NEW.test_request_id, OLD.test_request_id);
  IF v_request_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COUNT(*) , COUNT(*) FILTER (WHERE status = 'Approved')
    INTO v_total, v_approved
    FROM public.samples
    WHERE test_request_id = v_request_id;

  SELECT status INTO v_status FROM public.customer_test_requests WHERE id = v_request_id;

  -- Only advance when all samples done and current status is in early stages
  IF v_total > 0 AND v_approved = v_total
     AND v_status IN ('Requested','Quoted','Approved','In Progress') THEN
    UPDATE public.customer_test_requests
      SET status = 'Completed', updated_at = now()
      WHERE id = v_request_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP TRIGGER IF EXISTS trg_complete_request_from_samples ON public.samples;
CREATE TRIGGER trg_complete_request_from_samples
  AFTER INSERT OR UPDATE OF status, test_request_id OR DELETE ON public.samples
  FOR EACH ROW EXECUTE FUNCTION public.maybe_complete_request_from_samples();

-- 4. Auto-mark request "Reported" when a report is issued/sent
CREATE OR REPLACE FUNCTION public.maybe_mark_request_reported()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.test_request_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.status IN ('Issued','Sent','Acknowledged') THEN
    UPDATE public.customer_test_requests
      SET status = 'Reported', updated_at = now()
      WHERE id = NEW.test_request_id
        AND status NOT IN ('Reported','Cancelled');
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_mark_request_reported ON public.test_reports;
CREATE TRIGGER trg_mark_request_reported
  AFTER INSERT OR UPDATE OF status ON public.test_reports
  FOR EACH ROW EXECUTE FUNCTION public.maybe_mark_request_reported();