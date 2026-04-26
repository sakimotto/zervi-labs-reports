import { useEffect, useState } from 'react';
import { FileBadge, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormGrid, FormField, FormInput, FormTextarea, FormSection } from '@/components/form/FormPrimitives';
import {
  type DbTestReport,
  REPORT_STATUSES,
  useCreateReport,
  useUpdateReport,
} from '@/hooks/useTestReports';

type FormState = {
  title: string;
  status: string;
  issued_date: string;
  issued_by: string;
  approved_by: string;
  recipient_email: string;
  document_url: string;
  overall_judgment: string;
  summary: string;
  notes: string;
  test_request_id: string;
  sample_id: string;
};

const blank = (): FormState => ({
  title: '',
  status: 'Draft',
  issued_date: '',
  issued_by: '',
  approved_by: '',
  recipient_email: '',
  document_url: '',
  overall_judgment: 'Pending',
  summary: '',
  notes: '',
  test_request_id: '',
  sample_id: '',
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customerId: string;
  defaultRequestId?: string | null;
  defaultRecipient?: string | null;
  report?: DbTestReport | null;
  /** Optional list of requests for this customer to attach to */
  requests?: { id: string; request_number: string }[];
}

export function TestReportFormDialog({
  open,
  onOpenChange,
  customerId,
  defaultRequestId,
  defaultRecipient,
  report,
  requests = [],
}: Props) {
  const [form, setForm] = useState<FormState>(blank());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useCreateReport();
  const update = useUpdateReport();
  const isEdit = !!report;

  useEffect(() => {
    if (!open) return;
    if (report) {
      setForm({
        title: report.title,
        status: report.status,
        issued_date: report.issued_date ?? '',
        issued_by: report.issued_by ?? '',
        approved_by: report.approved_by ?? '',
        recipient_email: report.recipient_email ?? '',
        document_url: report.document_url ?? '',
        overall_judgment: report.overall_judgment ?? 'Pending',
        summary: report.summary ?? '',
        notes: report.notes ?? '',
        test_request_id: report.test_request_id ?? '',
        sample_id: report.sample_id ?? '',
      });
    } else {
      setForm({
        ...blank(),
        test_request_id: defaultRequestId ?? '',
        recipient_email: defaultRecipient ?? '',
      });
    }
    setErrors({});
  }, [open, report, defaultRequestId, defaultRecipient]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    const payload: any = {
      customer_id: customerId,
      title: form.title,
      status: form.status,
      issued_date: form.issued_date || null,
      issued_by: form.issued_by || null,
      approved_by: form.approved_by || null,
      recipient_email: form.recipient_email || null,
      document_url: form.document_url || null,
      overall_judgment: form.overall_judgment || null,
      summary: form.summary || null,
      notes: form.notes || null,
      test_request_id: form.test_request_id || null,
      sample_id: form.sample_id || null,
    };
    try {
      if (isEdit && report) {
        await update.mutateAsync({ id: report.id, ...payload });
        toast.success('Report updated');
      } else {
        await create.mutateAsync(payload);
        toast.success('Report created');
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save report');
    }
  };

  const busy = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileBadge className="h-5 w-5 text-primary" />
            {isEdit ? `Edit ${report?.report_number ?? 'report'}` : 'New test report'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <FormSection title="Report" icon={FileBadge} bare>
            <FormGrid cols={2}>
              <FormField label="Title" required error={errors.title} span="full">
                <FormInput
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="e.g. Tensile & abrasion test report"
                  error={!!errors.title}
                />
              </FormField>
              <FormField label="Linked request">
                <Select
                  value={form.test_request_id || 'none'}
                  onValueChange={(v) => set('test_request_id', v === 'none' ? '' : v)}
                >
                  <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {requests.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.request_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Status">
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REPORT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Overall judgment">
                <Select value={form.overall_judgment} onValueChange={(v) => set('overall_judgment', v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Pending', 'OK', 'NG', 'Conditional'].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Issued date">
                <FormInput type="date" value={form.issued_date} onChange={(e) => set('issued_date', e.target.value)} />
              </FormField>
              <FormField label="Issued by">
                <FormInput value={form.issued_by} onChange={(e) => set('issued_by', e.target.value)} />
              </FormField>
              <FormField label="Approved by">
                <FormInput value={form.approved_by} onChange={(e) => set('approved_by', e.target.value)} />
              </FormField>
              <FormField label="Recipient email" span="full">
                <FormInput
                  type="email"
                  value={form.recipient_email}
                  onChange={(e) => set('recipient_email', e.target.value)}
                  placeholder="customer@example.com"
                />
              </FormField>
              <FormField label="Document URL" hint="Link to PDF or file" span="full">
                <FormInput
                  value={form.document_url}
                  onChange={(e) => set('document_url', e.target.value)}
                  placeholder="https://..."
                />
              </FormField>
              <FormField label="Summary" span="full">
                <FormTextarea rows={2} value={form.summary} onChange={(e) => set('summary', e.target.value)} />
              </FormField>
              <FormField label="Notes" span="full">
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
              {isEdit ? 'Save changes' : 'Create report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
