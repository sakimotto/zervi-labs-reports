-- ============================================================================
-- Phase 1: Extend test_items with method-level metadata
-- ============================================================================

ALTER TABLE public.test_items
  ADD COLUMN IF NOT EXISTS method_code TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Draft',
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS scope TEXT,
  ADD COLUMN IF NOT EXISTS principle TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill method codes for existing rows (CAT-001 style based on category)
DO $$
DECLARE
  rec RECORD;
  cat_prefix TEXT;
  counter INT;
BEGIN
  FOR rec IN
    SELECT id, category FROM public.test_items WHERE method_code IS NULL ORDER BY category, id
  LOOP
    cat_prefix := UPPER(LEFT(REGEXP_REPLACE(rec.category, '[^A-Za-z]', '', 'g'), 3));
    IF cat_prefix = '' THEN cat_prefix := 'GEN'; END IF;
    SELECT COUNT(*) + 1 INTO counter FROM public.test_items
      WHERE method_code LIKE cat_prefix || '-%';
    UPDATE public.test_items
      SET method_code = cat_prefix || '-' || LPAD(counter::TEXT, 3, '0')
      WHERE id = rec.id;
  END LOOP;
END $$;

ALTER TABLE public.test_items
  ALTER COLUMN method_code SET NOT NULL,
  ADD CONSTRAINT test_items_method_code_unique UNIQUE (method_code),
  ADD CONSTRAINT test_items_status_check CHECK (status IN ('Draft', 'Active', 'Archived'));

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_test_items_updated_at ON public.test_items;
CREATE TRIGGER trg_test_items_updated_at
  BEFORE UPDATE ON public.test_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Phase 2: New relational tables
-- ============================================================================

-- Method versions (full historical snapshots)
CREATE TABLE public.method_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_item_id INTEGER NOT NULL REFERENCES public.test_items(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Archived', 'Superseded')),
  change_notes TEXT,
  snapshot JSONB,
  prepared_by TEXT,
  reviewed_by TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  effective_date DATE,
  superseded_by UUID REFERENCES public.method_versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (test_item_id, version_number)
);
CREATE INDEX idx_method_versions_test_item ON public.method_versions(test_item_id);

-- Multiple standards per method
CREATE TABLE public.method_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_item_id INTEGER NOT NULL REFERENCES public.test_items(id) ON DELETE CASCADE,
  standard_id UUID REFERENCES public.standards(id) ON DELETE SET NULL,
  standard_text TEXT,
  year TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_method_standards_test_item ON public.method_standards(test_item_id);

-- Equipment requirements per method
CREATE TABLE public.method_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_item_id INTEGER NOT NULL REFERENCES public.test_items(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
  equipment_type TEXT,
  model_required TEXT,
  attachment TEXT,
  calibration_required BOOLEAN NOT NULL DEFAULT true,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_method_equipment_test_item ON public.method_equipment(test_item_id);

-- Test directions with per-direction specimen counts
CREATE TABLE public.method_directions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_item_id INTEGER NOT NULL REFERENCES public.test_items(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('Warp', 'Weft', 'Machine', 'Cross', 'Bias', 'None')),
  specimens_per_direction INTEGER NOT NULL DEFAULT 3,
  notes TEXT,
  UNIQUE (test_item_id, direction)
);
CREATE INDEX idx_method_directions_test_item ON public.method_directions(test_item_id);

-- Conditioning requirements
CREATE TABLE public.method_conditioning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_item_id INTEGER NOT NULL REFERENCES public.test_items(id) ON DELETE CASCADE,
  conditioning_profile_id UUID REFERENCES public.conditioning_profiles(id) ON DELETE SET NULL,
  temperature_c NUMERIC,
  temperature_tolerance NUMERIC,
  humidity_percent NUMERIC,
  humidity_tolerance NUMERIC,
  duration_hours NUMERIC,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_method_conditioning_test_item ON public.method_conditioning(test_item_id);

-- Procedure steps (ordered, reorderable)
CREATE TABLE public.method_procedure_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_item_id INTEGER NOT NULL REFERENCES public.test_items(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction_text TEXT NOT NULL,
  image_url TEXT,
  expected_duration_minutes INTEGER,
  warning_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_method_procedure_test_item ON public.method_procedure_steps(test_item_id);

-- Flexible key-value parameters
CREATE TABLE public.method_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_item_id INTEGER NOT NULL REFERENCES public.test_items(id) ON DELETE CASCADE,
  param_name TEXT NOT NULL,
  param_value TEXT,
  unit TEXT,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);
CREATE INDEX idx_method_parameters_test_item ON public.method_parameters(test_item_id);

-- Calculations (formula and result formatting)
CREATE TABLE public.method_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_item_id INTEGER NOT NULL REFERENCES public.test_items(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  formula_text TEXT,
  result_unit TEXT,
  decimals INTEGER NOT NULL DEFAULT 2,
  rounding_rule TEXT NOT NULL DEFAULT 'half-up' CHECK (rounding_rule IN ('half-up', 'half-down', 'half-even', 'truncate', 'ceiling', 'floor')),
  display_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);
CREATE INDEX idx_method_calculations_test_item ON public.method_calculations(test_item_id);

-- Acceptance/spec limits
CREATE TABLE public.method_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_item_id INTEGER NOT NULL REFERENCES public.test_items(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  min_value NUMERIC,
  max_value NUMERIC,
  unit TEXT,
  specification_ref TEXT,
  measurement_uncertainty NUMERIC,
  qc_frequency TEXT,
  qc_reference_material TEXT,
  notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_method_acceptance_test_item ON public.method_acceptance(test_item_id);

-- Immutable audit log
CREATE TABLE public.method_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_item_id INTEGER NOT NULL REFERENCES public.test_items(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  changed_by UUID,
  changed_by_name TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_method_audit_test_item ON public.method_audit(test_item_id);
CREATE INDEX idx_method_audit_created ON public.method_audit(created_at DESC);

-- ============================================================================
-- Phase 3: Enable RLS + policies for all new tables
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'method_versions', 'method_standards', 'method_equipment',
    'method_directions', 'method_conditioning', 'method_procedure_steps',
    'method_parameters', 'method_calculations', 'method_acceptance'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    EXECUTE format('CREATE POLICY "Authenticated read %I" ON public.%I FOR SELECT TO authenticated USING (true)', tbl, tbl);

    EXECUTE format('CREATE POLICY "Staff insert %I" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''::app_role) OR public.has_role(auth.uid(), ''lab_tech''::app_role))', tbl, tbl);

    EXECUTE format('CREATE POLICY "Staff update %I" ON public.%I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role) OR public.has_role(auth.uid(), ''lab_tech''::app_role)) WITH CHECK (public.has_role(auth.uid(), ''admin''::app_role) OR public.has_role(auth.uid(), ''lab_tech''::app_role))', tbl, tbl);

    EXECUTE format('CREATE POLICY "Admins delete %I" ON public.%I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role))', tbl, tbl);

    -- Restrictive viewer denies
    EXECUTE format('CREATE POLICY "Deny viewer insert %I" ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (NOT public.has_role(auth.uid(), ''viewer''::app_role) OR public.has_role(auth.uid(), ''admin''::app_role) OR public.has_role(auth.uid(), ''lab_tech''::app_role))', tbl, tbl);

    EXECUTE format('CREATE POLICY "Deny viewer update %I" ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING (NOT public.has_role(auth.uid(), ''viewer''::app_role) OR public.has_role(auth.uid(), ''admin''::app_role) OR public.has_role(auth.uid(), ''lab_tech''::app_role)) WITH CHECK (NOT public.has_role(auth.uid(), ''viewer''::app_role) OR public.has_role(auth.uid(), ''admin''::app_role) OR public.has_role(auth.uid(), ''lab_tech''::app_role))', tbl, tbl);

    EXECUTE format('CREATE POLICY "Deny viewer delete %I" ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING (NOT public.has_role(auth.uid(), ''viewer''::app_role) OR public.has_role(auth.uid(), ''admin''::app_role))', tbl, tbl);
  END LOOP;
END $$;

-- Audit table: immutable (insert only by staff, no updates/deletes)
ALTER TABLE public.method_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read method_audit" ON public.method_audit
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff insert method_audit" ON public.method_audit
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'lab_tech'::app_role));

-- Audit log is immutable: no update / no delete policies = no access