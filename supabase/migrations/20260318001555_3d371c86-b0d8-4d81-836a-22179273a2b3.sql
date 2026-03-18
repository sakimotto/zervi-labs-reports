
-- Equipment table
CREATE TABLE public.equipment (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  model text,
  serial_number text,
  manufacturer text,
  category text NOT NULL DEFAULT 'General',
  location text,
  assigned_operator text,
  status text NOT NULL DEFAULT 'Active',
  purchase_date date,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read equipment" ON public.equipment FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert equipment" ON public.equipment FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update equipment" ON public.equipment FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete equipment" ON public.equipment FOR DELETE TO public USING (true);

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Calibration records
CREATE TABLE public.calibration_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  calibration_date date NOT NULL,
  next_due_date date,
  performed_by text,
  certificate_number text,
  status text NOT NULL DEFAULT 'In Cal',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calibration_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read calibration_records" ON public.calibration_records FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert calibration_records" ON public.calibration_records FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update calibration_records" ON public.calibration_records FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete calibration_records" ON public.calibration_records FOR DELETE TO public USING (true);

-- Maintenance logs
CREATE TABLE public.maintenance_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  maintenance_date date NOT NULL,
  maintenance_type text NOT NULL DEFAULT 'Preventive',
  description text,
  parts_replaced text,
  downtime_hours numeric,
  performed_by text,
  cost numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read maintenance_logs" ON public.maintenance_logs FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert maintenance_logs" ON public.maintenance_logs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update maintenance_logs" ON public.maintenance_logs FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete maintenance_logs" ON public.maintenance_logs FOR DELETE TO public USING (true);

-- Equipment ↔ Test Item linkage
CREATE TABLE public.equipment_test_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  test_item_id integer NOT NULL REFERENCES public.test_items(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  UNIQUE(equipment_id, test_item_id)
);

ALTER TABLE public.equipment_test_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read equipment_test_items" ON public.equipment_test_items FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert equipment_test_items" ON public.equipment_test_items FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update equipment_test_items" ON public.equipment_test_items FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete equipment_test_items" ON public.equipment_test_items FOR DELETE TO public USING (true);

-- Materials table
CREATE TABLE public.materials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  material_type text NOT NULL DEFAULT 'Fabric',
  weight_gsm numeric,
  width_cm numeric,
  composition text,
  color text,
  finish text,
  default_test_program_id uuid REFERENCES public.test_programs(id) ON DELETE SET NULL,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read materials" ON public.materials FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert materials" ON public.materials FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update materials" ON public.materials FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete materials" ON public.materials FOR DELETE TO public USING (true);

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Material ↔ Supplier linkage
CREATE TABLE public.material_suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  grade text,
  unit_price numeric,
  notes text,
  UNIQUE(material_id, supplier_id)
);

ALTER TABLE public.material_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read material_suppliers" ON public.material_suppliers FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert material_suppliers" ON public.material_suppliers FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update material_suppliers" ON public.material_suppliers FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete material_suppliers" ON public.material_suppliers FOR DELETE TO public USING (true);

-- Add material_id to samples for linkage
ALTER TABLE public.samples ADD COLUMN material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL;
