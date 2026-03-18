
-- Standards table (ISO, JIS, ASTM, etc.)
CREATE TABLE public.standards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL,
  version text,
  title text,
  organization text NOT NULL DEFAULT 'ISO',
  document_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.standards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read standards" ON public.standards FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert standards" ON public.standards FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update standards" ON public.standards FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete standards" ON public.standards FOR DELETE TO public USING (true);

-- OEM Specifications table
CREATE TABLE public.oem_specifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  oem_brand text NOT NULL,
  spec_code text NOT NULL,
  version text,
  title text,
  region text DEFAULT 'Global',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.oem_specifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read oem_specifications" ON public.oem_specifications FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert oem_specifications" ON public.oem_specifications FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update oem_specifications" ON public.oem_specifications FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete oem_specifications" ON public.oem_specifications FOR DELETE TO public USING (true);

-- Conditioning Profiles table
CREATE TABLE public.conditioning_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  temperature_c numeric,
  humidity_percent numeric,
  duration_hours integer,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conditioning_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read conditioning_profiles" ON public.conditioning_profiles FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert conditioning_profiles" ON public.conditioning_profiles FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update conditioning_profiles" ON public.conditioning_profiles FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete conditioning_profiles" ON public.conditioning_profiles FOR DELETE TO public USING (true);

-- Add FK columns to existing tables
ALTER TABLE public.test_items ADD COLUMN standard_id uuid REFERENCES public.standards(id) ON DELETE SET NULL;

ALTER TABLE public.samples ADD COLUMN supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL;
ALTER TABLE public.samples ADD COLUMN oem_specification_id uuid REFERENCES public.oem_specifications(id) ON DELETE SET NULL;

ALTER TABLE public.test_requirements ADD COLUMN oem_specification_id uuid REFERENCES public.oem_specifications(id) ON DELETE SET NULL;

ALTER TABLE public.test_programs ADD COLUMN oem_specification_id uuid REFERENCES public.oem_specifications(id) ON DELETE SET NULL;

ALTER TABLE public.test_program_items ADD COLUMN conditioning_profile_id uuid REFERENCES public.conditioning_profiles(id) ON DELETE SET NULL;

ALTER TABLE public.test_results ADD COLUMN conditioning_profile_id uuid REFERENCES public.conditioning_profiles(id) ON DELETE SET NULL;
ALTER TABLE public.test_results ADD COLUMN equipment_id uuid REFERENCES public.equipment(id) ON DELETE SET NULL;
ALTER TABLE public.test_results ADD COLUMN calibration_record_id uuid REFERENCES public.calibration_records(id) ON DELETE SET NULL;
ALTER TABLE public.test_results ADD COLUMN sop_version_id uuid REFERENCES public.sop_versions(id) ON DELETE SET NULL;
ALTER TABLE public.test_results ADD COLUMN failure_mode text;
ALTER TABLE public.test_results ADD COLUMN environment_notes text;
