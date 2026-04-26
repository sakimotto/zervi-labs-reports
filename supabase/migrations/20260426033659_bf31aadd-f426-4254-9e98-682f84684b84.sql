-- ===== EQUIPMENT: extend with rich identity, technical, calibration program fields =====
ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS asset_tag text,
  ADD COLUMN IF NOT EXISTS sub_type text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS condition_rating integer,
  ADD COLUMN IF NOT EXISTS vendor text,
  ADD COLUMN IF NOT EXISTS warranty_until date,
  ADD COLUMN IF NOT EXISTS room text,
  ADD COLUMN IF NOT EXISTS bench text,
  ADD COLUMN IF NOT EXISTS purchase_cost numeric,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  -- Technical capabilities
  ADD COLUMN IF NOT EXISTS measurement_min numeric,
  ADD COLUMN IF NOT EXISTS measurement_max numeric,
  ADD COLUMN IF NOT EXISTS measurement_unit text,
  ADD COLUMN IF NOT EXISTS accuracy text,
  ADD COLUMN IF NOT EXISTS resolution text,
  ADD COLUMN IF NOT EXISTS operating_temp_min numeric,
  ADD COLUMN IF NOT EXISTS operating_temp_max numeric,
  ADD COLUMN IF NOT EXISTS operating_humidity_min numeric,
  ADD COLUMN IF NOT EXISTS operating_humidity_max numeric,
  ADD COLUMN IF NOT EXISTS power_requirements text,
  ADD COLUMN IF NOT EXISTS firmware_version text,
  ADD COLUMN IF NOT EXISTS software_version text,
  ADD COLUMN IF NOT EXISTS accessories text,
  -- Calibration program
  ADD COLUMN IF NOT EXISTS calibration_interval_days integer,
  ADD COLUMN IF NOT EXISTS calibration_traceability text,
  ADD COLUMN IF NOT EXISTS accreditation_body text,
  ADD COLUMN IF NOT EXISTS last_calibration_date date,
  ADD COLUMN IF NOT EXISTS next_calibration_due date;

-- Unique asset tag where present
CREATE UNIQUE INDEX IF NOT EXISTS equipment_asset_tag_unique ON public.equipment (asset_tag) WHERE asset_tag IS NOT NULL;

-- Validation: condition rating 1-5
CREATE OR REPLACE FUNCTION public.validate_equipment()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.condition_rating IS NOT NULL AND (NEW.condition_rating < 1 OR NEW.condition_rating > 5) THEN
    RAISE EXCEPTION 'condition_rating must be between 1 and 5';
  END IF;
  IF NEW.calibration_interval_days IS NOT NULL AND NEW.calibration_interval_days <= 0 THEN
    RAISE EXCEPTION 'calibration_interval_days must be positive';
  END IF;
  -- Auto-compute next_calibration_due if last + interval present and not explicitly set
  IF NEW.last_calibration_date IS NOT NULL AND NEW.calibration_interval_days IS NOT NULL
     AND NEW.next_calibration_due IS NULL THEN
    NEW.next_calibration_due := NEW.last_calibration_date + NEW.calibration_interval_days;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_equipment_trigger ON public.equipment;
CREATE TRIGGER validate_equipment_trigger
  BEFORE INSERT OR UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.validate_equipment();

DROP TRIGGER IF EXISTS update_equipment_updated_at ON public.equipment;
CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== CALIBRATION RECORDS: extras =====
ALTER TABLE public.calibration_records
  ADD COLUMN IF NOT EXISTS in_tolerance boolean,
  ADD COLUMN IF NOT EXISTS uncertainty text,
  ADD COLUMN IF NOT EXISTS accreditation_body text,
  ADD COLUMN IF NOT EXISTS traceability text,
  ADD COLUMN IF NOT EXISTS document_url text;

-- When a calibration record is added, roll up to the equipment row
CREATE OR REPLACE FUNCTION public.sync_equipment_calibration_state()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_latest_date date;
  v_interval integer;
  v_next date;
  v_status text;
BEGIN
  SELECT MAX(calibration_date) INTO v_latest_date
    FROM public.calibration_records WHERE equipment_id = NEW.equipment_id;
  SELECT calibration_interval_days INTO v_interval
    FROM public.equipment WHERE id = NEW.equipment_id;

  IF v_latest_date IS NOT NULL AND v_interval IS NOT NULL THEN
    v_next := v_latest_date + v_interval;
  ELSE
    v_next := NEW.next_due_date;
  END IF;

  -- Recompute status from next_due
  IF v_next IS NULL THEN
    v_status := NEW.status;
  ELSIF v_next < CURRENT_DATE THEN
    v_status := 'Out of Cal';
  ELSIF v_next <= CURRENT_DATE + INTERVAL '30 days' THEN
    v_status := 'Due Soon';
  ELSE
    v_status := 'In Cal';
  END IF;

  UPDATE public.equipment
    SET last_calibration_date = v_latest_date,
        next_calibration_due = v_next,
        updated_at = now()
  WHERE id = NEW.equipment_id;

  -- Update the just-inserted row's computed status if mismatched
  IF NEW.status IS DISTINCT FROM v_status THEN
    UPDATE public.calibration_records SET status = v_status WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_equipment_calibration_state_trigger ON public.calibration_records;
CREATE TRIGGER sync_equipment_calibration_state_trigger
  AFTER INSERT OR UPDATE ON public.calibration_records
  FOR EACH ROW EXECUTE FUNCTION public.sync_equipment_calibration_state();

-- ===== MAINTENANCE LOGS: next service date =====
ALTER TABLE public.maintenance_logs
  ADD COLUMN IF NOT EXISTS next_service_date date;

-- ===== EQUIPMENT AUDIT TABLE =====
CREATE TABLE IF NOT EXISTS public.equipment_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL,
  action text NOT NULL,
  changed_by uuid,
  changed_by_name text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS equipment_audit_equipment_id_idx ON public.equipment_audit(equipment_id, created_at DESC);

ALTER TABLE public.equipment_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read equipment_audit" ON public.equipment_audit;
CREATE POLICY "Authenticated read equipment_audit" ON public.equipment_audit
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff insert equipment_audit" ON public.equipment_audit;
CREATE POLICY "Staff insert equipment_audit" ON public.equipment_audit
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_tech'::app_role));

-- Audit triggers for equipment
CREATE OR REPLACE FUNCTION public.audit_equipment_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_changed jsonb := '{}'::jsonb;
  k text;
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.equipment_audit(equipment_id, action, changed_by, changed_by_name, details)
    VALUES (NEW.id, 'created', auth.uid(), public.current_user_email(),
      jsonb_build_object('name', NEW.name, 'category', NEW.category, 'sub_type', NEW.sub_type));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.equipment_audit(equipment_id, action, changed_by, changed_by_name, details)
    VALUES (OLD.id, 'deleted', auth.uid(), public.current_user_email(),
      jsonb_build_object('name', OLD.name));
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
      INSERT INTO public.equipment_audit(equipment_id, action, changed_by, changed_by_name, details)
      VALUES (NEW.id, 'updated', auth.uid(), public.current_user_email(),
        jsonb_build_object('changes', v_changed));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_equipment_trigger ON public.equipment;
CREATE TRIGGER audit_equipment_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.audit_equipment_change();

-- Audit calibration adds
CREATE OR REPLACE FUNCTION public.audit_calibration_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.equipment_audit(equipment_id, action, changed_by, changed_by_name, details)
    VALUES (NEW.equipment_id, 'calibration_added', auth.uid(), public.current_user_email(),
      jsonb_build_object('calibration_date', NEW.calibration_date, 'next_due_date', NEW.next_due_date,
                         'status', NEW.status, 'certificate_number', NEW.certificate_number,
                         'in_tolerance', NEW.in_tolerance));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.equipment_audit(equipment_id, action, changed_by, changed_by_name, details)
    VALUES (OLD.equipment_id, 'calibration_removed', auth.uid(), public.current_user_email(),
      jsonb_build_object('calibration_date', OLD.calibration_date));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_calibration_trigger ON public.calibration_records;
CREATE TRIGGER audit_calibration_trigger
  AFTER INSERT OR DELETE ON public.calibration_records
  FOR EACH ROW EXECUTE FUNCTION public.audit_calibration_change();

-- Audit maintenance adds
CREATE OR REPLACE FUNCTION public.audit_maintenance_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.equipment_audit(equipment_id, action, changed_by, changed_by_name, details)
    VALUES (NEW.equipment_id, 'maintenance_logged', auth.uid(), public.current_user_email(),
      jsonb_build_object('maintenance_date', NEW.maintenance_date, 'maintenance_type', NEW.maintenance_type,
                         'downtime_hours', NEW.downtime_hours, 'cost', NEW.cost));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.equipment_audit(equipment_id, action, changed_by, changed_by_name, details)
    VALUES (OLD.equipment_id, 'maintenance_removed', auth.uid(), public.current_user_email(),
      jsonb_build_object('maintenance_date', OLD.maintenance_date));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_maintenance_trigger ON public.maintenance_logs;
CREATE TRIGGER audit_maintenance_trigger
  AFTER INSERT OR DELETE ON public.maintenance_logs
  FOR EACH ROW EXECUTE FUNCTION public.audit_maintenance_change();