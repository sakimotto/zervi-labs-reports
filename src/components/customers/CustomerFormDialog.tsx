import { useEffect, useState } from 'react';
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

type FormState = {
  name: string;
  customer_code: string;
  customer_type: string;
  status: string;
  industry: string;
  website: string;
  contact_person: string;
  email: string;
  secondary_email: string;
  phone: string;
  address_line: string;
  city: string;
  state_region: string;
  postal_code: string;
  country: string;
  tax_id: string;
  payment_terms: string;
  currency: string;
  credit_limit: string;
  rating: string;
  account_manager: string;
  notes: string;
};

const blank: FormState = {
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
  { label: 'Identity', description: 'Name, code, type', icon: Building2 },
  { label: 'Contact', description: 'People & address', icon: Phone },
  { label: 'Commercial', description: 'Terms & rating', icon: CreditCard },
  { label: 'Notes', description: 'Account & notes', icon: FileText },
];

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: DbCustomer | null;
}

export function CustomerFormDialog({ open, onOpenChange, customer }: CustomerFormDialogProps) {
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const isEdit = !!customer;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(blank);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (open) {
      setStep(0);
      setErrors({});
      if (customer) {
        setForm({
          name: customer.name ?? '',
          customer_code: customer.customer_code ?? '',
          customer_type: customer.customer_type ?? 'OEM',
          status: customer.status ?? 'Active',
          industry: customer.industry ?? '',
          website: customer.website ?? '',
          contact_person: customer.contact_person ?? '',
          email: customer.email ?? '',
          secondary_email: customer.secondary_email ?? '',
          phone: customer.phone ?? '',
          address_line: customer.address_line ?? '',
          city: customer.city ?? '',
          state_region: customer.state_region ?? '',
          postal_code: customer.postal_code ?? '',
          country: customer.country ?? '',
          tax_id: customer.tax_id ?? '',
          payment_terms: customer.payment_terms ?? '',
          currency: customer.currency ?? 'USD',
          credit_limit: customer.credit_limit != null ? String(customer.credit_limit) : '',
          rating: customer.rating != null ? String(customer.rating) : '',
          account_manager: customer.account_manager ?? '',
          notes: customer.notes ?? '',
        });
      } else {
        setForm(blank);
      }
    }
  }, [open, customer]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const validateStep = (s: number): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (s === 0) {
      if (!form.name.trim()) e.name = 'Required';
      if (!form.customer_type) e.customer_type = 'Required';
    }
    if (s === 1) {
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
      if (form.secondary_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.secondary_email))
        e.secondary_email = 'Invalid email';
    }
    if (s === 2) {
      if (form.rating) {
        const n = Number(form.rating);
        if (!Number.isFinite(n) || n < 1 || n > 5) e.rating = 'Must be between 1 and 5';
      }
      if (form.credit_limit) {
        const n = Number(form.credit_limit);
        if (!Number.isFinite(n) || n < 0) e.credit_limit = 'Must be a non-negative number';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => validateStep(step) && setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    for (let i = 0; i <= STEPS.length - 1; i++) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }
    const payload: DbCustomerInsert = {
      name: form.name.trim(),
      customer_code: form.customer_code.trim() || null,
      customer_type: form.customer_type,
      status: form.status,
      industry: form.industry.trim() || null,
      website: form.website.trim() || null,
      contact_person: form.contact_person.trim() || null,
      email: form.email.trim() || null,
      secondary_email: form.secondary_email.trim() || null,
      phone: form.phone.trim() || null,
      address: null, // legacy column kept null; structured fields used instead
      address_line: form.address_line.trim() || null,
      city: form.city.trim() || null,
      state_region: form.state_region.trim() || null,
      postal_code: form.postal_code.trim() || null,
      country: form.country.trim() || null,
      tax_id: form.tax_id.trim() || null,
      payment_terms: form.payment_terms.trim() || null,
      currency: form.currency || 'USD',
      credit_limit: form.credit_limit ? Number(form.credit_limit) : null,
      rating: form.rating ? Number(form.rating) : null,
      account_manager: form.account_manager.trim() || null,
      notes: form.notes.trim() || null,
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
  };

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

        <div className="px-6 py-5 space-y-4">
          {step === 0 && (
            <FormSection title="Company identity" icon={Building2} description="Who they are and how they appear in records.">
              <FormGrid cols={2}>
                <FormField label="Company name" required error={errors.name} span="full">
                  <FormInput
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    error={!!errors.name}
                    autoFocus
                    placeholder="Toyota Boshoku Corporation"
                  />
                </FormField>
                <FormField label="Customer code" hint="Internal short code">
                  <FormInput
                    value={form.customer_code}
                    onChange={(e) => set('customer_code', e.target.value.toUpperCase())}
                    placeholder="TBC-001"
                  />
                </FormField>
                <FormField label="Customer type" required>
                  <Select value={form.customer_type} onValueChange={(v) => set('customer_type', v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Status">
                  <Select value={form.status} onValueChange={(v) => set('status', v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Industry" hint="Automotive, Apparel, Furniture…">
                  <FormInput value={form.industry} onChange={(e) => set('industry', e.target.value)} placeholder="Automotive interiors" />
                </FormField>
                <FormField label="Website">
                  <FormInput
                    type="url"
                    value={form.website}
                    onChange={(e) => set('website', e.target.value)}
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
                  <FormField label="Contact person">
                    <FormInput value={form.contact_person} onChange={(e) => set('contact_person', e.target.value)} placeholder="Yamada Taro" />
                  </FormField>
                  <FormField label="Phone">
                    <FormInput value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+81 3 1234 5678" />
                  </FormField>
                  <FormField label="Primary email" error={errors.email}>
                    <FormInput type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={!!errors.email} placeholder="purchasing@customer.com" />
                  </FormField>
                  <FormField label="Secondary email" error={errors.secondary_email}>
                    <FormInput type="email" value={form.secondary_email} onChange={(e) => set('secondary_email', e.target.value)} error={!!errors.secondary_email} placeholder="qa@customer.com" />
                  </FormField>
                </FormGrid>
              </FormSection>
              <FormSection title="Address" description="Used in reports, invoices and shipping references.">
                <FormGrid cols={2}>
                  <FormField label="Street address" span="full">
                    <FormInput value={form.address_line} onChange={(e) => set('address_line', e.target.value)} />
                  </FormField>
                  <FormField label="City">
                    <FormInput value={form.city} onChange={(e) => set('city', e.target.value)} />
                  </FormField>
                  <FormField label="State / region">
                    <FormInput value={form.state_region} onChange={(e) => set('state_region', e.target.value)} />
                  </FormField>
                  <FormField label="Postal code">
                    <FormInput value={form.postal_code} onChange={(e) => set('postal_code', e.target.value)} />
                  </FormField>
                  <FormField label="Country">
                    <FormInput value={form.country} onChange={(e) => set('country', e.target.value)} placeholder="Japan" />
                  </FormField>
                </FormGrid>
              </FormSection>
            </>
          )}

          {step === 2 && (
            <FormSection title="Commercial terms" icon={CreditCard} description="Payment, credit and quality rating.">
              <FormGrid cols={2}>
                <FormField label="Tax / VAT ID">
                  <FormInput value={form.tax_id} onChange={(e) => set('tax_id', e.target.value)} placeholder="JP1234567890" />
                </FormField>
                <FormField label="Payment terms">
                  <FormInput value={form.payment_terms} onChange={(e) => set('payment_terms', e.target.value)} placeholder="Net 60" />
                </FormField>
                <FormField label="Currency">
                  <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['USD', 'EUR', 'JPY', 'GBP', 'CNY', 'KRW', 'INR'].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Credit limit" error={errors.credit_limit} hint="Approved exposure ceiling">
                  <FormInput
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.credit_limit}
                    onChange={(e) => set('credit_limit', e.target.value)}
                    error={!!errors.credit_limit}
                    placeholder="50000"
                  />
                </FormField>
                <FormField label="Quality rating (1–5)" error={errors.rating} hint="Internal customer score">
                  <FormInput
                    type="number"
                    min={1}
                    max={5}
                    step={1}
                    value={form.rating}
                    onChange={(e) => set('rating', e.target.value)}
                    error={!!errors.rating}
                    placeholder="4"
                  />
                </FormField>
                <FormField label="Account manager">
                  <FormInput value={form.account_manager} onChange={(e) => set('account_manager', e.target.value)} placeholder="Sales rep name" />
                </FormField>
              </FormGrid>
            </FormSection>
          )}

          {step === 3 && (
            <FormSection title="Notes" icon={FileText} description="Internal-facing notes and account context.">
              <FormGrid cols={1}>
                <FormField label="Notes" span="full">
                  <FormTextarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={6} placeholder="Account context, requirements, special instructions…" />
                </FormField>
              </FormGrid>
            </FormSection>
          )}
        </div>

        <StickyFormFooter align="between">
          <div className="text-xs text-muted-foreground">
            Step {step + 1} of {STEPS.length} · <span className="font-medium text-foreground">{STEPS[step].label}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            {step > 0 && (
              <Button variant="outline" onClick={back} disabled={pending}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={next} disabled={pending}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={pending}>
                <Save className="h-4 w-4" /> {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create customer'}
              </Button>
            )}
          </div>
        </StickyFormFooter>
      </DialogContent>
    </Dialog>
  );
}
