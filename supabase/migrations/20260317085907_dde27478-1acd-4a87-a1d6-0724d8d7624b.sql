
-- Suppliers table
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read suppliers" ON public.suppliers FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert suppliers" ON public.suppliers FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update suppliers" ON public.suppliers FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete suppliers" ON public.suppliers FOR DELETE TO public USING (true);

-- Customers table (OEM brands + direct clients)
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  customer_type text NOT NULL DEFAULT 'OEM' CHECK (customer_type IN ('OEM', 'Client')),
  contact_person text,
  email text,
  phone text,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read customers" ON public.customers FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert customers" ON public.customers FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update customers" ON public.customers FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete customers" ON public.customers FOR DELETE TO public USING (true);

-- SOPs table
CREATE TABLE public.sops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  test_item_id integer REFERENCES public.test_items(id),
  current_version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Under Review', 'Approved', 'Archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read sops" ON public.sops FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert sops" ON public.sops FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update sops" ON public.sops FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete sops" ON public.sops FOR DELETE TO public USING (true);

-- SOP versions table (version history)
CREATE TABLE public.sop_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id uuid NOT NULL REFERENCES public.sops(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  content text NOT NULL DEFAULT '',
  equipment_settings text,
  safety_notes text,
  prepared_by text,
  approved_by text,
  approved_at timestamptz,
  change_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sop_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read sop_versions" ON public.sop_versions FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert sop_versions" ON public.sop_versions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update sop_versions" ON public.sop_versions FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete sop_versions" ON public.sop_versions FOR DELETE TO public USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sops_updated_at BEFORE UPDATE ON public.sops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add delete policy for test_items (was missing)
CREATE POLICY "Allow public delete test_items" ON public.test_items FOR DELETE TO public USING (true);

-- Add delete policy for test_requirements (was missing)
CREATE POLICY "Allow public delete test_requirements" ON public.test_requirements FOR DELETE TO public USING (true);
