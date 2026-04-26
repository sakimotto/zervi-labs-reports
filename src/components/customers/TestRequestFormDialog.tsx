import { useEffect, useState } from 'react';
import { ClipboardList, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormSection, FormGrid, FormField, FormInput, FormTextarea } from '@/components/form/FormPrimitives';
import {
  type DbTestRequest,
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
  useCreateTestRequest,
  useUpdateTestRequest,
} from '@/hooks/useTestRequests';

type FormState = {
  contact_person: string;
  contact_email: string;
  po_number: string;
  requested_date: string;
  due_date: string;
  priority: string;
  status: string;
  description: string;
  scope: string;
  materials_description: string;
  estimated_cost: string;
  currency: string;
  assigned_to: string;
  notes: string;
};

const blank = (): FormState => ({
  contact_person: '',
  contact_email: '',
  po_number: '',
  requested_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  priority: 'Normal',
  status: 'Requested',
  description: '',
  scope: '',
  materials_description: '',
  estimated_cost: '',
  currency: 'USD',
  assigned_to: '',
  notes: '',
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customerId: string;
  request?: DbTestRequest | null;
}

export function TestRequestFormDialog({ open, onOpenChange, customerId, request }: Props) {
  const [form, setForm] = useState<FormState>(blank());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useCreateTestRequest();
  const update = useUpdateTestRequest();
  const isEdit = !!request;

  useEffect(() => {
    if (!open) return;
    if (request) {
      setForm({
        contact_person: request.contact_person ?? '',
        contact_email: request.contact_email ?? '',
        po_number: request.po_number ?? '',
        requested_date: request.requested_date ?? '',
        due_date: request.due_date ?? '',
        priority: request.priority,
        status: request.status,
        description: request.description ?? '',
        scope: request.scope ?? '',
        materials_description: request.materials_description ?? '',
        estimated_cost: request.estimated_cost?.toString() ?? '',
        currency: request.currency ?? 'USD',
        assigned_to: request.assigned_to ?? '',
        notes: request.notes ?? '',
      });
    } else {
      setForm(blank());
    }
    setErrors({});
  }, [open, request]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.description.trim()) e.description = 'Describe what should be tested';
    if (form.due_date && form.requested_date && form.due_date < form.requested_date) {
      e.due_date = 'Due date must be after requested date';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    const payload: any = {
      customer_id: customerId,
      contact_person: form.contact_person || null,
      contact_email: form.contact_email || null,
      po_number: form.po_number || null,
      requested_date: form.requested_date || null,
      due_date: form.due_date || null,
      priority: form.priority,
      status: form.status,
      description: form.description,
      scope: form.scope || null,
      materials_description: form.materials_description || null,
      estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : null,
      currency: form.currency || 'USD',
      assigned_to: form.assigned_to || null,
      notes: form.notes || null,
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
  };

  const busy = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            {isEdit ? `Edit ${request?.request_number ?? 'request'}` : 'New customer test request'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <FormSection title="Request details" icon={ClipboardList} bare>
            <FormGrid cols={2}>
              <FormField label="Description" required error={errors.description} span="full">
                <FormTextarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="What should be tested and why?"
                  error={!!errors.description}
                />
              </FormField>
              <FormField label="PO number">
                <FormInput value={form.po_number} onChange={(e) => set('po_number', e.target.value)} />
              </FormField>
              <FormField label="Contact person">
                <FormInput value={form.contact_person} onChange={(e) => set('contact_person', e.target.value)} />
              </FormField>
              <FormField label="Contact email">
                <FormInput
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => set('contact_email', e.target.value)}
                />
              </FormField>
              <FormField label="Assigned to (lab)">
                <FormInput value={form.assigned_to} onChange={(e) => set('assigned_to', e.target.value)} />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="Schedule & status" bare>
            <FormGrid cols={4}>
              <FormField label="Requested date">
                <FormInput
                  type="date"
                  value={form.requested_date}
                  onChange={(e) => set('requested_date', e.target.value)}
                />
              </FormField>
              <FormField label="Due date" error={errors.due_date}>
                <FormInput
                  type="date"
                  value={form.due_date}
                  onChange={(e) => set('due_date', e.target.value)}
                  error={!!errors.due_date}
                />
              </FormField>
              <FormField label="Priority">
                <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REQUEST_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Status">
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REQUEST_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="Scope & materials" bare>
            <FormGrid cols={1}>
              <FormField label="Test scope" hint="Which standards / properties / methods are required">
                <FormTextarea
                  rows={2}
                  value={form.scope}
                  onChange={(e) => set('scope', e.target.value)}
                  placeholder="e.g. Tensile (ISO 13934), Abrasion (Martindale 20k cycles), Color fastness"
                />
              </FormField>
              <FormField label="Materials / samples to test">
                <FormTextarea
                  rows={2}
                  value={form.materials_description}
                  onChange={(e) => set('materials_description', e.target.value)}
                  placeholder="Describe the materials being supplied"
                />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="Commercial & notes" bare>
            <FormGrid cols={3}>
              <FormField label="Estimated cost">
                <FormInput
                  type="number"
                  step="0.01"
                  value={form.estimated_cost}
                  onChange={(e) => set('estimated_cost', e.target.value)}
                />
              </FormField>
              <FormField label="Currency">
                <FormInput value={form.currency} onChange={(e) => set('currency', e.target.value)} />
              </FormField>
              <div />
              <FormField label="Internal notes" span="full">
                <FormTextarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              </FormField>
            </FormGrid>
          </FormSection>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={busy}>
              <Save className="h-4 w-4 mr-1" />
              {isEdit ? 'Save changes' : 'Create request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
