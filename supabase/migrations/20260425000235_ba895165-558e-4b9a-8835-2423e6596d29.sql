DO $$
DECLARE t TEXT;
DECLARE tables TEXT[] := ARRAY['samples','customers','equipment','materials','suppliers','sops','test_programs'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I', t, t);
  END LOOP;
END $$;