-- Add provenance fields to samples so we can flag supplier-issued / third-party test reports
ALTER TABLE public.samples
  ADD COLUMN IF NOT EXISTS report_source text NOT NULL DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS external_report_number text,
  ADD COLUMN IF NOT EXISTS external_report_date date,
  ADD COLUMN IF NOT EXISTS external_lab_name text,
  ADD COLUMN IF NOT EXISTS external_form_number text,
  ADD COLUMN IF NOT EXISTS external_reviewer text,
  ADD COLUMN IF NOT EXISTS external_tester text,
  ADD COLUMN IF NOT EXISTS external_notes text;

-- Validate report_source values
CREATE OR REPLACE FUNCTION public.validate_sample_report_source()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.report_source NOT IN ('internal','supplier','third_party','customer') THEN
    RAISE EXCEPTION 'Invalid report_source: %. Must be internal, supplier, third_party, or customer', NEW.report_source;
  END IF;
  -- External-source samples should have at least an external lab name
  IF NEW.report_source IN ('supplier','third_party') AND
     (NEW.external_lab_name IS NULL OR length(trim(NEW.external_lab_name)) = 0) THEN
    RAISE EXCEPTION 'External report (%) requires external_lab_name', NEW.report_source;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_sample_report_source ON public.samples;
CREATE TRIGGER trg_validate_sample_report_source
BEFORE INSERT OR UPDATE ON public.samples
FOR EACH ROW EXECUTE FUNCTION public.validate_sample_report_source();

CREATE INDEX IF NOT EXISTS idx_samples_report_source ON public.samples(report_source);