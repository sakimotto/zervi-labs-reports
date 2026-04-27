import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClipboardList, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField, FormGrid, FormInput, FormTextarea } from '@/components/form/FormPrimitives';
import { useCustomers } from '@/hooks/useCustomers';
import {
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
  useCreateTestRequest,
  type DbTestRequestInsert,
} from '@/hooks/useTestRequests';

const schema = z
  .object({
    customer_id: z.string().uuid('Pick a customer'),
    description: z
      .string()
      .trim()
      .min(1, 'Describe what should be tested')
      .max(2000, 'Must be 2000 characters or less'),
    po_number: z.string().trim().max(100, 'Must be 100 characters or less').optional(),
    requested_date: z.string().optional(),
    due_date: z.string().optional(),
    priority: z
      .string()
      .refine((v) => (REQUEST_PRIORITIES as readonly string[]).includes(v), 'Invalid priority'),
    status: z
      .string()
      .refine((v) => (REQUEST_STATUSES as readonly string[]).includes(v), 'Invalid status'),
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

type Values = z.infer<typeof schema>;

const defaults = (): Values => ({
  customer_id: '',
  description: '',
  po_number: '',
  requested_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  priority: 'Normal',
  status: 'Requested',
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultCustomerId?: string;
}

export function QuickTestRequestDialog({ open, onOpenChange, defaultCustomerId }: Props) {
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers();
  const create = useCreateTestRequest();
  const [customerSearch, setCustomerSearch] = useState('');

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults(),
    mode: 'onBlur',
  });
  const { register, control, handleSubmit, reset, formState } = form;
  const { errors } = formState;

  useEffect(() => {
    if (!open) return;
    reset({ ...defaults(), customer_id: defaultCustomerId ?? '' });
    setCustomerSearch('');
  }, [open, defaultCustomerId, reset]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    const active = customers.filter((c) => c.status !== 'Inactive');
    if (!q) return active.slice(0, 100);
    return active
      .filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.customer_code?.toLowerCase().includes(q),
      )
      .slice(0, 100);
  }, [customers, customerSearch]);

  const onSubmit = handleSubmit(async (data) => {
    const payload: Omit<DbTestRequestInsert, 'request_number'> = {
      customer_id: data.customer_id,
      description: data.description.trim(),
      po_number: data.po_number?.trim() || null,
      requested_date: data.requested_date || null,
      due_date: data.due_date || null,
      priority: data.priority,
      status: data.status,
      currency: 'USD',
    };
    try {
      const created = await create.mutateAsync(payload);
      toast.success(`Created ${created?.request_number ?? 'test request'}`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to create request');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            New customer test request
          </DialogTitle>
          <DialogDescription>
            Pick a customer and set defaults. You can edit full scope from the customer page later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormGrid cols={2}>
            <FormField label="Customer" required error={errors.customer_id?.message} span="full">
              <Controller
                control={control}
                name="customer_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue
                        placeholder={loadingCustomers ? 'Loading…' : 'Select a customer'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2 sticky top-0 bg-popover border-b border-border">
                        <input
                          autoFocus
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          placeholder="Search by name or code…"
                          className="w-full h-8 px-2 rounded-sm border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          // Prevent Radix Select from stealing typing focus
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filteredCustomers.length === 0 ? (
                        <div className="px-3 py-3 text-xs text-muted-foreground">
                          No customers match.
                        </div>
                      ) : (
                        filteredCustomers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{c.name}</span>
                              {c.customer_code && (
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {c.customer_code}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Description" required error={errors.description?.message} span="full">
              <FormTextarea
                rows={2}
                maxLength={2000}
                {...register('description')}
                error={!!errors.description}
                placeholder="What should be tested and why?"
              />
            </FormField>

            <FormField label="PO number" error={errors.po_number?.message}>
              <FormInput {...register('po_number')} error={!!errors.po_number} maxLength={100} />
            </FormField>

            <FormField label="Requested date" error={errors.requested_date?.message}>
              <FormInput
                type="date"
                {...register('requested_date')}
                error={!!errors.requested_date}
              />
            </FormField>

            <FormField label="Due date" error={errors.due_date?.message}>
              <FormInput type="date" {...register('due_date')} error={!!errors.due_date} />
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

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              <Save className="h-4 w-4 mr-1" />
              {create.isPending ? 'Saving…' : 'Create request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
