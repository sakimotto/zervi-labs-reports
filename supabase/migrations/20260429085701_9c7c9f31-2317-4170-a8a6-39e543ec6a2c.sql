
-- ============================================================================
-- Program Drafts: AI-generated test program proposals awaiting human approval
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.program_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'draft', -- draft | applied | discarded
  created_by UUID,
  created_by_name TEXT,
  conversation_id UUID,                 -- back-link to copilot chat
  source TEXT NOT NULL DEFAULT 'copilot', -- copilot | manual | import
  draft_payload JSONB NOT NULL,         -- { program: {...}, items: [...], sku_patterns: [...], supplier_links: [...], material_type_tags: [...] }
  ai_rationale JSONB,                   -- per-item rationale + overall reasoning
  applied_program_id UUID,              -- set after apply_program_draft runs
  applied_at TIMESTAMPTZ,
  discarded_at TIMESTAMPTZ,
  discard_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_program_drafts_status ON public.program_drafts(status);
CREATE INDEX IF NOT EXISTS idx_program_drafts_created_by ON public.program_drafts(created_by);
CREATE INDEX IF NOT EXISTS idx_program_drafts_conversation ON public.program_drafts(conversation_id);

ALTER TABLE public.program_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read program drafts"
  ON public.program_drafts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert program drafts"
  ON public.program_drafts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update own program drafts"
  ON public.program_drafts FOR UPDATE TO authenticated USING (created_by = auth.uid() OR created_by IS NULL);

CREATE POLICY "Admins delete program drafts"
  ON public.program_drafts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_program_drafts_updated_at
  BEFORE UPDATE ON public.program_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- apply_program_draft: atomically materialize a draft into a real Test Program
-- ============================================================================
--
-- draft_payload shape (every section optional except program.name):
-- {
--   "program": {
--     "name": "Toyota Seat Fabric Program 2026",
--     "description": "...",
--     "material_type": "Woven Polyester",
--     "category": "Automotive Interior",
--     "purpose": "...", "scope_notes": "...", "intended_use": "...",
--     "report_title": "...", "report_header_notes": "...", "report_footer_notes": "..."
--   },
--   "items": [
--     { "test_item_id": 12, "display_order": 0, "include_in_report": true, "notes": "..." }
--   ],
--   "requirements": [
--     { "test_item_id": 12, "direction": "Warp", "min_value": 250, "max_value": null,
--       "target_value": null, "requirement_text": "≥250 N", "standard_code": "ISO 13934-1",
--       "oem_brand": "Toyota" }
--   ],
--   "method_standards": [
--     { "test_item_id": 12, "standard_id": "uuid-of-standard", "is_primary": true, "year": "2013" }
--   ],
--   "sku_patterns": [
--     { "pattern": "TOY-ST-*", "match_type": "glob", "priority": 100, "description": "Toyota seat trim" }
--   ],
--   "supplier_links": [ { "supplier_id": "uuid", "is_preferred": true, "notes": "..." } ],
--   "material_type_tags": [ { "material_type": "Woven Polyester" } ]
-- }

CREATE OR REPLACE FUNCTION public.apply_program_draft(_draft_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draft public.program_drafts%ROWTYPE;
  v_payload JSONB;
  v_program_id UUID;
  v_program_data JSONB;
  v_item JSONB;
  v_req JSONB;
  v_ms JSONB;
  v_sku JSONB;
  v_sup JSONB;
  v_tag JSONB;
BEGIN
  SELECT * INTO v_draft FROM public.program_drafts WHERE id = _draft_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Draft not found: %', _draft_id; END IF;
  IF v_draft.status <> 'draft' THEN
    RAISE EXCEPTION 'Draft % already %', _draft_id, v_draft.status;
  END IF;

  v_payload := v_draft.draft_payload;
  v_program_data := v_payload->'program';
  IF v_program_data IS NULL OR (v_program_data->>'name') IS NULL THEN
    RAISE EXCEPTION 'Draft payload missing program.name';
  END IF;

  -- 1. Insert the program (Draft status — user still has to Approve)
  INSERT INTO public.test_programs (
    name, description, material_type, category, purpose, scope_notes, intended_use,
    report_title, report_header_notes, report_footer_notes,
    requested_by, requested_by_name
  ) VALUES (
    v_program_data->>'name',
    NULLIF(v_program_data->>'description', ''),
    NULLIF(v_program_data->>'material_type', ''),
    NULLIF(v_program_data->>'category', ''),
    NULLIF(v_program_data->>'purpose', ''),
    NULLIF(v_program_data->>'scope_notes', ''),
    NULLIF(v_program_data->>'intended_use', ''),
    NULLIF(v_program_data->>'report_title', ''),
    NULLIF(v_program_data->>'report_header_notes', ''),
    NULLIF(v_program_data->>'report_footer_notes', ''),
    auth.uid(),
    public.current_user_email()
  ) RETURNING id INTO v_program_id;

  -- 2. Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_payload->'items', '[]'::jsonb)) LOOP
    INSERT INTO public.test_program_items (program_id, test_item_id, display_order, include_in_report, notes)
    VALUES (
      v_program_id,
      (v_item->>'test_item_id')::INT,
      COALESCE((v_item->>'display_order')::INT, 0),
      COALESCE((v_item->>'include_in_report')::BOOLEAN, true),
      NULLIF(v_item->>'notes', '')
    )
    ON CONFLICT (program_id, test_item_id) DO NOTHING;
  END LOOP;

  -- 3. Requirements (acceptance thresholds)
  FOR v_req IN SELECT * FROM jsonb_array_elements(COALESCE(v_payload->'requirements', '[]'::jsonb)) LOOP
    INSERT INTO public.test_requirements (
      test_item_id, direction, min_value, max_value, target_value,
      requirement_text, standard_code, oem_brand
    ) VALUES (
      (v_req->>'test_item_id')::INT,
      NULLIF(v_req->>'direction', ''),
      NULLIF(v_req->>'min_value', '')::NUMERIC,
      NULLIF(v_req->>'max_value', '')::NUMERIC,
      NULLIF(v_req->>'target_value', '')::NUMERIC,
      NULLIF(v_req->>'requirement_text', ''),
      NULLIF(v_req->>'standard_code', ''),
      NULLIF(v_req->>'oem_brand', '')
    );
  END LOOP;

  -- 4. Method ↔ Standard links
  FOR v_ms IN SELECT * FROM jsonb_array_elements(COALESCE(v_payload->'method_standards', '[]'::jsonb)) LOOP
    INSERT INTO public.method_standards (test_item_id, standard_id, standard_text, year, is_primary, notes)
    VALUES (
      (v_ms->>'test_item_id')::INT,
      NULLIF(v_ms->>'standard_id', '')::UUID,
      NULLIF(v_ms->>'standard_text', ''),
      NULLIF(v_ms->>'year', ''),
      COALESCE((v_ms->>'is_primary')::BOOLEAN, false),
      NULLIF(v_ms->>'notes', '')
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- 5. SKU patterns
  FOR v_sku IN SELECT * FROM jsonb_array_elements(COALESCE(v_payload->'sku_patterns', '[]'::jsonb)) LOOP
    INSERT INTO public.program_sku_patterns (program_id, pattern, match_type, priority, description)
    VALUES (
      v_program_id,
      v_sku->>'pattern',
      COALESCE((v_sku->>'match_type')::program_sku_match_type, 'glob'::program_sku_match_type),
      COALESCE((v_sku->>'priority')::INT, 100),
      NULLIF(v_sku->>'description', '')
    )
    ON CONFLICT (program_id, pattern, match_type) DO NOTHING;
  END LOOP;

  -- 6. Supplier links
  FOR v_sup IN SELECT * FROM jsonb_array_elements(COALESCE(v_payload->'supplier_links', '[]'::jsonb)) LOOP
    INSERT INTO public.program_supplier_links (program_id, supplier_id, is_preferred, notes)
    VALUES (
      v_program_id,
      (v_sup->>'supplier_id')::UUID,
      COALESCE((v_sup->>'is_preferred')::BOOLEAN, false),
      NULLIF(v_sup->>'notes', '')
    )
    ON CONFLICT (program_id, supplier_id) DO NOTHING;
  END LOOP;

  -- 7. Material type tags
  FOR v_tag IN SELECT * FROM jsonb_array_elements(COALESCE(v_payload->'material_type_tags', '[]'::jsonb)) LOOP
    INSERT INTO public.program_material_type_tags (program_id, material_type)
    VALUES (v_program_id, v_tag->>'material_type')
    ON CONFLICT (program_id, material_type) DO NOTHING;
  END LOOP;

  -- 8. Mark draft applied
  UPDATE public.program_drafts
    SET status = 'applied',
        applied_program_id = v_program_id,
        applied_at = now()
    WHERE id = _draft_id;

  RETURN v_program_id;
END $$;
