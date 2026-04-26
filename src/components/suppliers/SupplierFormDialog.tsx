import { useEffect, useState } from 'react';
import { Building2, Phone, CreditCard, ShieldCheck, ChevronLeft, ChevronRight, Save } from 'lucide-react';
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
  type DbSupplier,
  type DbSupplierInsert,
  SUPPLIER_TYPES,
  SUPPLIER_STATUSES,
  APPROVAL_STATUSES,
  useCreateSupplier,
  useUpdateSupplier,
} from '@/hooks/useSuppliers';

type FormState = {
  name: string;
  supplier_code: string;
  supplier_type: string;
  status: string;
  approval_status: string;
  contact_person: string;
  email: string;
  secondary_email: string;
  phone: string;
  website: string;
  address_line: string;
  city: string;
  state_region: string;
  postal_code: string;
  country: string;
  tax_id: string;
  payment_terms: string;
  currency: string;
  rating: string; // string for input, parsed on submit
  notes: string;
};

const blank: FormState = {
  name: '',
  supplier_code: '',
  supplier_type: 'Manufacturer',
  status: 'Active',
  approval_status: 'Pending',
  contact_person: '',
  email: '',
  secondary_email: '',
  phone: '',
  website: '',
  address_line: '',
  city: '',
  state_region: '',
  postal_code: '',
  country: '',
  tax_id: '',
  payment_terms: '',
  currency: 'USD',
  rating: '',
  notes: '',
};

const STEPS = [
  { label: 'Identity', description: 'Name, code, type', icon: Building2 },
  { label: 'Contact', description: 'People & address', icon: Phone },
  { label: 'Commercial', description: 'Terms & rating', icon: CreditCard },
  { label: 'Compliance', description: 'Approval & notes', icon: ShieldCheck },
];

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: DbSupplier | null;
}

export function SupplierFormDialog({ open, onOpenChange, supplier }: SupplierFormDialogProps) {
  const create = useCreateSupplier();
  const update = useUpdateSupplier();
  const isEdit = !!supplier;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(blank);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (open) {
      setStep(0);
      setErrors({});
      if (supplier) {
        setForm({
          name: supplier.name ?? '',
          supplier_code: supplier.supplier_code ?? '',
          supplier_type: supplier.supplier_type ?? 'Manufacturer',
          status: supplier.status ?? 'Active',
          approval_status: supplier.approval_status ?? 'Pending',
          contact_person: supplier.contact_person ?? '',
          email: supplier.email ?? '',
          secondary_email: supplier.secondary_email ?? '',
          phone: supplier.phone ?? '',
          website: supplier.website ?? '',
          address_line: supplier.address_line ?? '',
          city: supplier.city ?? '',
          state_region: supplier.state_region ?? '',
          postal_code: supplier.postal_code ?? '',
          country: supplier.country ?? '',
          tax_id: supplier.tax_id ?? '',
          payment_terms: supplier.payment_terms ?? '',
          currency: supplier.currency ?? 'USD',
          rating: supplier.rating != null ? String(supplier.rating) : '',
          notes: supplier.notes ?? '',
        });
      } else {
        setForm(blank);
      }
    }
  }, [open, supplier]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const validateStep = (s: number): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (s === 0) {
      if (!form.name.trim()) e.name = 'Required';
      if (!form.supplier_type) e.supplier_type = 'Required';
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
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => validateStep(step) && setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    // Validate all steps before submit
    for (let i = 0; i <= STEPS.length - 1; i++) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }
    const payload: DbSupplierInsert = {
      name: form.name.trim(),
      supplier_code: form.supplier_code.trim() || null,
      supplier_type: form.supplier_type,
      status: form.status,
      approval_status: form.approval_status,
      contact_person: form.contact_person.trim() || null,
      email: form.email.trim() || null,
      secondary_email: form.secondary_email.trim() || null,
      phone: form.phone.trim() || null,
      website: form.website.trim() || null,
      address_line: form.address_line.trim() || null,
      city: form.city.trim() || null,
      state_region: form.state_region.trim() || null,
      postal_code: form.postal_code.trim() || null,
      country: form.country.trim() || null,
      tax_id: form.tax_id.trim() || null,
      payment_terms: form.payment_terms.trim() || null,
      currency: form.currency || 'USD',
      rating: form.rating ? Number(form.rating) : null,
      notes: form.notes.trim() || null,
    };
    try {
      if (isEdit && supplier) {
        await update.mutateAsync({ id: supplier.id, ...payload });
        toast.success('Supplier updated');
      } else {
        await create.mutateAsync(payload);
        toast.success('Supplier created');
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save supplier');
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="text-lg">
            {isEdit ? `Edit Supplier — ${supplier?.name}` : 'New Supplier'}
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
                    placeholder="Acme Textiles Co., Ltd."
                  />
                </FormField>
                <FormField label="Supplier code" hint="Internal short code (auto-generated if empty)">
                  <FormInput
                    value={form.supplier_code}
                    onChange={(e) => set('supplier_code', e.target.value.toUpperCase())}
                    placeholder="ACME-001"
                  />
                </FormField>
                <FormField label="Supplier type" required>
                  <Select value={form.supplier_type} onValueChange={(v) => set('supplier_type', v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUPPLIER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Operating status">
                  <Select value={form.status} onValueChange={(v) => set('status', v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUPPLIER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Website">
                  <FormInput
                    type="url"
                    value={form.website}
                    onChange={(e) => set('website', e.target.value)}
                    placeholder="https://acme.com"
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
                    <FormInput value={form.contact_person} onChange={(e) => set('contact_person', e.target.value)} placeholder="Jane Doe" />
                  </FormField>
                  <FormField label="Phone">
                    <FormInput value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 555 0100" />
                  </FormField>
                  <FormField label="Primary email" error={errors.email}>
                    <FormInput type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={!!errors.email} placeholder="sales@acme.com" />
                  </FormField>
                  <FormField label="Secondary email" error={errors.secondary_email}>
                    <FormInput type="email" value={form.secondary_email} onChange={(e) => set('secondary_email', e.target.value)} error={!!errors.secondary_email} placeholder="qa@acme.com" />
                  </FormField>
                </FormGrid>
              </FormSection>
              <FormSection title="Address" description="Used in reports, shipping references and traceability.">
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
            <FormSection title="Commercial terms" icon={CreditCard} description="Payment, currency and quality rating.">
              <FormGrid cols={2}>
                <FormField label="Tax / VAT ID">
                  <FormInput value={form.tax_id} onChange={(e) => set('tax_id', e.target.value)} placeholder="JP1234567890" />
                </FormField>
                <FormField label="Payment terms">
                  <FormInput value={form.payment_terms} onChange={(e) => set('payment_terms', e.target.value)} placeholder="Net 30" />
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
                <FormField label="Quality rating (1–5)" error={errors.rating} hint="Internal performance score">
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
              </FormGrid>
            </FormSection>
          )}

          {step === 3 && (
            <FormSection title="Approval & notes" icon={ShieldCheck} description="Vendor approval state and any free-form notes.">
              <FormGrid cols={2}>
                <FormField label="Approval status" hint="Approved suppliers can be linked to materials & samples">
                  <Select value={form.approval_status} onValueChange={(v) => set('approval_status', v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {APPROVAL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Notes" span="full">
                  <FormTextarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={4} placeholder="Audit findings, quality observations, special instructions…" />
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
                <Save className="h-4 w-4" /> {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create supplier'}
              </Button>
            )}
          </div>
        </StickyFormFooter>
      </DialogContent>
    </Dialog>
  );
}
