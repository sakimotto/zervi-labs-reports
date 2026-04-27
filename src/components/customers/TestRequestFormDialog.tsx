import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ClipboardList,
  Save,
  CalendarClock,
  Beaker,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FormSection,
  FormGrid,
  FormField,
  FormInput,
  FormTextarea,
  StepIndicator,
  StickyFormFooter,
} from '@/components/form/FormPrimitives';
import {
  type DbTestRequest,
  type DbTestRequestInsert,
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
  useCreateTestRequest,
  useUpdateTestRequest,
} from '@/hooks/useTestRequests';
import { useActiveTestRequestTemplates } from '@/hooks/useTestRequestTemplates';

/* ----------------------------- Schema ------------------------------------- */

const optionalEmail = z
  .string()
  .trim()
  .max(255, 'Must be 255 characters or less')
  .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: 'Invalid email address',
  })
  .optional();

const optionalNonNegativeNumberString = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || (Number.isFinite(Number(v)) && Number(v) >= 0),
    { message: 'Must be a non-negative number' },
  )
  .optional();

const requestSchema = z
  .object({
    // Step 1 — Details
    description: z
      .string()
      .trim()
      .min(1, 'Describe what should be tested')
      .max(2000, 'Must be 2000 characters or less'),
    po_number: z.string().trim().max(100, 'Must be 100 characters or less').optional(),
    contact_person: z.string().trim().max(150, 'Must be 150 characters or less').optional(),
    contact_email: optionalEmail,
    assigned_to: z.string().trim().max(150, 'Must be 150 characters or less').optional(),

    // Step 2 — Schedule & status
    requested_date: z.string().optional(),
    due_date: z.string().optional(),
    priority: z
      .string()
      .min(1, 'Required')
      .refine((v) => (REQUEST_PRIORITIES as readonly string[]).includes(v), 'Invalid priority'),
    status: z
      .string()
      .min(1, 'Required')
      .refine((v) => (REQUEST_STATUSES as readonly string[]).includes(v), 'Invalid status'),

    // Step 3 — Scope & commercial
    scope: z.string().trim().max(2000, 'Must be 2000 characters or less').optional(),
    materials_description: z.string().trim().max(2000, 'Must be 2000 characters or less').optional(),
    estimated_cost: optionalNonNegativeNumberString,
    currency: z.string().trim().min(1, 'Required').max(10, 'Must be 10 characters or less'),
    notes: z.string().max(5000, 'Must be 5000 characters or less').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.due_date && data.requested_date && data.due_date < data.requested_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['due_date'],
        message: 'Due date must be on or after requested date',
      });
    }
  });

type RequestFormValues = z.infer<typeof requestSchema>;

const blank = (): RequestFormValues => ({
  description: '',
  po_number: '',
  contact_person: '',
  contact_email: '',
  assigned_to: '',
  requested_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  priority: 'Normal',
  status: 'Requested',
  scope: '',
  materials_description: '',
  estimated_cost: '',
  currency: 'USD',
  notes: '',
});

function requestToValues(r: DbTestRequest): RequestFormValues {
  return {
    description: r.description ?? '',
    po_number: r.po_number ?? '',
    contact_person: r.contact_person ?? '',
    contact_email: r.contact_email ?? '',
    assigned_to: r.assigned_to ?? '',
    requested_date: r.requested_date ?? '',
    due_date: r.due_date ?? '',
    priority: r.priority ?? 'Normal',
    status: r.status ?? 'Requested',
    scope: r.scope ?? '',
    materials_description: r.materials_description ?? '',
    estimated_cost: r.estimated_cost != null ? String(r.estimated_cost) : '',
    currency: r.currency ?? 'USD',
    notes: r.notes ?? '',
  };
}

const STEPS = [
  {
    label: 'Details',
    description: 'Scope summary & contacts',
    icon: ClipboardList,
    fields: ['description', 'po_number', 'contact_person', 'contact_email', 'assigned_to'] as const,
  },
  {
    label: 'Schedule',
    description: 'Dates, priority, status',
    icon: CalendarClock,
    fields: ['requested_date', 'due_date', 'priority', 'status'] as const,
  },
  {
    label: 'Scope & commercial',
    description: 'Methods, cost, notes',
    icon: Beaker,
    fields: ['scope', 'materials_description', 'estimated_cost', 'currency', 'notes'] as const,
  },
];

/* ----------------------------- Scope templates ----------------------------
 * Quick-fill blueprints are loaded from the `test_request_templates` table
 * and managed at /admin/request-templates. The form just consumes them.
 * -------------------------------------------------------------------------- */

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customerId: string;
  request?: DbTestRequest | null;
}

export function TestRequestFormDialog({ open, onOpenChange, customerId, request }: Props) {
  const create = useCreateTestRequest();
  const update = useUpdateTestRequest();
  const isEdit = !!request;

  const [step, setStep] = useState(0);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: blank(),
    mode: 'onBlur',
  });
  const { register, control, handleSubmit, reset, trigger, getValues, setValue, formState } = form;
  const errors = formState.errors;
  const { data: templates = [] } = useActiveTestRequestTemplates();

  const applyTemplate = (id: string) => {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    const current = getValues();
    const mergeText = (existing: string | undefined, addition: string) => {
      const trimmed = (existing ?? '').trim();
      if (!trimmed) return addition;
      // Avoid double-applying the exact same template.
      if (trimmed === addition.trim()) return trimmed;
      return `${trimmed}\n\n${addition}`;
    };
    setValue('scope', mergeText(current.scope, tpl.scope), {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue('materials_description', mergeText(current.materials_description, tpl.materials), {
      shouldDirty: true,
      shouldValidate: true,
    });
    toast.success(`Applied template: ${tpl.label}`);
  };

  useEffect(() => {
    if (!open) return;
    setStep(0);
    reset(request ? requestToValues(request) : blank());
  }, [open, request, reset]);

  const next = async () => {
    const ok = await trigger(STEPS[step].fields as readonly (keyof RequestFormValues)[], {
      shouldFocus: true,
    });
    if (ok) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const onSubmit = handleSubmit(
    async (data) => {
      const payload: Omit<DbTestRequestInsert, 'request_number'> = {
        customer_id: customerId,
        contact_person: data.contact_person?.trim() || null,
        contact_email: data.contact_email?.trim() || null,
        po_number: data.po_number?.trim() || null,
        requested_date: data.requested_date || null,
        due_date: data.due_date || null,
        priority: data.priority,
        status: data.status,
        description: data.description.trim(),
        scope: data.scope?.trim() || null,
        materials_description: data.materials_description?.trim() || null,
        estimated_cost: data.estimated_cost ? Number(data.estimated_cost) : null,
        currency: data.currency || 'USD',
        assigned_to: data.assigned_to?.trim() || null,
        notes: data.notes?.trim() || null,
      };
      try {
        if (isEdit && request) {
          await update.mutateAsync({ id: request.id, ...payload });
          toast.success('Test request updated');
        } else {
          await create.mutateAsync(payload);
          toast.success('Test request created');
        }
        onOpenChange(false);
      } catch (err: any) {
        toast.error(err.message ?? 'Failed to save request');
      }
    },
    () => {
      // On validation failure, jump to first step that contains an error.
      const firstBad = STEPS.findIndex((s) =>
        (s.fields as readonly (keyof RequestFormValues)[]).some((f) => !!errors[f]),
      );
      if (firstBad >= 0) setStep(firstBad);
    },
  );

  const busy = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            {isEdit
              ? `Edit ${request?.request_number ?? 'request'}`
              : 'New customer test request'}
          </DialogTitle>
        </DialogHeader>

        <div className="border-y border-border bg-muted/30">
          <StepIndicator
            steps={STEPS.map((s) => ({ label: s.label, description: s.description }))}
            current={step}
            onJump={(i) => i < step && setStep(i)}
          />
        </div>

        <form onSubmit={onSubmit} noValidate>
          <div className="px-6 py-5 space-y-4">
            {step === 0 && (
              <FormSection title="Request details" icon={ClipboardList} bare>
                <FormGrid cols={2}>
                  <FormField
                    label="Description"
                    required
                    error={errors.description?.message}
                    span="full"
                  >
                    <FormTextarea
                      rows={2}
                      maxLength={2000}
                      autoFocus
                      {...register('description')}
                      error={!!errors.description}
                      placeholder="What should be tested and why?"
                    />
                  </FormField>
                  <FormField label="PO number" error={errors.po_number?.message}>
                    <FormInput
                      {...register('po_number')}
                      error={!!errors.po_number}
                      maxLength={100}
                    />
                  </FormField>
                  <FormField label="Contact person" error={errors.contact_person?.message}>
                    <FormInput
                      {...register('contact_person')}
                      error={!!errors.contact_person}
                      maxLength={150}
                    />
                  </FormField>
                  <FormField label="Contact email" error={errors.contact_email?.message}>
                    <FormInput
                      type="email"
                      {...register('contact_email')}
                      error={!!errors.contact_email}
                      maxLength={255}
                    />
                  </FormField>
                  <FormField label="Assigned to (lab)" error={errors.assigned_to?.message}>
                    <FormInput
                      {...register('assigned_to')}
                      error={!!errors.assigned_to}
                      maxLength={150}
                    />
                  </FormField>
                </FormGrid>
              </FormSection>
            )}

            {step === 1 && (
              <FormSection
                title="Schedule & status"
                icon={CalendarClock}
                description="When the work is needed and where it stands today."
                bare
              >
                <FormGrid cols={4}>
                  <FormField label="Requested date" error={errors.requested_date?.message}>
                    <FormInput
                      type="date"
                      {...register('requested_date')}
                      error={!!errors.requested_date}
                    />
                  </FormField>
                  <FormField label="Due date" error={errors.due_date?.message}>
                    <FormInput
                      type="date"
                      {...register('due_date')}
                      error={!!errors.due_date}
                    />
                  </FormField>
                  <FormField label="Priority" error={errors.priority?.message}>
                    <Controller
                      control={control}
                      name="priority"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REQUEST_PRIORITIES.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>
                  <FormField label="Status" error={errors.status?.message}>
                    <Controller
                      control={control}
                      name="status"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REQUEST_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>
                </FormGrid>
              </FormSection>
            )}

            {step === 2 && (
              <>
                <FormSection title="Scope & materials" icon={Beaker} bare>
                  <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-foreground">
                      Quick-fill from template
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Appends to existing text
                    </span>
                    <div className="ml-auto w-full sm:w-72">
                      <Select value="" onValueChange={(v) => v && applyTemplate(v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Choose a request template…" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.length === 0 ? (
                            <div className="px-2 py-3 text-xs text-muted-foreground">
                              No templates yet — create some at /admin/request-templates
                            </div>
                          ) : (
                            templates.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{t.label}</span>
                                  {t.description && (
                                    <span className="text-xs text-muted-foreground">
                                      {t.description}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <FormGrid cols={1}>
                    <FormField
                      label="Test scope"
                      hint="Which standards / properties / methods are required"
                      error={errors.scope?.message}
                    >
                      <FormTextarea
                        rows={6}
                        maxLength={2000}
                        {...register('scope')}
                        error={!!errors.scope}
                        placeholder="e.g. Tensile (ISO 13934), Abrasion (Martindale 20k cycles), Color fastness"
                      />
                    </FormField>
                    <FormField
                      label="Materials / samples to test"
                      error={errors.materials_description?.message}
                    >
                      <FormTextarea
                        rows={2}
                        maxLength={2000}
                        {...register('materials_description')}
                        error={!!errors.materials_description}
                        placeholder="Describe the materials being supplied"
                      />
                    </FormField>
                  </FormGrid>
                </FormSection>

                <FormSection title="Commercial & notes" bare>
                  <FormGrid cols={3}>
                    <FormField label="Estimated cost" error={errors.estimated_cost?.message}>
                      <FormInput
                        type="number"
                        step="0.01"
                        min={0}
                        {...register('estimated_cost')}
                        error={!!errors.estimated_cost}
                      />
                    </FormField>
                    <FormField label="Currency" error={errors.currency?.message}>
                      <FormInput
                        {...register('currency')}
                        error={!!errors.currency}
                        maxLength={10}
                      />
                    </FormField>
                    <div />
                    <FormField label="Internal notes" span="full" error={errors.notes?.message}>
                      <FormTextarea
                        rows={2}
                        maxLength={5000}
                        {...register('notes')}
                        error={!!errors.notes}
                      />
                    </FormField>
                  </FormGrid>
                </FormSection>
              </>
            )}
          </div>

          <StickyFormFooter align="between">
            <div className="text-xs text-muted-foreground">
              Step {step + 1} of {STEPS.length} ·{' '}
              <span className="font-medium text-foreground">{STEPS[step].label}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              {step > 0 && (
                <Button type="button" variant="outline" onClick={back} disabled={busy}>
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={next} disabled={busy}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={busy}>
                  <Save className="h-4 w-4" />{' '}
                  {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create request'}
                </Button>
              )}
            </div>
          </StickyFormFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
