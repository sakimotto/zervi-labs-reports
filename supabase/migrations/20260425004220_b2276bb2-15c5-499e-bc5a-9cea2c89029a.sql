-- Add explicit viewer-scoped read policies and restrictive deny-write policies
-- across all data tables. Viewer = read-only, enforced at DB layer.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'samples', 'test_results', 'test_items', 'test_requirements',
    'sample_test_items', 'customers', 'suppliers', 'materials',
    'material_suppliers', 'equipment', 'equipment_test_items',
    'calibration_records', 'maintenance_logs', 'sops', 'sop_versions',
    'standards', 'oem_specifications', 'conditioning_profiles',
    'test_programs', 'test_program_items'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Explicit viewer read policy (documents intent)
    EXECUTE format($f$
      DROP POLICY IF EXISTS "Viewers read %1$I" ON public.%1$I;
      CREATE POLICY "Viewers read %1$I" ON public.%1$I
        FOR SELECT TO authenticated
        USING (public.has_role(auth.uid(), 'viewer'::app_role));
    $f$, t);

    -- Restrictive deny: viewers can NEVER insert
    EXECUTE format($f$
      DROP POLICY IF EXISTS "Deny viewer insert %1$I" ON public.%1$I;
      CREATE POLICY "Deny viewer insert %1$I" ON public.%1$I
        AS RESTRICTIVE FOR INSERT TO authenticated
        WITH CHECK (NOT public.has_role(auth.uid(), 'viewer'::app_role)
                    OR public.has_role(auth.uid(), 'admin'::app_role)
                    OR public.has_role(auth.uid(), 'lab_tech'::app_role));
    $f$, t);

    -- Restrictive deny: viewers can NEVER update
    EXECUTE format($f$
      DROP POLICY IF EXISTS "Deny viewer update %1$I" ON public.%1$I;
      CREATE POLICY "Deny viewer update %1$I" ON public.%1$I
        AS RESTRICTIVE FOR UPDATE TO authenticated
        USING (NOT public.has_role(auth.uid(), 'viewer'::app_role)
               OR public.has_role(auth.uid(), 'admin'::app_role)
               OR public.has_role(auth.uid(), 'lab_tech'::app_role))
        WITH CHECK (NOT public.has_role(auth.uid(), 'viewer'::app_role)
                    OR public.has_role(auth.uid(), 'admin'::app_role)
                    OR public.has_role(auth.uid(), 'lab_tech'::app_role));
    $f$, t);

    -- Restrictive deny: viewers can NEVER delete
    EXECUTE format($f$
      DROP POLICY IF EXISTS "Deny viewer delete %1$I" ON public.%1$I;
      CREATE POLICY "Deny viewer delete %1$I" ON public.%1$I
        AS RESTRICTIVE FOR DELETE TO authenticated
        USING (NOT public.has_role(auth.uid(), 'viewer'::app_role)
               OR public.has_role(auth.uid(), 'admin'::app_role));
    $f$, t);
  END LOOP;
END $$;