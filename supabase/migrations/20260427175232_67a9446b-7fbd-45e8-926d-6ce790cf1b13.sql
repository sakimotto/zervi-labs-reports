-- Test Request templates: reusable scope/materials snippets used by the
-- Test Request form's "Quick-fill from template" picker.
CREATE TABLE public.test_request_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  scope TEXT NOT NULL DEFAULT '',
  materials TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_test_request_templates_sort
  ON public.test_request_templates(sort_order, label)
  WHERE is_active = true;

-- updated_at maintenance
CREATE TRIGGER trg_test_request_templates_updated_at
  BEFORE UPDATE ON public.test_request_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Validation
CREATE OR REPLACE FUNCTION public.validate_test_request_template()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.label IS NULL OR length(trim(NEW.label)) = 0 THEN
    RAISE EXCEPTION 'Template label is required';
  END IF;
  IF length(NEW.label) > 200 THEN
    RAISE EXCEPTION 'Label must be 200 characters or less';
  END IF;
  IF NEW.description IS NOT NULL AND length(NEW.description) > 500 THEN
    RAISE EXCEPTION 'Description must be 500 characters or less';
  END IF;
  IF length(NEW.scope) > 5000 THEN
    RAISE EXCEPTION 'Scope must be 5000 characters or less';
  END IF;
  IF length(NEW.materials) > 5000 THEN
    RAISE EXCEPTION 'Materials must be 5000 characters or less';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_test_request_templates_validate
  BEFORE INSERT OR UPDATE ON public.test_request_templates
  FOR EACH ROW EXECUTE FUNCTION public.validate_test_request_template();

-- RLS: any authenticated user can read; only admins can write.
ALTER TABLE public.test_request_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view templates"
  ON public.test_request_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert templates"
  ON public.test_request_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update templates"
  ON public.test_request_templates
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete templates"
  ON public.test_request_templates
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed with the 5 blueprints currently hardcoded in the form.
INSERT INTO public.test_request_templates (label, description, scope, materials, sort_order) VALUES
('Automotive interior fabric',
 'OEM trim/seating qualification suite',
 E'Tensile strength (ISO 13934-1, warp & weft)\nTear strength (ISO 13937-2)\nAbrasion resistance — Martindale 50,000 cycles (ISO 12947-2)\nColor fastness to light (ISO 105-B02, grade ≥ 4)\nColor fastness to rubbing — dry & wet (ISO 105-X12)\nFlammability — horizontal burn (FMVSS 302, ≤ 100 mm/min)\nFogging (DIN 75201-B, reflectometer)',
 E'1× roll, ~2 linear meters, full width\nInclude TDS and supplier batch / lot number',
 10),
('Apparel — woven fabric',
 'Standard garment-grade qualification',
 E'Composition / fiber content (ISO 1833)\nMass per unit area (ISO 3801)\nDimensional change after washing (ISO 6330 + ISO 5077, 3 cycles)\nColor fastness to washing (ISO 105-C06)\nColor fastness to rubbing (ISO 105-X12)\nPilling — Martindale (ISO 12945-2, 2,000 rubs)\nTensile strength (ISO 13934-1)',
 E'1.5 m × full width, unwashed\nCare label and composition declaration',
 20),
('PU-coated / synthetic leather',
 'Coated-fabric durability & adhesion',
 E'Coating adhesion (ISO 2411)\nFlex resistance — Bally flex 50,000 cycles (ISO 5402-1)\nAbrasion (Martindale 25,000 cycles, ISO 12947-2)\nHydrolysis resistance (ISO 1419, 70 °C / 95% RH, 3 weeks)\nColor fastness to light (ISO 105-B02)\nVOC / fogging (VDA 278 or DIN 75201)',
 E'1× A4 panel + 0.5 m roll\nDeclare base substrate & coating chemistry',
 30),
('Incoming raw material check',
 'Quick conformity vs. supplier spec',
 E'Visual inspection vs. reference swatch\nMass per unit area (ISO 3801)\nWidth & length verification\nColor difference ΔE vs. master (CIE Lab, D65/10°)\nCheck batch certificate values',
 E'1× sample piece (min 0.5 m × full width)\nSupplier CoA / batch certificate',
 40),
('Failure investigation',
 'Root-cause analysis on a returned part',
 E'Visual & microscopic examination of failure area\nFiber identification (FTIR / burn test)\nComparison vs. original spec\nMechanical retest of affected property\nWritten root-cause report with photos',
 E'Failed part + reference (unused) sample if available\nField history / conditions of failure',
 50);
