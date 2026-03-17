
-- Test Programs: reusable templates defining which tests to run + report layout
CREATE TABLE public.test_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  material_type text,  -- e.g. 'Poly-Cotton Canvas', 'PVC Synthetic Leather'
  report_title text,   -- Custom report header
  report_columns jsonb DEFAULT '["test_name","unit","requirement","x1","x2","x3","average","judgment"]'::jsonb,
  report_header_notes text,  -- Appears at top of report
  report_footer_notes text,  -- Appears at bottom of report
  show_signatures boolean DEFAULT true,
  signature_roles jsonb DEFAULT '["Tested By","Reviewed By","Approved By"]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Which test items belong to a program (with ordering)
CREATE TABLE public.test_program_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.test_programs(id) ON DELETE CASCADE,
  test_item_id integer NOT NULL REFERENCES public.test_items(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  include_in_report boolean DEFAULT true,
  notes text,
  UNIQUE(program_id, test_item_id)
);

-- Per-sample override: which test items are assigned to this specific sample
CREATE TABLE public.sample_test_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id uuid NOT NULL REFERENCES public.samples(id) ON DELETE CASCADE,
  test_item_id integer NOT NULL REFERENCES public.test_items(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  include_in_report boolean DEFAULT true,
  UNIQUE(sample_id, test_item_id)
);

-- Add test_program_id to samples
ALTER TABLE public.samples ADD COLUMN test_program_id uuid REFERENCES public.test_programs(id);

-- RLS for test_programs
ALTER TABLE public.test_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read test_programs" ON public.test_programs FOR SELECT USING (true);
CREATE POLICY "Allow public insert test_programs" ON public.test_programs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update test_programs" ON public.test_programs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete test_programs" ON public.test_programs FOR DELETE USING (true);

-- RLS for test_program_items
ALTER TABLE public.test_program_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read test_program_items" ON public.test_program_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert test_program_items" ON public.test_program_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update test_program_items" ON public.test_program_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete test_program_items" ON public.test_program_items FOR DELETE USING (true);

-- RLS for sample_test_items
ALTER TABLE public.sample_test_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read sample_test_items" ON public.sample_test_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert sample_test_items" ON public.sample_test_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update sample_test_items" ON public.sample_test_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete sample_test_items" ON public.sample_test_items FOR DELETE USING (true);

-- Updated_at triggers
CREATE TRIGGER update_test_programs_updated_at BEFORE UPDATE ON public.test_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
