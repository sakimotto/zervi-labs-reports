-- ============================================================
-- Expand materials with detailed textile specifications
-- ============================================================
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS material_code text,
  ADD COLUMN IF NOT EXISTS sub_type text,
  ADD COLUMN IF NOT EXISTS structure text,
  ADD COLUMN IF NOT EXISTS pattern text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS country_of_origin text,
  ADD COLUMN IF NOT EXISTS batch_lot text,
  -- Construction
  ADD COLUMN IF NOT EXISTS weave_pattern text,
  ADD COLUMN IF NOT EXISTS warp_yarn_count text,
  ADD COLUMN IF NOT EXISTS weft_yarn_count text,
  ADD COLUMN IF NOT EXISTS warp_density_per_cm numeric,
  ADD COLUMN IF NOT EXISTS weft_density_per_cm numeric,
  ADD COLUMN IF NOT EXISTS thickness_mm numeric,
  ADD COLUMN IF NOT EXISTS gsm_tolerance numeric,
  ADD COLUMN IF NOT EXISTS layers integer,
  ADD COLUMN IF NOT EXISTS coating_type text,
  ADD COLUMN IF NOT EXISTS coating_weight_gsm numeric,
  ADD COLUMN IF NOT EXISTS backing_material text,
  ADD COLUMN IF NOT EXISTS lamination text,
  -- Performance
  ADD COLUMN IF NOT EXISTS stretch_warp_percent numeric,
  ADD COLUMN IF NOT EXISTS stretch_weft_percent numeric,
  ADD COLUMN IF NOT EXISTS abrasion_class text,
  ADD COLUMN IF NOT EXISTS fire_retardant boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS uv_stabilized boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS antimicrobial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS water_repellency_rating text,
  ADD COLUMN IF NOT EXISTS breathability_rating text,
  -- Compliance
  ADD COLUMN IF NOT EXISTS reach_compliant boolean,
  ADD COLUMN IF NOT EXISTS oekotex_class text,
  ADD COLUMN IF NOT EXISTS recycled_content_percent numeric,
  -- Versioning
  ADD COLUMN IF NOT EXISTS current_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'Draft';

-- Constrain enums
DO $$ BEGIN
  ALTER TABLE public.materials ADD CONSTRAINT materials_status_check
    CHECK (status IN ('Active','Draft','Archived','Obsolete'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.materials ADD CONSTRAINT materials_structure_check
    CHECK (structure IS NULL OR structure IN ('Woven','Knit','Nonwoven','Coated','Laminated','Composite','Film','Foam','Other'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.materials ADD CONSTRAINT materials_approval_status_check
    CHECK (approval_status IN ('Draft','Pending','Approved','Rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS materials_material_code_unique
  ON public.materials (material_code) WHERE material_code IS NOT NULL;

-- ============================================================
-- material_certifications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.material_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  certification_type text NOT NULL,
  certificate_number text,
  issuer text,
  valid_from date,
  valid_to date,
  document_url text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS material_certifications_material_idx ON public.material_certifications(material_id);
ALTER TABLE public.material_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read material_certifications" ON public.material_certifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff insert material_certifications" ON public.material_certifications FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'lab_tech'));
CREATE POLICY "Staff update material_certifications" ON public.material_certifications FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'lab_tech')) WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'lab_tech'));
CREATE POLICY "Admins delete material_certifications" ON public.material_certifications FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- ============================================================
-- material_versions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.material_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  status text NOT NULL DEFAULT 'Draft',
  snapshot jsonb,
  change_notes text,
  prepared_by text,
  reviewed_by text,
  approved_by text,
  approved_at timestamptz,
  effective_date date,
  superseded_by uuid REFERENCES public.material_versions(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (material_id, version_number)
);
CREATE INDEX IF NOT EXISTS material_versions_material_idx ON public.material_versions(material_id);
ALTER TABLE public.material_versions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE public.material_versions ADD CONSTRAINT material_versions_status_check
    CHECK (status IN ('Draft','Pending','Active','Archived','Superseded'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE POLICY "Authenticated read material_versions" ON public.material_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff insert material_versions" ON public.material_versions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'lab_tech'));
CREATE POLICY "Staff update material_versions" ON public.material_versions FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'lab_tech')) WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'lab_tech'));
CREATE POLICY "Admins delete material_versions" ON public.material_versions FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- ============================================================
-- material_audit
-- ============================================================
CREATE TABLE IF NOT EXISTS public.material_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  action text NOT NULL,
  changed_by uuid,
  changed_by_name text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS material_audit_material_idx ON public.material_audit(material_id);
ALTER TABLE public.material_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read material_audit" ON public.material_audit FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff insert material_audit" ON public.material_audit FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'lab_tech'));

-- ============================================================
-- material_test_programs (recommended programs M2M)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.material_test_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.test_programs(id) ON DELETE CASCADE,
  priority integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (material_id, program_id)
);
CREATE INDEX IF NOT EXISTS material_test_programs_material_idx ON public.material_test_programs(material_id);
ALTER TABLE public.material_test_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read material_test_programs" ON public.material_test_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff insert material_test_programs" ON public.material_test_programs FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'lab_tech'));
CREATE POLICY "Staff update material_test_programs" ON public.material_test_programs FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'lab_tech')) WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'lab_tech'));
CREATE POLICY "Admins delete material_test_programs" ON public.material_test_programs FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));