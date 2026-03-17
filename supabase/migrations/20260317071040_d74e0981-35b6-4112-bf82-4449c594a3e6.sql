
-- Create enums
CREATE TYPE public.base_type AS ENUM ('Solvent', 'Water-Based');
CREATE TYPE public.judgment AS ENUM ('OK', 'NG', 'Pending');
CREATE TYPE public.sample_status AS ENUM ('Pending', 'In Progress', 'Completed', 'Approved');
CREATE TYPE public.priority_level AS ENUM ('Normal', 'Urgent', 'Critical');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1. Samples table
CREATE TABLE public.samples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sample_id TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  composition TEXT DEFAULT 'PVC',
  color TEXT,
  fabric_type TEXT DEFAULT 'PVC',
  base_type public.base_type DEFAULT 'Solvent',
  batch_number TEXT,
  supplier_name TEXT,
  application TEXT,
  oem_brand TEXT,
  received_date DATE,
  test_date DATE,
  test_conditions TEXT,
  technical_regulation TEXT,
  standard_requirement TEXT,
  status public.sample_status DEFAULT 'Pending',
  priority public.priority_level DEFAULT 'Normal',
  requested_by TEXT,
  overall_judgment public.judgment DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read samples" ON public.samples FOR SELECT USING (true);
CREATE POLICY "Allow public insert samples" ON public.samples FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update samples" ON public.samples FOR UPDATE USING (true);
CREATE POLICY "Allow public delete samples" ON public.samples FOR DELETE USING (true);

CREATE TRIGGER update_samples_updated_at
  BEFORE UPDATE ON public.samples
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Test items table
CREATE TABLE public.test_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT,
  testing_standard TEXT,
  direction_required BOOLEAN DEFAULT FALSE,
  multiple_samples BOOLEAN DEFAULT TRUE,
  sample_count INTEGER DEFAULT 3,
  aging_condition TEXT,
  equipment_required TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.test_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read test_items" ON public.test_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert test_items" ON public.test_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update test_items" ON public.test_items FOR UPDATE USING (true);

-- 3. Test requirements
CREATE TABLE public.test_requirements (
  id SERIAL PRIMARY KEY,
  test_item_id INTEGER REFERENCES public.test_items(id) ON DELETE CASCADE,
  oem_brand TEXT,
  standard_code TEXT,
  direction TEXT,
  min_value DECIMAL(10,2),
  max_value DECIMAL(10,2),
  target_value DECIMAL(10,2),
  requirement_text TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.test_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read test_requirements" ON public.test_requirements FOR SELECT USING (true);
CREATE POLICY "Allow public insert test_requirements" ON public.test_requirements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update test_requirements" ON public.test_requirements FOR UPDATE USING (true);

-- 4. Test results
CREATE TABLE public.test_results (
  id SERIAL PRIMARY KEY,
  sample_id UUID REFERENCES public.samples(id) ON DELETE CASCADE,
  test_item_id INTEGER REFERENCES public.test_items(id) ON DELETE CASCADE,
  direction TEXT,
  sample_1 DECIMAL(10,2),
  sample_2 DECIMAL(10,2),
  sample_3 DECIMAL(10,2),
  sample_4 DECIMAL(10,2),
  sample_5 DECIMAL(10,2),
  sample_6 DECIMAL(10,2),
  average_value DECIMAL(10,2),
  max_value DECIMAL(10,2),
  result_text TEXT,
  judgment public.judgment DEFAULT 'Pending',
  tested_by TEXT,
  tested_date DATE,
  equipment_used TEXT,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read test_results" ON public.test_results FOR SELECT USING (true);
CREATE POLICY "Allow public insert test_results" ON public.test_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update test_results" ON public.test_results FOR UPDATE USING (true);
CREATE POLICY "Allow public delete test_results" ON public.test_results FOR DELETE USING (true);

CREATE TRIGGER update_test_results_updated_at
  BEFORE UPDATE ON public.test_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_samples_status ON public.samples(status);
CREATE INDEX idx_samples_oem ON public.samples(oem_brand);
CREATE INDEX idx_test_results_sample ON public.test_results(sample_id);
CREATE INDEX idx_test_results_item ON public.test_results(test_item_id);
CREATE INDEX idx_test_requirements_item ON public.test_requirements(test_item_id);
CREATE INDEX idx_test_items_category ON public.test_items(category);
