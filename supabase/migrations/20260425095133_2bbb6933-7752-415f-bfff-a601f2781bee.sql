-- Server-side validation trigger for materials: numeric ranges and required identity fields
CREATE OR REPLACE FUNCTION public.validate_material()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Required identity fields
  IF NEW.name IS NULL OR length(trim(NEW.name)) = 0 THEN
    RAISE EXCEPTION 'Material name is required';
  END IF;
  IF length(NEW.name) > 200 THEN
    RAISE EXCEPTION 'Material name must be 200 characters or less';
  END IF;
  IF NEW.material_type IS NULL OR length(trim(NEW.material_type)) = 0 THEN
    RAISE EXCEPTION 'Material type is required';
  END IF;
  IF NEW.material_code IS NOT NULL AND length(NEW.material_code) > 50 THEN
    RAISE EXCEPTION 'Material code must be 50 characters or less';
  END IF;

  -- Numeric ranges (only validate when present)
  IF NEW.weight_gsm IS NOT NULL AND (NEW.weight_gsm <= 0 OR NEW.weight_gsm > 10000) THEN
    RAISE EXCEPTION 'weight_gsm must be between 0 and 10000';
  END IF;
  IF NEW.width_cm IS NOT NULL AND (NEW.width_cm <= 0 OR NEW.width_cm > 1000) THEN
    RAISE EXCEPTION 'width_cm must be between 0 and 1000';
  END IF;
  IF NEW.thickness_mm IS NOT NULL AND (NEW.thickness_mm <= 0 OR NEW.thickness_mm > 100) THEN
    RAISE EXCEPTION 'thickness_mm must be between 0 and 100';
  END IF;
  IF NEW.warp_density_per_cm IS NOT NULL AND (NEW.warp_density_per_cm < 0 OR NEW.warp_density_per_cm > 1000) THEN
    RAISE EXCEPTION 'warp_density_per_cm must be between 0 and 1000';
  END IF;
  IF NEW.weft_density_per_cm IS NOT NULL AND (NEW.weft_density_per_cm < 0 OR NEW.weft_density_per_cm > 1000) THEN
    RAISE EXCEPTION 'weft_density_per_cm must be between 0 and 1000';
  END IF;
  IF NEW.stretch_warp_percent IS NOT NULL AND (NEW.stretch_warp_percent < 0 OR NEW.stretch_warp_percent > 500) THEN
    RAISE EXCEPTION 'stretch_warp_percent must be between 0 and 500';
  END IF;
  IF NEW.stretch_weft_percent IS NOT NULL AND (NEW.stretch_weft_percent < 0 OR NEW.stretch_weft_percent > 500) THEN
    RAISE EXCEPTION 'stretch_weft_percent must be between 0 and 500';
  END IF;
  IF NEW.gsm_tolerance IS NOT NULL AND (NEW.gsm_tolerance < 0 OR NEW.gsm_tolerance > 100) THEN
    RAISE EXCEPTION 'gsm_tolerance must be between 0 and 100';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_material_trigger ON public.materials;
CREATE TRIGGER validate_material_trigger
  BEFORE INSERT OR UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.validate_material();