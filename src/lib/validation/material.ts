import { z } from 'zod';

export const STRUCTURE_VALUES = [
  'Woven', 'Knit', 'Nonwoven', 'Coated', 'Laminated', 'Composite', 'Film', 'Foam', 'Other',
] as const;

export const TYPE_VALUES = [
  'Fabric', 'PVC', 'Leather', 'Film', 'Foam', 'Composite', 'Yarn', 'Other',
] as const;

export const STATUS_VALUES = ['Active', 'Draft', 'Archived', 'Obsolete'] as const;

const numInRange = (min: number, max: number, label: string) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number({ invalid_type_error: `${label} must be a number` })
      .refine((n) => !Number.isNaN(n), `${label} must be a number`)
      .refine((n) => n > min - Number.EPSILON, `${label} must be greater than ${min}`)
      .refine((n) => n <= max, `${label} must be ≤ ${max}`)
      .optional(),
  ).optional();

export const materialCreateSchema = z.object({
  name: z.string().trim()
    .min(1, 'Material name is required')
    .max(200, 'Material name must be 200 characters or less'),
  material_code: z.string().trim().max(50, 'Material code must be 50 characters or less').optional().or(z.literal('')),
  material_type: z.enum(TYPE_VALUES, {
    errorMap: () => ({ message: 'Select a valid material type' }),
  }),
  structure: z.enum(STRUCTURE_VALUES).optional().or(z.literal('')),
  composition: z.string().trim().max(500, 'Composition must be 500 characters or less').optional().or(z.literal('')),
  weight_gsm: numInRange(0, 10000, 'Weight (gsm)'),
  width_cm: numInRange(0, 1000, 'Width (cm)'),
  color: z.string().trim().max(100).optional().or(z.literal('')),
  finish: z.string().trim().max(100).optional().or(z.literal('')),
  notes: z.string().trim().max(2000, 'Notes must be 2000 characters or less').optional().or(z.literal('')),
});

export type MaterialCreateInput = z.infer<typeof materialCreateSchema>;

export const materialUpdateSchema = materialCreateSchema.partial().extend({
  status: z.enum(STATUS_VALUES).optional(),
  thickness_mm: numInRange(0, 100, 'Thickness (mm)'),
  warp_density_per_cm: numInRange(0, 1000, 'Warp density (/cm)'),
  weft_density_per_cm: numInRange(0, 1000, 'Weft density (/cm)'),
  stretch_warp_percent: numInRange(0, 500, 'Stretch warp (%)'),
  stretch_weft_percent: numInRange(0, 500, 'Stretch weft (%)'),
  gsm_tolerance: numInRange(0, 100, 'GSM tolerance (%)'),
});

/** Map a server-side validation error from PostgREST/Supabase to a friendly message. */
export function friendlyMaterialError(err: { message?: string } | null | undefined): string {
  const m = err?.message ?? 'Unknown error';
  // Strip "ERROR: ..." prefix and surrounding quotes if present.
  return m.replace(/^.*?:\s*/, '').replace(/^"|"$/g, '');
}
