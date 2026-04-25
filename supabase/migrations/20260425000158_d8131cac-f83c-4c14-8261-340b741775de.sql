-- 1. Judgment recalculation trigger on test_results (INSERT/UPDATE/DELETE)
DROP TRIGGER IF EXISTS trg_recalculate_judgment ON public.test_results;
CREATE TRIGGER trg_recalculate_judgment
AFTER INSERT OR UPDATE OR DELETE ON public.test_results
FOR EACH ROW EXECUTE FUNCTION public.recalculate_sample_judgment();

-- 2. updated_at triggers on every table that has an updated_at column
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'samples','customers','equipment','materials','suppliers',
    'sops','test_programs'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
      t, t
    );
  END LOOP;
END $$;

-- 3. New-user role assignment trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Backfill: recompute judgments for all existing samples now that the trigger is in place
UPDATE public.samples s SET overall_judgment = sub.new_judgment, updated_at = now()
FROM (
  SELECT
    s.id AS sample_id,
    CASE
      WHEN COUNT(tr.*) FILTER (WHERE tr.judgment = 'NG') > 0 THEN 'NG'::public.judgment
      WHEN COUNT(tr.*) > 0
        AND COUNT(tr.*) FILTER (WHERE tr.judgment = 'OK') = COUNT(tr.*)
        AND (COALESCE((SELECT COUNT(DISTINCT test_item_id) FROM public.sample_test_items WHERE sample_id = s.id), 0) = 0
          OR COUNT(tr.*) FILTER (WHERE tr.judgment = 'OK') >= (SELECT COUNT(DISTINCT test_item_id) FROM public.sample_test_items WHERE sample_id = s.id))
        THEN 'OK'::public.judgment
      ELSE 'Pending'::public.judgment
    END AS new_judgment
  FROM public.samples s
  LEFT JOIN public.test_results tr ON tr.sample_id = s.id
  GROUP BY s.id
) sub
WHERE s.id = sub.sample_id AND s.overall_judgment IS DISTINCT FROM sub.new_judgment;