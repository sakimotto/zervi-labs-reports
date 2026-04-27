import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Phone, CreditCard, FileText, ChevronLeft, ChevronRight, Save } from 'lucide-react';
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
  type DbCustomer,
  type DbCustomerInsert,
  CUSTOMER_TYPES,
  CUSTOMER_STATUSES,
  useCreateCustomer,
  useUpdateCustomer,
} from '@/hooks/useCustomers';
import { useState } from 'react';

/* ----------------------------- Schema ------------------------------------- */

// Optional URL field that accepts blank strings (zod's .url() rejects '').
const optionalUrl = z
  .string()
  .trim()
  .max(500, 'Must be 500 characters or less')
  .refine((v) => v === '' || /^https?:\/\/[^\s]+\.[^\s]+/i.test(v), {
    message: 'Must be a valid URL (https://…)',
  })
  .optional();

const optionalEmail = z
  .string()
  .trim()
  .max(255, 'Must be 255 characters or less')
  .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: 'Invalid email address',
  })
  .optional();

// Numeric strings (form inputs are always strings) with bounds.
const optionalNonNegativeNumberString = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || (Number.isFinite(Number(v)) && Number(v) >= 0),
    { message: 'Must be a non-negative number' },
  )
  .optional();

const optionalRatingString = z
  .string()
  .trim()
  .refine(
    (v) => {
      if (v === '') return true;
      const n = Number(v);
      return Number.isFinite(n) && n >= 1 && n <= 5;
    },
    { message: 'Must be between 1 and 5' },
  )
  .optional();

const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Required')
    .max(200, 'Must be 200 characters or less'),
  customer_code: z.string().trim().max(50, 'Must be 50 characters or less').optional(),
  customer_type: z
    .string()
    .min(1, 'Required')
    .refine((v) => (CUSTOMER_TYPES as readonly string[]).includes(v), 'Invalid type'),
  status: z
    .string()
    .min(1, 'Required')
    .refine((v) => (CUSTOMER_STATUSES as readonly string[]).includes(v), 'Invalid status'),
  industry: z.string().trim().max(100, 'Must be 100 characters or less').optional(),
  website: optionalUrl,
  contact_person: z.string().trim().max(150, 'Must be 150 characters or less').optional(),
  email: optionalEmail,
  secondary_email: optionalEmail,
  phone: z.string().trim().max(50, 'Must be 50 characters or less').optional(),
  address_line: z.string().trim().max(255, 'Must be 255 characters or less').optional(),
  city: z.string().trim().max(100, 'Must be 100 characters or less').optional(),
  state_region: z.string().trim().max(100, 'Must be 100 characters or less').optional(),
  postal_code: z.string().trim().max(30, 'Must be 30 characters or less').optional(),
  country: z.string().trim().max(100, 'Must be 100 characters or less').optional(),
  tax_id: z.string().trim().max(50, 'Must be 50 characters or less').optional(),
  payment_terms: z.string().trim().max(100, 'Must be 100 characters or less').optional(),
  currency: z.string().min(1, 'Required'),
  credit_limit: optionalNonNegativeNumberString,
  rating: optionalRatingString,
  account_manager: z.string().trim().max(150, 'Must be 150 characters or less').optional(),
  notes: z.string().max(5000, 'Must be 5000 characters or less').optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const blank: CustomerFormValues = {
  name: '',
  customer_code: '',
  customer_type: 'OEM',
  status: 'Active',
  industry: '',
  website: '',
  contact_person: '',
  email: '',
  secondary_email: '',
  phone: '',
  address_line: '',
  city: '',
  state_region: '',
  postal_code: '',
  country: '',
  tax_id: '',
  payment_terms: '',
  currency: 'USD',
  credit_limit: '',
  rating: '',
  account_manager: '',
  notes: '',
};

const STEPS = [
  { label: 'Identity', description: 'Name, code, type', icon: Building2, fields: ['name', 'customer_type', 'status', 'customer_code', 'industry', 'website'] as const },
  { label: 'Contact', description: 'People & address', icon: Phone, fields: ['email', 'secondary_email', 'phone', 'contact_person', 'address_line', 'city', 'state_region', 'postal_code', 'country'] as const },
  { label: 'Commercial', description: 'Terms & rating', icon: CreditCard, fields: ['tax_id', 'payment_terms', 'currency', 'credit_limit', 'rating', 'account_manager'] as const },
  { label: 'Notes', description: 'Account & notes', icon: FileText, fields: ['notes'] as const },
];

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: DbCustomer | null;
}

function customerToValues(c: DbCustomer): CustomerFormValues {
  return {
    name: c.name ?? '',
    customer_code: c.customer_code ?? '',
    customer_type: c.customer_type ?? 'OEM',
    status: c.status ?? 'Active',
    industry: c.industry ?? '',
    website: c.website ?? '',
    contact_person: c.contact_person ?? '',
    email: c.email ?? '',
    secondary_email: c.secondary_email ?? '',
    phone: c.phone ?? '',
    address_line: c.address_line ?? '',
    city: c.city ?? '',
    state_region: c.state_region ?? '',
    postal_code: c.postal_code ?? '',
    country: c.country ?? '',
    tax_id: c.tax_id ?? '',
    payment_terms: c.payment_terms ?? '',
    currency: c.currency ?? 'USD',
    credit_limit: c.credit_limit != null ? String(c.credit_limit) : '',
    rating: c.rating != null ? String(c.rating) : '',
    account_manager: c.account_manager ?? '',
    notes: c.notes ?? '',
  };
}

export function CustomerFormDialog({ open, onOpenChange, customer }: CustomerFormDialogProps) {
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const isEdit = !!customer;

  const [step, setStep] = useState(0);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: blank,
    mode: 'onBlur',
  });
  const { register, handleSubmit, reset, control, formState, trigger } = form;
  const errors = formState.errors;

  useEffect(() => {
    if (!open) return;
    setStep(0);
    reset(customer ? customerToValues(customer) : blank);
  }, [open, customer, reset]);

  const next = async () => {
    const ok = await trigger(STEPS[step].fields as readonly (keyof CustomerFormValues)[], {
      shouldFocus: true,
    });
    if (ok) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const onSubmit = handleSubmit(async (data) => {
    const payload: DbCustomerInsert = {
      name: data.name.trim(),
      customer_code: data.customer_code?.trim() || null,
      customer_type: data.customer_type,
      status: data.status,
      industry: data.industry?.trim() || null,
      website: data.website?.trim() || null,
      contact_person: data.contact_person?.trim() || null,
      email: data.email?.trim() || null,
      secondary_email: data.secondary_email?.trim() || null,
      phone: data.phone?.trim() || null,
      address: null, // legacy column kept null; structured fields used instead
      address_line: data.address_line?.trim() || null,
      city: data.city?.trim() || null,
      state_region: data.state_region?.trim() || null,
      postal_code: data.postal_code?.trim() || null,
      country: data.country?.trim() || null,
      tax_id: data.tax_id?.trim() || null,
      payment_terms: data.payment_terms?.trim() || null,
      currency: data.currency || 'USD',
      credit_limit: data.credit_limit ? Number(data.credit_limit) : null,
      rating: data.rating ? Number(data.rating) : null,
      account_manager: data.account_manager?.trim() || null,
      notes: data.notes?.trim() || null,
    };
    try {
      if (isEdit && customer) {
        await update.mutateAsync({ id: customer.id, ...payload });
        toast.success('Customer updated');
      } else {
        await create.mutateAsync(payload);
        toast.success('Customer created');
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save customer');
    }
  }, () => {
    // Validation failure on final submit: jump to the first step that has errors.
    const firstBadStep = STEPS.findIndex((s) =>
      (s.fields as readonly (keyof CustomerFormValues)[]).some((f) => !!errors[f]),
    );
    if (firstBadStep >= 0) setStep(firstBadStep);
  });

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="text-lg">
            {isEdit ? `Edit Customer — ${customer?.name}` : 'New Customer'}
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
              <FormSection
                title="Company identity"
                icon={Building2}
                description="Who they are and how they appear in records."
              >
                <FormGrid cols={2}>
                  <FormField label="Company name" required error={errors.name?.message} span="full">
                    <FormInput
                      {...register('name')}
                      error={!!errors.name}
                      autoFocus
                      maxLength={200}
                      placeholder="Toyota Boshoku Corporation"
                    />
                  </FormField>

                  <FormField
                    label="Customer code"
                    hint="Internal short code"
                    error={errors.customer_code?.message}
                  >
                    <FormInput
                      {...register('customer_code', {
                        setValueAs: (v) => (typeof v === 'string' ? v.toUpperCase() : v),
                      })}
                      error={!!errors.customer_code}
                      maxLength={50}
                      placeholder="TBC-001"
                    />
                  </FormField>

                  <FormField label="Customer type" required error={errors.customer_type?.message}>
                    <Controller
                      control={control}
                      name="customer_type"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CUSTOMER_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
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
                            {CUSTOMER_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>

                  <FormField
                    label="Industry"
                    hint="Automotive, Apparel, Furniture…"
                    error={errors.industry?.message}
                  >
                    <FormInput
                      {...register('industry')}
                      error={!!errors.industry}
                      maxLength={100}
                      placeholder="Automotive interiors"
                    />
                  </FormField>

                  <FormField label="Website" error={errors.website?.message}>
                    <FormInput
                      type="url"
                      {...register('website')}
                      error={!!errors.website}
                      maxLength={500}
                      placeholder="https://customer.com"
                    />
                  </FormField>
                </FormGrid>
              </FormSection>
            )}

            {step === 1 && (
              <>
                <FormSection title="Primary contact" icon={Phone}>
                  <FormGrid cols={2}>
                    <FormField label="Contact person" error={errors.contact_person?.message}>
                      <FormInput
                        {...register('contact_person')}
                        error={!!errors.contact_person}
                        maxLength={150}
                        placeholder="Yamada Taro"
                      />
                    </FormField>
                    <FormField label="Phone" error={errors.phone?.message}>
                      <FormInput
                        {...register('phone')}
                        error={!!errors.phone}
                        maxLength={50}
                        placeholder="+81 3 1234 5678"
                      />
                    </FormField>
                    <FormField label="Primary email" error={errors.email?.message}>
                      <FormInput
                        type="email"
                        {...register('email')}
                        error={!!errors.email}
                        maxLength={255}
                        placeholder="purchasing@customer.com"
                      />
                    </FormField>
                    <FormField label="Secondary email" error={errors.secondary_email?.message}>
                      <FormInput
                        type="email"
                        {...register('secondary_email')}
                        error={!!errors.secondary_email}
                        maxLength={255}
                        placeholder="qa@customer.com"
                      />
                    </FormField>
                  </FormGrid>
                </FormSection>
                <FormSection
                  title="Address"
                  description="Used in reports, invoices and shipping references."
                >
                  <FormGrid cols={2}>
                    <FormField
                      label="Street address"
                      span="full"
                      error={errors.address_line?.message}
                    >
                      <FormInput
                        {...register('address_line')}
                        error={!!errors.address_line}
                        maxLength={255}
                      />
                    </FormField>
                    <FormField label="City" error={errors.city?.message}>
                      <FormInput
                        {...register('city')}
                        error={!!errors.city}
                        maxLength={100}
                      />
                    </FormField>
                    <FormField label="State / region" error={errors.state_region?.message}>
                      <FormInput
                        {...register('state_region')}
                        error={!!errors.state_region}
                        maxLength={100}
                      />
                    </FormField>
                    <FormField label="Postal code" error={errors.postal_code?.message}>
                      <FormInput
                        {...register('postal_code')}
                        error={!!errors.postal_code}
                        maxLength={30}
                      />
                    </FormField>
                    <FormField label="Country" error={errors.country?.message}>
                      <FormInput
                        {...register('country')}
                        error={!!errors.country}
                        maxLength={100}
                        placeholder="Japan"
                      />
                    </FormField>
                  </FormGrid>
                </FormSection>
              </>
            )}

            {step === 2 && (
              <FormSection
                title="Commercial terms"
                icon={CreditCard}
                description="Payment, credit and quality rating."
              >
                <FormGrid cols={2}>
                  <FormField label="Tax / VAT ID" error={errors.tax_id?.message}>
                    <FormInput
                      {...register('tax_id')}
                      error={!!errors.tax_id}
                      maxLength={50}
                      placeholder="JP1234567890"
                    />
                  </FormField>
                  <FormField label="Payment terms" error={errors.payment_terms?.message}>
                    <FormInput
                      {...register('payment_terms')}
                      error={!!errors.payment_terms}
                      maxLength={100}
                      placeholder="Net 60"
                    />
                  </FormField>
                  <FormField label="Currency" error={errors.currency?.message}>
                    <Controller
                      control={control}
                      name="currency"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['USD', 'EUR', 'JPY', 'GBP', 'CNY', 'KRW', 'INR'].map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>
                  <FormField
                    label="Credit limit"
                    error={errors.credit_limit?.message}
                    hint="Approved exposure ceiling"
                  >
                    <FormInput
                      type="number"
                      min={0}
                      step="0.01"
                      {...register('credit_limit')}
                      error={!!errors.credit_limit}
                      placeholder="50000"
                    />
                  </FormField>
                  <FormField
                    label="Quality rating (1–5)"
                    error={errors.rating?.message}
                    hint="Internal customer score"
                  >
                    <FormInput
                      type="number"
                      min={1}
                      max={5}
                      step={1}
                      {...register('rating')}
                      error={!!errors.rating}
                      placeholder="4"
                    />
                  </FormField>
                  <FormField label="Account manager" error={errors.account_manager?.message}>
                    <FormInput
                      {...register('account_manager')}
                      error={!!errors.account_manager}
                      maxLength={150}
                      placeholder="Sales rep name"
                    />
                  </FormField>
                </FormGrid>
              </FormSection>
            )}

            {step === 3 && (
              <FormSection
                title="Notes"
                icon={FileText}
                description="Internal-facing notes and account context."
              >
                <FormGrid cols={1}>
                  <FormField label="Notes" span="full" error={errors.notes?.message}>
                    <FormTextarea
                      {...register('notes')}
                      error={!!errors.notes}
                      rows={6}
                      maxLength={5000}
                      placeholder="Account context, requirements, special instructions…"
                    />
                  </FormField>
                </FormGrid>
              </FormSection>
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
                disabled={pending}
              >
                Cancel
              </Button>
              {step > 0 && (
                <Button type="button" variant="outline" onClick={back} disabled={pending}>
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={next} disabled={pending}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={pending}>
                  <Save className="h-4 w-4" />{' '}
                  {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create customer'}
                </Button>
              )}
            </div>
          </StickyFormFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
