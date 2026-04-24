
-- ============================================================
-- 1. ROLES SYSTEM
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'lab_tech', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- First user becomes admin, others lab_tech
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE user_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count <= 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'lab_tech');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. FIX EXISTING FUNCTIONS — add search_path
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 3. FIX JUDGMENT TRIGGER — fire on INSERT / UPDATE / DELETE
-- ============================================================
CREATE OR REPLACE FUNCTION public.recalculate_sample_judgment()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sample_id UUID;
  v_total INT;
  v_ok INT;
  v_ng INT;
  v_assigned INT;
  v_new_judgment public.judgment;
BEGIN
  v_sample_id := COALESCE(NEW.sample_id, OLD.sample_id);
  IF v_sample_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE judgment = 'OK'),
    COUNT(*) FILTER (WHERE judgment = 'NG')
  INTO v_total, v_ok, v_ng
  FROM public.test_results
  WHERE sample_id = v_sample_id;

  SELECT COUNT(DISTINCT test_item_id) INTO v_assigned
  FROM public.sample_test_items
  WHERE sample_id = v_sample_id;

  IF v_ng > 0 THEN
    v_new_judgment := 'NG';
  ELSIF v_total > 0 AND v_ok = v_total AND (v_assigned = 0 OR v_ok >= v_assigned) THEN
    v_new_judgment := 'OK';
  ELSE
    v_new_judgment := 'Pending';
  END IF;

  UPDATE public.samples
    SET overall_judgment = v_new_judgment, updated_at = now()
    WHERE id = v_sample_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recalculate_judgment ON public.test_results;
CREATE TRIGGER trg_recalculate_judgment
  AFTER INSERT OR UPDATE OR DELETE ON public.test_results
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_sample_judgment();

-- ============================================================
-- 4. DROP DUPLICATE updated_at TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
DROP TRIGGER IF EXISTS update_equipment_updated_at ON public.equipment;
DROP TRIGGER IF EXISTS update_materials_updated_at ON public.materials;
DROP TRIGGER IF EXISTS update_samples_updated_at ON public.samples;
DROP TRIGGER IF EXISTS update_sops_updated_at ON public.sops;
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
DROP TRIGGER IF EXISTS update_test_programs_updated_at ON public.test_programs;
DROP TRIGGER IF EXISTS update_test_results_updated_at ON public.test_results;

-- ============================================================
-- 5. REWRITE RLS — require authentication, admin-only deletes
-- ============================================================
DO $$
DECLARE
  t TEXT;
  pol TEXT;
  tables TEXT[] := ARRAY[
    'samples','sample_test_items','test_results','test_items','test_requirements',
    'test_programs','test_program_items','suppliers','customers','materials',
    'material_suppliers','equipment','equipment_test_items','calibration_records',
    'maintenance_logs','sops','sop_versions','standards','oem_specifications',
    'conditioning_profiles'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format($f$CREATE POLICY "Authenticated read %1$I" ON public.%1$I FOR SELECT TO authenticated USING (true)$f$, t);
    EXECUTE format($f$CREATE POLICY "Authenticated insert %1$I" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (true)$f$, t);
    EXECUTE format($f$CREATE POLICY "Authenticated update %1$I" ON public.%1$I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)$f$, t);
    EXECUTE format($f$CREATE POLICY "Admins delete %1$I" ON public.%1$I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'))$f$, t);
  END LOOP;
END $$;
