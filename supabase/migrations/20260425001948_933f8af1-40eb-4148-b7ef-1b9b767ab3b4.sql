
-- Helper: tables to harden
-- For each, drop the permissive insert/update policies and recreate with role checks.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'samples','test_results','sample_test_items','customers','suppliers',
    'materials','equipment','calibration_records','maintenance_logs',
    'equipment_test_items','material_suppliers','sops','sop_versions',
    'standards','oem_specifications','test_items','test_requirements',
    'test_programs','test_program_items','conditioning_profiles'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated insert %I" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated update %I" ON public.%I', t, t);

    EXECUTE format($f$
      CREATE POLICY "Staff insert %1$I" ON public.%1$I
        FOR INSERT TO authenticated
        WITH CHECK (
          public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'lab_tech'::app_role)
        )
    $f$, t);

    EXECUTE format($f$
      CREATE POLICY "Staff update %1$I" ON public.%1$I
        FOR UPDATE TO authenticated
        USING (
          public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'lab_tech'::app_role)
        )
        WITH CHECK (
          public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'lab_tech'::app_role)
        )
    $f$, t);
  END LOOP;
END$$;
