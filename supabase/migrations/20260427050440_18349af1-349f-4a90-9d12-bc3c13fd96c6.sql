-- ============================================================
-- STANDARDS HUB EXPANSION
-- Non-destructive: extends existing `standards`, adds 8 new tables.
-- All existing FKs (method_standards.standard_id, test_items.standard_id)
-- keep working. Existing 20 rows preserved.
-- ============================================================

-- ---------- 1. ORGANIZATIONS ----------
CREATE TABLE public.standards_organizations (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                        text NOT NULL UNIQUE,                -- 'ASTM', 'ISO', 'AATCC', 'BS', 'DIN', 'JIS', 'VDA', 'FMVSS', 'EN', 'OEM'
  full_name                   text NOT NULL,
  abbreviation                text,
  country_origin              text,
  website_url                 text,
  technical_committee         text,
  subcommittees               text,                                -- JSON or comma-list
  numbering_convention        text,
  publication_frequency       text,
  api_endpoint                text,
  subscription_access_details text,
  secretariat_history         text,
  notes                       text,
  is_active                   boolean NOT NULL DEFAULT true,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_standards_orgs_code ON public.standards_organizations(code);

ALTER TABLE public.standards_organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read standards_organizations" ON public.standards_organizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff insert standards_organizations" ON public.standards_organizations FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role));
CREATE POLICY "Staff update standards_organizations" ON public.standards_organizations FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role));
CREATE POLICY "Admins delete standards_organizations" ON public.standards_organizations FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ---------- 2. CATEGORIES (hierarchical) ----------
CREATE TABLE public.standards_categories (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                text NOT NULL UNIQUE,                        -- 'colorfastness', 'colorfastness.crocking', ...
  name                text NOT NULL,
  parent_id           uuid REFERENCES public.standards_categories(id) ON DELETE SET NULL,
  description         text,
  ics_code            text,                                        -- e.g. '59.080.30'
  display_order       integer NOT NULL DEFAULT 0,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_standards_categories_parent ON public.standards_categories(parent_id);
CREATE INDEX idx_standards_categories_code   ON public.standards_categories(code);

ALTER TABLE public.standards_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read standards_categories" ON public.standards_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff insert standards_categories" ON public.standards_categories FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role));
CREATE POLICY "Staff update standards_categories" ON public.standards_categories FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role));
CREATE POLICY "Admins delete standards_categories" ON public.standards_categories FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ---------- 3. EXTEND `standards` ----------
ALTER TABLE public.standards
  ADD COLUMN IF NOT EXISTS organization_id        uuid REFERENCES public.standards_organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS full_designation       text,
  ADD COLUMN IF NOT EXISTS revision_suffix        text,
  ADD COLUMN IF NOT EXISTS summary                text,
  ADD COLUMN IF NOT EXISTS scope_description      text,
  ADD COLUMN IF NOT EXISTS document_type          text,                  -- 'Test Method' | 'Specification' | 'Practice' | 'Guide' | 'Terminology'
  ADD COLUMN IF NOT EXISTS status                 text NOT NULL DEFAULT 'Active',  -- Active | Withdrawn | Historical | Superseded | Draft
  ADD COLUMN IF NOT EXISTS withdrawal_date        date,
  ADD COLUMN IF NOT EXISTS superseded_by_id       uuid REFERENCES public.standards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS first_published_year   integer,
  ADD COLUMN IF NOT EXISTS latest_revision_year   integer,
  ADD COLUMN IF NOT EXISTS language               text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS normative_references   text,
  ADD COLUMN IF NOT EXISTS wiki_notes_md          text,
  ADD COLUMN IF NOT EXISTS source_attribution     text,                   -- 'Kimi.ai 2025-04 textile standards report' etc.
  ADD COLUMN IF NOT EXISTS last_verified_date     date,
  ADD COLUMN IF NOT EXISTS updated_at             timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_standards_org_id        ON public.standards(organization_id);
CREATE INDEX IF NOT EXISTS idx_standards_status        ON public.standards(status);
CREATE INDEX IF NOT EXISTS idx_standards_superseded_by ON public.standards(superseded_by_id);
CREATE INDEX IF NOT EXISTS idx_standards_full_desig    ON public.standards(full_designation);

-- updated_at trigger on standards
DROP TRIGGER IF EXISTS trg_standards_updated_at ON public.standards;
CREATE TRIGGER trg_standards_updated_at
  BEFORE UPDATE ON public.standards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_standards_orgs_updated_at ON public.standards_organizations;
CREATE TRIGGER trg_standards_orgs_updated_at
  BEFORE UPDATE ON public.standards_organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- 4. STANDARD ↔ CATEGORY (many-to-many) ----------
CREATE TABLE public.standard_categories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_id     uuid NOT NULL REFERENCES public.standards(id) ON DELETE CASCADE,
  category_id     uuid NOT NULL REFERENCES public.standards_categories(id) ON DELETE CASCADE,
  is_primary      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (standard_id, category_id)
);
CREATE INDEX idx_standard_categories_std ON public.standard_categories(standard_id);
CREATE INDEX idx_standard_categories_cat ON public.standard_categories(category_id);

ALTER TABLE public.standard_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read standard_categories" ON public.standard_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff insert standard_categories" ON public.standard_categories FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role));
CREATE POLICY "Staff update standard_categories" ON public.standard_categories FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role));
CREATE POLICY "Admins delete standard_categories" ON public.standard_categories FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ---------- 5. PARAMETERS measured by a standard ----------
CREATE TABLE public.standard_parameters (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_id              uuid NOT NULL REFERENCES public.standards(id) ON DELETE CASCADE,
  parameter_name           text NOT NULL,
  description              text,
  unit                     text,
  measurement_method       text,
  typical_range_min        numeric,
  typical_range_max        numeric,
  measurement_uncertainty  text,
  rating_scale             text,                                    -- e.g. 'Grey Scale 1-5', 'Pass/Fail'
  notes                    text,
  display_order            integer NOT NULL DEFAULT 0,
  created_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_standard_parameters_std ON public.standard_parameters(standard_id);

ALTER TABLE public.standard_parameters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read standard_parameters" ON public.standard_parameters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff insert standard_parameters" ON public.standard_parameters FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role));
CREATE POLICY "Staff update standard_parameters" ON public.standard_parameters FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role));
CREATE POLICY "Admins delete standard_parameters" ON public.standard_parameters FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ---------- 6. EQUIPMENT REQUIREMENTS per standard ----------
CREATE TABLE public.standard_equipment_requirements (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_id              uuid NOT NULL REFERENCES public.standards(id) ON DELETE CASCADE,
  equipment_id             uuid REFERENCES public.equipment(id) ON DELETE SET NULL,  -- optional: link to actual asset if we own it
  equipment_type           text NOT NULL,                                              -- always set, even if no asset linked
  manufacturer_examples    text,
  required_specifications  text,
  specimen_size            text,
  test_conditions          text,
  calibration_requirements text,
  notes                    text,
  display_order            integer NOT NULL DEFAULT 0,
  created_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_std_equip_req_std   ON public.standard_equipment_requirements(standard_id);
CREATE INDEX idx_std_equip_req_equip ON public.standard_equipment_requirements(equipment_id);

ALTER TABLE public.standard_equipment_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read standard_equipment_requirements" ON public.standard_equipment_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff insert standard_equipment_requirements" ON public.standard_equipment_requirements FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role));
CREATE POLICY "Staff update standard_equipment_requirements" ON public.standard_equipment_requirements FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role));
CREATE POLICY "Admins delete standard_equipment_requirements" ON public.standard_equipment_requirements FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ---------- 7. CROSS-REFERENCES between standards ----------
-- relationship_type: equivalent | supersedes | superseded_by | normative_reference |
--                    related | adopted_as | corrigendum_of | amendment_of
CREATE TABLE public.standard_references (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_standard_id  uuid NOT NULL REFERENCES public.standards(id) ON DELETE CASCADE,
  target_standard_id  uuid REFERENCES public.standards(id) ON DELETE SET NULL,
  target_text         text,                                          -- free text if target not in our DB yet
  relationship_type   text NOT NULL,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_standard_refs_src ON public.standard_references(source_standard_id);
CREATE INDEX idx_standard_refs_tgt ON public.standard_references(target_standard_id);

ALTER TABLE public.standard_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read standard_references" ON public.standard_references FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff insert standard_references" ON public.standard_references FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role));
CREATE POLICY "Staff update standard_references" ON public.standard_references FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role));
CREATE POLICY "Admins delete standard_references" ON public.standard_references FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ---------- 8. REVISION HISTORY (per standard, version-level) ----------
CREATE TABLE public.standard_revisions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_id       uuid NOT NULL REFERENCES public.standards(id) ON DELETE CASCADE,
  revision_label    text NOT NULL,                                  -- '2014', '-20', '-95a(2010)e1'
  revision_year     integer,
  revision_type     text,                                            -- 'Major' | 'Editorial' | 'Corrigendum' | 'Amendment' | 'Withdrawal'
  change_summary    text,
  effective_date    date,
  withdrawn_date    date,
  document_url      text,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_standard_revisions_std ON public.standard_revisions(standard_id);

ALTER TABLE public.standard_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read standard_revisions" ON public.standard_revisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff insert standard_revisions" ON public.standard_revisions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role));
CREATE POLICY "Staff update standard_revisions" ON public.standard_revisions FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role));
CREATE POLICY "Admins delete standard_revisions" ON public.standard_revisions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ---------- 9. WIKI NOTES EDIT HISTORY ----------
CREATE TABLE public.standard_wiki_revisions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_id     uuid NOT NULL REFERENCES public.standards(id) ON DELETE CASCADE,
  content_md      text NOT NULL,
  edited_by       uuid,
  edited_by_name  text,
  edit_summary    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_standard_wiki_rev_std ON public.standard_wiki_revisions(standard_id);

ALTER TABLE public.standard_wiki_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read standard_wiki_revisions" ON public.standard_wiki_revisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff insert standard_wiki_revisions" ON public.standard_wiki_revisions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role));
-- wiki revisions are append-only history -> no UPDATE/DELETE for non-admins
CREATE POLICY "Admins delete standard_wiki_revisions" ON public.standard_wiki_revisions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ---------- 10. AUDIT LOG for standards (mirrors equipment_audit pattern) ----------
CREATE TABLE public.standards_audit (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_id       uuid NOT NULL,
  action            text NOT NULL,
  changed_by        uuid,
  changed_by_name   text,
  details           jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_standards_audit_std ON public.standards_audit(standard_id);

ALTER TABLE public.standards_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read standards_audit" ON public.standards_audit FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff insert standards_audit" ON public.standards_audit FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role));

-- ---------- 11. AUDIT TRIGGER on standards ----------
CREATE OR REPLACE FUNCTION public.audit_standard_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changed jsonb := '{}'::jsonb;
  k text;
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.standards_audit(standard_id, action, changed_by, changed_by_name, details)
    VALUES (NEW.id, 'created', auth.uid(), public.current_user_email(),
      jsonb_build_object('code', NEW.code, 'organization_id', NEW.organization_id, 'status', NEW.status));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.standards_audit(standard_id, action, changed_by, changed_by_name, details)
    VALUES (OLD.id, 'deleted', auth.uid(), public.current_user_email(),
      jsonb_build_object('code', OLD.code));
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
      INSERT INTO public.standards_audit(standard_id, action, changed_by, changed_by_name, details)
      VALUES (NEW.id, 'updated', auth.uid(), public.current_user_email(),
        jsonb_build_object('changes', v_changed));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_standards_audit ON public.standards;
CREATE TRIGGER trg_standards_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.standards
  FOR EACH ROW EXECUTE FUNCTION public.audit_standard_change();

-- ---------- 12. VALIDATION TRIGGER on standards ----------
CREATE OR REPLACE FUNCTION public.validate_standard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.code IS NULL OR length(trim(NEW.code)) = 0 THEN
    RAISE EXCEPTION 'Standard code is required';
  END IF;
  IF NEW.status NOT IN ('Active','Withdrawn','Historical','Superseded','Draft') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF NEW.first_published_year IS NOT NULL AND (NEW.first_published_year < 1800 OR NEW.first_published_year > 2100) THEN
    RAISE EXCEPTION 'first_published_year out of range';
  END IF;
  IF NEW.latest_revision_year IS NOT NULL AND (NEW.latest_revision_year < 1800 OR NEW.latest_revision_year > 2100) THEN
    RAISE EXCEPTION 'latest_revision_year out of range';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_standard ON public.standards;
CREATE TRIGGER trg_validate_standard
  BEFORE INSERT OR UPDATE ON public.standards
  FOR EACH ROW EXECUTE FUNCTION public.validate_standard();

-- ---------- 13. SEED ORGANIZATIONS (the 5 from the Kimi report + ones already used in current data) ----------
INSERT INTO public.standards_organizations (code, full_name, abbreviation, country_origin, website_url, technical_committee, numbering_convention, notes) VALUES
  ('ASTM',  'ASTM International', 'ASTM', 'United States',  'www.astm.org',     'Committee D13 (Textiles)',         'Letter-Number-Year (e.g. D3785-20)', '300+ textile standards across 19 subcommittees'),
  ('ISO',   'International Organization for Standardization', 'ISO', 'Switzerland', 'www.iso.org', 'TC 38 (Textiles), SC1 Colourfastness, SC2 Cleansing/Finishing/Water resistance', 'ISO NNNN[-Part]:YYYY', '200+ textile standards'),
  ('AATCC', 'American Association of Textile Chemists and Colorists', 'AATCC', 'United States', 'www.aatcc.org', 'AATCC Technical Committees', 'TM/LP/EP/M prefix (e.g. TM8, TM16.3)', 'Specializes in colorfastness and wet processing; co-secretariat with ISO TC38/SC1 for 60+ years'),
  ('BS',    'British Standards Institution', 'BSI', 'United Kingdom', 'www.bsigroup.com', 'Textiles Committee', 'BS [EN] [ISO] NNNN:YYYY', '150+ standards; predominantly EN/ISO adoptions'),
  ('DIN',   'Deutsches Institut für Normung', 'DIN', 'Germany', 'www.din.de', 'Textile Standards Committee', 'DIN [EN] [ISO] NNNN:YYYY-MM', '150+ standards; predominantly EN/ISO adoptions'),
  ('JIS',   'Japanese Industrial Standards', 'JIS', 'Japan', 'www.jisc.go.jp', 'JISC Textile Division', 'JIS L NNNN', 'Japanese national textile standards'),
  ('VDA',   'Verband der Automobilindustrie', 'VDA', 'Germany', 'www.vda.de', 'VDA-QMC', 'VDA NNN', 'German automotive industry standards'),
  ('FMVSS', 'Federal Motor Vehicle Safety Standards', 'FMVSS', 'United States', 'www.nhtsa.gov', 'NHTSA', 'FMVSS NNN', 'US automotive safety standards'),
  ('EN',    'European Norm', 'EN', 'European Union', 'www.cencenelec.eu', 'CEN/TC 248 Textiles', 'EN [ISO] NNNN:YYYY', 'European harmonized standards'),
  ('OEM',   'Original Equipment Manufacturer specs', 'OEM', NULL, NULL, NULL, 'Brand-specific (e.g. NES M0154)', 'Catch-all for OEM-issued specifications')
ON CONFLICT (code) DO NOTHING;

-- backfill organization_id on existing standards rows by matching the existing text column
UPDATE public.standards s
SET organization_id = o.id
FROM public.standards_organizations o
WHERE s.organization_id IS NULL
  AND s.organization IS NOT NULL
  AND upper(s.organization) = upper(o.code);

-- backfill full_designation where missing (e.g. "ISO 2286-2:2016")
UPDATE public.standards
SET full_designation = TRIM(BOTH ' ' FROM
    COALESCE(organization,'') || ' ' || code ||
    CASE WHEN version IS NOT NULL AND version <> '' THEN ':' || version ELSE '' END)
WHERE full_designation IS NULL;