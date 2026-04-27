-- Versions table — captures the state of a template BEFORE each update,
-- and on delete. The current row in test_request_templates is the head.
CREATE TABLE public.test_request_template_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.test_request_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  -- Snapshot of fields
  label TEXT NOT NULL,
  description TEXT,
  scope TEXT NOT NULL DEFAULT '',
  materials TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Audit
  change_kind TEXT NOT NULL CHECK (change_kind IN ('snapshot','update','delete','restore')),
  change_note TEXT,
  changed_by UUID,
  changed_by_name TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_id, version_number)
);

CREATE INDEX idx_trtv_template_changed_at
  ON public.test_request_template_versions(template_id, changed_at DESC);

-- RLS: signed-in users can read; admins can write (the trigger uses
-- SECURITY DEFINER so writes still succeed for non-admins, but the
-- API surface is locked down).
ALTER TABLE public.test_request_template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view template history"
  ON public.test_request_template_versions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert template history"
  ON public.test_request_template_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete template history"
  ON public.test_request_template_versions
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger function — snapshots the OLD row on UPDATE and DELETE.
CREATE OR REPLACE FUNCTION public.audit_test_request_template_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_next INT;
  v_kind TEXT;
  v_row public.test_request_templates%ROWTYPE;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Skip no-op updates on content fields (sort_order changes during reorder
    -- still get versioned — useful for undo).
    IF OLD.label IS NOT DISTINCT FROM NEW.label
       AND OLD.description IS NOT DISTINCT FROM NEW.description
       AND OLD.scope IS NOT DISTINCT FROM NEW.scope
       AND OLD.materials IS NOT DISTINCT FROM NEW.materials
       AND OLD.sort_order IS NOT DISTINCT FROM NEW.sort_order
       AND OLD.is_active IS NOT DISTINCT FROM NEW.is_active THEN
      RETURN NEW;
    END IF;
    v_kind := 'update';
    v_row := OLD;
  ELSIF TG_OP = 'DELETE' THEN
    v_kind := 'delete';
    v_row := OLD;
  ELSE
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX(version_number),0) + 1 INTO v_next
    FROM public.test_request_template_versions
    WHERE template_id = v_row.id;

  INSERT INTO public.test_request_template_versions (
    template_id, version_number,
    label, description, scope, materials, sort_order, is_active,
    change_kind, changed_by, changed_by_name
  ) VALUES (
    v_row.id, v_next,
    v_row.label, v_row.description, v_row.scope, v_row.materials,
    v_row.sort_order, v_row.is_active,
    v_kind, auth.uid(), public.current_user_email()
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_test_request_templates_audit
  AFTER UPDATE OR DELETE ON public.test_request_templates
  FOR EACH ROW EXECUTE FUNCTION public.audit_test_request_template_change();

-- Backfill: give every existing template a "v1 snapshot" of its current
-- state so the history panel isn't empty on first load.
INSERT INTO public.test_request_template_versions (
  template_id, version_number,
  label, description, scope, materials, sort_order, is_active,
  change_kind, changed_at
)
SELECT
  id, 1,
  label, description, scope, materials, sort_order, is_active,
  'snapshot', created_at
FROM public.test_request_templates;
