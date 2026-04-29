-- 1. Assign all 10 rubber test items to the Yibao sample
INSERT INTO public.sample_test_items (sample_id, test_item_id)
SELECT '10d5cf46-7295-485b-a4a7-0babc144924f'::uuid, ti.id
FROM public.test_items ti
WHERE ti.id BETWEEN 68 AND 77
ON CONFLICT DO NOTHING;

-- 2. Set directions on paired directional results.
-- Convention: lower id = first zone, higher id = second zone.
-- Skin/Middle pairs: Tensile(69), Elongation(70), Tear(71), Density(72)
UPDATE public.test_results SET direction = 'Skin'   WHERE id IN (219, 220, 223, 225);
UPDATE public.test_results SET direction = 'Middle' WHERE id IN (218, 221, 222, 224);

-- X/Y pairs: Heat Shrinkage(75), Vulcanize(76)
UPDATE public.test_results SET direction = 'X' WHERE id IN (228, 230);
UPDATE public.test_results SET direction = 'Y' WHERE id IN (229, 231);