
-- Helper to fetch current user's email for nicer audit display
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = auth.uid();
$$;

-- ===== Material audit trigger =====
CREATE OR REPLACE FUNCTION public.audit_material_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changed_fields jsonb := '{}'::jsonb;
  k text;
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.material_audit (material_id, action, changed_by, changed_by_name, details)
    VALUES (NEW.id, 'created', auth.uid(), public.current_user_email(),
            jsonb_build_object('name', NEW.name, 'material_type', NEW.material_type));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.material_audit (material_id, action, changed_by, changed_by_name, details)
    VALUES (OLD.id, 'deleted', auth.uid(), public.current_user_email(),
            jsonb_build_object('name', OLD.name));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    FOR k IN SELECT jsonb_object_keys(v_new) LOOP
      IF k IN ('updated_at','created_at') THEN CONTINUE; END IF;
      IF v_old->k IS DISTINCT FROM v_new->k THEN
        v_changed_fields := v_changed_fields || jsonb_build_object(k, jsonb_build_object('from', v_old->k, 'to', v_new->k));
      END IF;
    END LOOP;
    IF v_changed_fields <> '{}'::jsonb THEN
      INSERT INTO public.material_audit (material_id, action, changed_by, changed_by_name, details)
      VALUES (NEW.id, 'updated', auth.uid(), public.current_user_email(),
              jsonb_build_object('changes', v_changed_fields));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_materials_trigger ON public.materials;
CREATE TRIGGER audit_materials_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.materials
FOR EACH ROW EXECUTE FUNCTION public.audit_material_change();

-- ===== Material version audit =====
CREATE OR REPLACE FUNCTION public.audit_material_version_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.material_audit (material_id, action, changed_by, changed_by_name, details)
    VALUES (NEW.material_id, 'version_created', auth.uid(), public.current_user_email(),
            jsonb_build_object('version_number', NEW.version_number, 'status', NEW.status, 'change_notes', NEW.change_notes));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.material_audit (material_id, action, changed_by, changed_by_name, details)
    VALUES (NEW.material_id,
            CASE WHEN NEW.status = 'Active' THEN 'version_approved'
                 WHEN NEW.status = 'Superseded' THEN 'version_superseded'
                 ELSE 'version_status_changed' END,
            auth.uid(), public.current_user_email(),
            jsonb_build_object('version_number', NEW.version_number, 'from', OLD.status, 'to', NEW.status));
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_material_versions_trigger ON public.material_versions;
CREATE TRIGGER audit_material_versions_trigger
AFTER INSERT OR UPDATE ON public.material_versions
FOR EACH ROW EXECUTE FUNCTION public.audit_material_version_change();

-- ===== Material certification audit =====
CREATE OR REPLACE FUNCTION public.audit_material_certification_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.material_audit (material_id, action, changed_by, changed_by_name, details)
    VALUES (NEW.material_id, 'certification_added', auth.uid(), public.current_user_email(),
            jsonb_build_object('certification_type', NEW.certification_type, 'certificate_number', NEW.certificate_number));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.material_audit (material_id, action, changed_by, changed_by_name, details)
    VALUES (OLD.material_id, 'certification_removed', auth.uid(), public.current_user_email(),
            jsonb_build_object('certification_type', OLD.certification_type, 'certificate_number', OLD.certificate_number));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_material_certifications_trigger ON public.material_certifications;
CREATE TRIGGER audit_material_certifications_trigger
AFTER INSERT OR DELETE ON public.material_certifications
FOR EACH ROW EXECUTE FUNCTION public.audit_material_certification_change();

-- ===== Material supplier link audit =====
CREATE OR REPLACE FUNCTION public.audit_material_supplier_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supplier_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT name INTO v_supplier_name FROM public.suppliers WHERE id = NEW.supplier_id;
    INSERT INTO public.material_audit (material_id, action, changed_by, changed_by_name, details)
    VALUES (NEW.material_id, 'supplier_linked', auth.uid(), public.current_user_email(),
            jsonb_build_object('supplier_id', NEW.supplier_id, 'supplier_name', v_supplier_name, 'grade', NEW.grade));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT name INTO v_supplier_name FROM public.suppliers WHERE id = OLD.supplier_id;
    INSERT INTO public.material_audit (material_id, action, changed_by, changed_by_name, details)
    VALUES (OLD.material_id, 'supplier_unlinked', auth.uid(), public.current_user_email(),
            jsonb_build_object('supplier_id', OLD.supplier_id, 'supplier_name', v_supplier_name));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_material_suppliers_trigger ON public.material_suppliers;
CREATE TRIGGER audit_material_suppliers_trigger
AFTER INSERT OR DELETE ON public.material_suppliers
FOR EACH ROW EXECUTE FUNCTION public.audit_material_supplier_change();
