-- ============================================================
-- 1. ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.program_status AS ENUM ('Draft','In Review','Approved','Active','Superseded','Archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.program_approval_action AS ENUM ('submitted','approved','rejected','withdrawn','revised');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.program_sku_match_type AS ENUM ('exact','prefix','glob','regex');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. test_programs — additive columns
-- ============================================================
ALTER TABLE public.test_programs
  ADD COLUMN IF NOT EXISTS program_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS version_number INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS status public.program_status NOT NULL DEFAULT 'Draft',
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS purpose TEXT,
  ADD COLUMN IF NOT EXISTS scope_notes TEXT,
  ADD COLUMN IF NOT EXISTS intended_use TEXT,
  ADD COLUMN IF NOT EXISTS requested_by UUID,
  ADD COLUMN IF NOT EXISTS requested_by_name TEXT,
  ADD COLUMN IF NOT EXISTS approver_user_id UUID,
  ADD COLUMN IF NOT EXISTS approver_name TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approval_signature TEXT,
  ADD COLUMN IF NOT EXISTS effective_from DATE,
  ADD COLUMN IF NOT EXISTS effective_until DATE,
  ADD COLUMN IF NOT EXISTS superseded_by_id UUID REFERENCES public.test_programs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS parent_program_id UUID REFERENCES public.test_programs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_team_id UUID REFERENCES public.lab_teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS idx_test_programs_status ON public.test_programs(status);
CREATE INDEX IF NOT EXISTS idx_test_programs_code ON public.test_programs(program_code);
CREATE INDEX IF NOT EXISTS idx_test_programs_parent ON public.test_programs(parent_program_id);

-- ============================================================
-- 3. program_code generator
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_program_code()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE
  v_year TEXT := to_char(now(),'YYYY');
  v_count INT;
BEGIN
  IF NEW.program_code IS NULL OR NEW.program_code = '' THEN
    SELECT COUNT(*)+1 INTO v_count FROM public.test_programs
      WHERE program_code LIKE 'TPG-' || v_year || '-%';
    NEW.program_code := 'TPG-' || v_year || '-' || lpad(v_count::text,4,'0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_generate_program_code ON public.test_programs;
CREATE TRIGGER trg_generate_program_code
  BEFORE INSERT ON public.test_programs
  FOR EACH ROW EXECUTE FUNCTION public.generate_program_code();

WITH numbered AS (
  SELECT id,
    'TPG-' || to_char(COALESCE(created_at, now()),'YYYY') || '-' ||
    lpad(row_number() OVER (PARTITION BY to_char(COALESCE(created_at, now()),'YYYY') ORDER BY created_at)::text, 4, '0') AS new_code
  FROM public.test_programs
  WHERE program_code IS NULL
)
UPDATE public.test_programs tp
SET program_code = numbered.new_code
FROM numbered
WHERE tp.id = numbered.id;

UPDATE public.test_programs SET status = 'Active' WHERE status = 'Draft';

-- ============================================================
-- 4. validate_test_program
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_test_program()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.name IS NULL OR length(trim(NEW.name)) = 0 THEN
    RAISE EXCEPTION 'Program name is required';
  END IF;
  IF length(NEW.name) > 200 THEN
    RAISE EXCEPTION 'Program name must be 200 characters or less';
  END IF;
  IF NEW.version_number < 1 THEN
    RAISE EXCEPTION 'version_number must be >= 1';
  END IF;
  IF NEW.effective_from IS NOT NULL AND NEW.effective_until IS NOT NULL
     AND NEW.effective_until < NEW.effective_from THEN
    RAISE EXCEPTION 'effective_until cannot be before effective_from';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status IN ('Approved','Active') AND OLD.status IS DISTINCT FROM NEW.status
     AND NEW.approved_at IS NULL THEN
    NEW.approved_at := now();
  END IF;
  IF NEW.status IN ('Approved','Active','Superseded','Archived') THEN
    NEW.is_locked := true;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_test_program ON public.test_programs;
CREATE TRIGGER trg_validate_test_program
  BEFORE INSERT OR UPDATE ON public.test_programs
  FOR EACH ROW EXECUTE FUNCTION public.validate_test_program();

-- ============================================================
-- 5. updated_at trigger
-- ============================================================
DROP TRIGGER IF EXISTS trg_test_programs_updated_at ON public.test_programs;
CREATE TRIGGER trg_test_programs_updated_at
  BEFORE UPDATE ON public.test_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 6. program_versions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.program_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.test_programs(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  snapshot JSONB NOT NULL,
  status public.program_status NOT NULL,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  approved_by_name TEXT,
  approval_signature TEXT,
  change_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  created_by_name TEXT,
  UNIQUE (program_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_program_versions_program ON public.program_versions(program_id);

ALTER TABLE public.program_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read program versions"
  ON public.program_versions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Lab managers and admins can insert program versions"
  ON public.program_versions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'lab_manager') OR public.has_role(auth.uid(),'approver'));

-- ============================================================
-- 7. program_approvals
-- ============================================================
CREATE TABLE IF NOT EXISTS public.program_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.test_programs(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  action public.program_approval_action NOT NULL,
  actor_user_id UUID,
  actor_name TEXT,
  signature TEXT,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_program_approvals_program ON public.program_approvals(program_id, version_number);

ALTER TABLE public.program_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read program approvals"
  ON public.program_approvals FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert program approvals"
  ON public.program_approvals FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'lab_manager') OR public.has_role(auth.uid(),'approver') OR public.has_role(auth.uid(),'lab_tech'));

-- ============================================================
-- 8. program_supplier_links
-- ============================================================
CREATE TABLE IF NOT EXISTS public.program_supplier_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.test_programs(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  is_preferred BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (program_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS idx_program_supplier_links_supplier ON public.program_supplier_links(supplier_id);

ALTER TABLE public.program_supplier_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read program supplier links"
  ON public.program_supplier_links FOR SELECT TO authenticated USING (true);

CREATE POLICY "Lab managers and admins can write program supplier links"
  ON public.program_supplier_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'lab_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'lab_manager'));

-- ============================================================
-- 9. program_sku_patterns
-- ============================================================
CREATE TABLE IF NOT EXISTS public.program_sku_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.test_programs(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  match_type public.program_sku_match_type NOT NULL DEFAULT 'glob',
  priority INT NOT NULL DEFAULT 100,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (program_id, pattern, match_type)
);

CREATE INDEX IF NOT EXISTS idx_program_sku_patterns_program ON public.program_sku_patterns(program_id);
CREATE INDEX IF NOT EXISTS idx_program_sku_patterns_pattern ON public.program_sku_patterns(pattern);

ALTER TABLE public.program_sku_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read program sku patterns"
  ON public.program_sku_patterns FOR SELECT TO authenticated USING (true);

CREATE POLICY "Lab managers and admins can write program sku patterns"
  ON public.program_sku_patterns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'lab_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'lab_manager'));

-- ============================================================
-- 10. program_material_type_tags
-- ============================================================
CREATE TABLE IF NOT EXISTS public.program_material_type_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.test_programs(id) ON DELETE CASCADE,
  material_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (program_id, material_type)
);

CREATE INDEX IF NOT EXISTS idx_program_material_type_tags_program ON public.program_material_type_tags(program_id);
CREATE INDEX IF NOT EXISTS idx_program_material_type_tags_type ON public.program_material_type_tags(material_type);

ALTER TABLE public.program_material_type_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read program material type tags"
  ON public.program_material_type_tags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Lab managers and admins can write program material type tags"
  ON public.program_material_type_tags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'lab_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'lab_manager'));

-- ============================================================
-- 11. program_audit
-- ============================================================
CREATE TABLE IF NOT EXISTS public.program_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL,
  action TEXT NOT NULL,
  changed_by UUID,
  changed_by_name TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_program_audit_program ON public.program_audit(program_id);

ALTER TABLE public.program_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read program audit"
  ON public.program_audit FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert program audit"
  ON public.program_audit FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'lab_manager') OR public.has_role(auth.uid(),'approver') OR public.has_role(auth.uid(),'lab_tech'));

-- ============================================================
-- 12. audit trigger for test_programs
-- ============================================================
CREATE OR REPLACE FUNCTION public.audit_test_program_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_changed jsonb := '{}'::jsonb;
  k text;
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.program_audit(program_id, action, changed_by, changed_by_name, details)
    VALUES (NEW.id, 'created', auth.uid(), public.current_user_email(),
      jsonb_build_object('program_code', NEW.program_code, 'name', NEW.name, 'status', NEW.status));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.program_audit(program_id, action, changed_by, changed_by_name, details)
    VALUES (OLD.id, 'deleted', auth.uid(), public.current_user_email(),
      jsonb_build_object('program_code', OLD.program_code, 'name', OLD.name));
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
      INSERT INTO public.program_audit(program_id, action, changed_by, changed_by_name, details)
      VALUES (NEW.id,
        CASE WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'status_changed' ELSE 'updated' END,
        auth.uid(), public.current_user_email(),
        jsonb_build_object('changes', v_changed));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_audit_test_program_change ON public.test_programs;
CREATE TRIGGER trg_audit_test_program_change
  AFTER INSERT OR UPDATE OR DELETE ON public.test_programs
  FOR EACH ROW EXECUTE FUNCTION public.audit_test_program_change();

-- ============================================================
-- 13. snapshot_program_version helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.snapshot_program_version(_program_id UUID, _change_notes TEXT DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_program RECORD;
  v_snapshot JSONB;
  v_version_id UUID;
BEGIN
  SELECT * INTO v_program FROM public.test_programs WHERE id = _program_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Program not found: %', _program_id; END IF;

  v_snapshot := jsonb_build_object(
    'program', to_jsonb(v_program),
    'items', (
      SELECT COALESCE(jsonb_agg(to_jsonb(tpi.*) ORDER BY tpi.display_order), '[]'::jsonb)
      FROM public.test_program_items tpi WHERE tpi.program_id = _program_id
    ),
    'supplier_links', (
      SELECT COALESCE(jsonb_agg(to_jsonb(psl.*)), '[]'::jsonb)
      FROM public.program_supplier_links psl WHERE psl.program_id = _program_id
    ),
    'sku_patterns', (
      SELECT COALESCE(jsonb_agg(to_jsonb(p.*)), '[]'::jsonb)
      FROM public.program_sku_patterns p WHERE p.program_id = _program_id
    ),
    'material_type_tags', (
      SELECT COALESCE(jsonb_agg(to_jsonb(t.*)), '[]'::jsonb)
      FROM public.program_material_type_tags t WHERE t.program_id = _program_id
    ),
    'material_links', (
      SELECT COALESCE(jsonb_agg(to_jsonb(m.*)), '[]'::jsonb)
      FROM public.material_test_programs m WHERE m.program_id = _program_id
    )
  );

  INSERT INTO public.program_versions (
    program_id, version_number, snapshot, status,
    approved_at, approved_by, approved_by_name, approval_signature,
    change_notes, created_by, created_by_name
  ) VALUES (
    _program_id, v_program.version_number, v_snapshot, v_program.status,
    v_program.approved_at, v_program.approver_user_id, v_program.approver_name, v_program.approval_signature,
    _change_notes, auth.uid(), public.current_user_email()
  ) RETURNING id INTO v_version_id;

  RETURN v_version_id;
END $$;

-- ============================================================
-- 14. match_programs_for_intake helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.match_programs_for_intake(
  _sku TEXT DEFAULT NULL,
  _material_type TEXT DEFAULT NULL,
  _material_id UUID DEFAULT NULL,
  _supplier_id UUID DEFAULT NULL
)
RETURNS TABLE (
  program_id UUID,
  program_code TEXT,
  program_name TEXT,
  match_score INT,
  match_reasons TEXT[]
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT p.id, p.program_code, p.name,
      CASE WHEN _material_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.material_test_programs mtp
        WHERE mtp.program_id = p.id AND mtp.material_id = _material_id
      ) THEN 100 ELSE 0 END AS s_material,
      CASE WHEN _supplier_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.program_supplier_links psl
        WHERE psl.program_id = p.id AND psl.supplier_id = _supplier_id
      ) THEN 50 ELSE 0 END AS s_supplier,
      CASE WHEN _material_type IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.program_material_type_tags t
        WHERE t.program_id = p.id AND lower(t.material_type) = lower(_material_type)
      ) THEN 30 ELSE 0 END AS s_mtype,
      COALESCE((
        SELECT MAX(
          CASE
            WHEN sp.match_type = 'exact'  AND _sku = sp.pattern THEN 60
            WHEN sp.match_type = 'prefix' AND _sku LIKE sp.pattern || '%' THEN 45
            WHEN sp.match_type = 'glob'   AND _sku LIKE replace(replace(sp.pattern,'*','%'),'?','_') THEN 40
            WHEN sp.match_type = 'regex'  AND _sku ~ sp.pattern THEN 35
            ELSE 0
          END)
        FROM public.program_sku_patterns sp
        WHERE sp.program_id = p.id AND _sku IS NOT NULL
      ), 0) AS s_sku
    FROM public.test_programs p
    WHERE p.status IN ('Approved','Active')
  )
  SELECT c.id, c.program_code, c.name,
    (c.s_material + c.s_supplier + c.s_mtype + c.s_sku) AS match_score,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN c.s_material > 0 THEN 'material' ELSE NULL END,
      CASE WHEN c.s_supplier > 0 THEN 'supplier' ELSE NULL END,
      CASE WHEN c.s_mtype    > 0 THEN 'material_type' ELSE NULL END,
      CASE WHEN c.s_sku      > 0 THEN 'sku_pattern' ELSE NULL END
    ], NULL) AS match_reasons
  FROM candidates c
  WHERE (c.s_material + c.s_supplier + c.s_mtype + c.s_sku) > 0
  ORDER BY match_score DESC, c.program_code ASC
  LIMIT 10;
END $$;

-- ============================================================
-- 15. Tighten RLS on test_programs
-- ============================================================
ALTER TABLE public.test_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read test programs" ON public.test_programs;
CREATE POLICY "Authenticated can read test programs"
  ON public.test_programs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Lab managers can write test programs" ON public.test_programs;
CREATE POLICY "Lab managers can write test programs"
  ON public.test_programs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'lab_manager'));

DROP POLICY IF EXISTS "Lab managers can update test programs" ON public.test_programs;
CREATE POLICY "Lab managers can update test programs"
  ON public.test_programs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'lab_manager') OR public.has_role(auth.uid(),'approver'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'lab_manager') OR public.has_role(auth.uid(),'approver'));

DROP POLICY IF EXISTS "Admins can delete test programs" ON public.test_programs;
CREATE POLICY "Admins can delete test programs"
  ON public.test_programs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));