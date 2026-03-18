
-- Function to recalculate overall_judgment on a sample based on its test_results
CREATE OR REPLACE FUNCTION public.recalculate_sample_judgment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sample_id uuid;
  v_total int;
  v_ok int;
  v_ng int;
  v_new_judgment judgment;
  v_assigned int;
BEGIN
  -- Determine which sample_id to recalculate
  IF TG_OP = 'DELETE' THEN
    v_sample_id := OLD.sample_id;
  ELSE
    v_sample_id := NEW.sample_id;
  END IF;

  IF v_sample_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Count results
  SELECT count(*), 
         count(*) FILTER (WHERE judgment = 'OK'),
         count(*) FILTER (WHERE judgment = 'NG')
  INTO v_total, v_ok, v_ng
  FROM test_results
  WHERE sample_id = v_sample_id;

  -- Count assigned test items (if any)
  SELECT count(*) INTO v_assigned
  FROM sample_test_items
  WHERE sample_id = v_sample_id;

  -- Determine judgment
  IF v_ng > 0 THEN
    v_new_judgment := 'NG';
  ELSIF v_total > 0 AND v_ok = v_total AND (v_assigned = 0 OR v_ok >= v_assigned) THEN
    v_new_judgment := 'OK';
  ELSE
    v_new_judgment := 'Pending';
  END IF;

  -- Update sample
  UPDATE samples
  SET overall_judgment = v_new_judgment,
      updated_at = now()
  WHERE id = v_sample_id AND (overall_judgment IS DISTINCT FROM v_new_judgment);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger on test_results changes
CREATE TRIGGER trg_recalculate_judgment
  AFTER INSERT OR UPDATE OR DELETE ON test_results
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_sample_judgment();

-- Add updated_at triggers to tables that have the column but no trigger
CREATE TRIGGER trg_samples_updated_at
  BEFORE UPDATE ON samples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_sops_updated_at
  BEFORE UPDATE ON sops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_test_programs_updated_at
  BEFORE UPDATE ON test_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_test_results_updated_at
  BEFORE UPDATE ON test_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
