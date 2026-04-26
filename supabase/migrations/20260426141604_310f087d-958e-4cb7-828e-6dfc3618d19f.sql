-- =========================================
-- CUSTOMER TEST REQUESTS
-- =========================================
CREATE TABLE public.customer_test_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  contact_person TEXT,
  contact_email TEXT,
  po_number TEXT,
  requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'Normal',
  status TEXT NOT NULL DEFAULT 'Requested',
  description TEXT,
  scope TEXT,
  materials_description TEXT,
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_by TEXT,
  assigned_to TEXT,
  completed_at TIMESTAMPTZ,
  reported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ctr_customer ON public.customer_test_requests(customer_id);
CREATE INDEX idx_ctr_status ON public.customer_test_requests(status);

-- Validation
CREATE OR REPLACE FUNCTION public.validate_customer_test_request()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
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
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_ctr
BEFORE INSERT OR UPDATE ON public.customer_test_requests
FOR EACH ROW EXECUTE FUNCTION public.validate_customer_test_request();

CREATE TRIGGER trg_ctr_updated_at
BEFORE UPDATE ON public.customer_test_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.customer_test_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read ctr" ON public.customer_test_requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff insert ctr" ON public.customer_test_requests
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'lab_tech'));
CREATE POLICY "Staff update ctr" ON public.customer_test_requests
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'lab_tech'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'lab_tech'));
CREATE POLICY "Admins delete ctr" ON public.customer_test_requests
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- =========================================
-- LINK SAMPLES TO TEST REQUESTS
-- =========================================
ALTER TABLE public.samples
  ADD COLUMN IF NOT EXISTS test_request_id UUID REFERENCES public.customer_test_requests(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_samples_test_request ON public.samples(test_request_id);

-- =========================================
-- TEST REPORTS
-- =========================================
CREATE TABLE public.test_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  test_request_id UUID REFERENCES public.customer_test_requests(id) ON DELETE SET NULL,
  sample_id UUID REFERENCES public.samples(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  issued_date DATE,
  issued_by TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  recipient_email TEXT,
  document_url TEXT,
  summary TEXT,
  overall_judgment TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_customer ON public.test_reports(customer_id);
CREATE INDEX idx_reports_request ON public.test_reports(test_request_id);
CREATE INDEX idx_reports_sample ON public.test_reports(sample_id);
CREATE INDEX idx_reports_status ON public.test_reports(status);

CREATE OR REPLACE FUNCTION public.validate_test_report()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('Draft','Issued','Sent','Acknowledged','Revoked') THEN
    RAISE EXCEPTION 'Invalid report status: %', NEW.status;
  END IF;
  IF NEW.overall_judgment IS NOT NULL AND NEW.overall_judgment NOT IN ('OK','NG','Conditional','Pending') THEN
    RAISE EXCEPTION 'Invalid overall_judgment: %', NEW.overall_judgment;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_test_report
BEFORE INSERT OR UPDATE ON public.test_reports
FOR EACH ROW EXECUTE FUNCTION public.validate_test_report();

CREATE TRIGGER trg_test_report_updated_at
BEFORE UPDATE ON public.test_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read reports" ON public.test_reports
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff insert reports" ON public.test_reports
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'lab_tech'));
CREATE POLICY "Staff update reports" ON public.test_reports
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'lab_tech'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'lab_tech'));
CREATE POLICY "Admins delete reports" ON public.test_reports
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- =========================================
-- AUTO-GENERATE REQUEST NUMBER (CTR-YYYY-NNNN)
-- =========================================
CREATE OR REPLACE FUNCTION public.generate_request_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_year TEXT := to_char(now(),'YYYY');
  v_count INT;
BEGIN
  IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
    SELECT COUNT(*)+1 INTO v_count FROM public.customer_test_requests
    WHERE request_number LIKE 'CTR-' || v_year || '-%';
    NEW.request_number := 'CTR-' || v_year || '-' || lpad(v_count::text,4,'0');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_gen_request_number
BEFORE INSERT ON public.customer_test_requests
FOR EACH ROW EXECUTE FUNCTION public.generate_request_number();

CREATE OR REPLACE FUNCTION public.generate_report_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_year TEXT := to_char(now(),'YYYY');
  v_count INT;
BEGIN
  IF NEW.report_number IS NULL OR NEW.report_number = '' THEN
    SELECT COUNT(*)+1 INTO v_count FROM public.test_reports
    WHERE report_number LIKE 'RPT-' || v_year || '-%';
    NEW.report_number := 'RPT-' || v_year || '-' || lpad(v_count::text,4,'0');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_gen_report_number
BEFORE INSERT ON public.test_reports
FOR EACH ROW EXECUTE FUNCTION public.generate_report_number();