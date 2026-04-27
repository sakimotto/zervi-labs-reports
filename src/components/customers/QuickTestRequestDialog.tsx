import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClipboardList, Save, Building2, Truck, PackageCheck, ShieldCheck, AlertTriangle, FlaskConical } from 'lucide-react';
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
import { FormField, FormGrid, FormInput, FormTextarea, FormSection } from '@/components/form/FormPrimitives';
import { cn } from '@/lib/utils';
import { useCustomers } from '@/hooks/useCustomers';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useTestPrograms } from '@/hooks/useTestPrograms';
import {
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
  REQUEST_TYPES,
  type RequestType,
  useCreateTestRequest,
  type DbTestRequestInsert,
} from '@/hooks/useTestRequests';

const ORIGIN_ICON: Record<RequestType, typeof Building2> = {
  customer: Building2,
  supplier: Truck,
  incoming_goods: PackageCheck,
  internal_qa: ShieldCheck,
  production_issue: AlertTriangle,
  rd_trial: FlaskConical,
};

const schema = z
  .object({
    request_type: z.enum(['customer', 'supplier', 'incoming_goods', 'internal_qa', 'production_issue', 'rd_trial']),
    customer_id: z.string().optional(),
    supplier_id: z.string().optional(),
    internal_department: z.string().optional(),
    test_program_id: z.string().optional(),
    description: z
      .string()
      .trim()
      .min(1, 'Describe what should be tested')
      .max(2000, 'Must be 2000 characters or less'),
    po_number: z.string().trim().max(100).optional(),
    sku: z.string().trim().max(100).optional(),
    batch_number: z.string().trim().max(100).optional(),
    sales_order_number: z.string().trim().max(100).optional(),
    delivery_note_number: z.string().trim().max(100).optional(),
    customer_reference: z.string().trim().max(100).optional(),
    requested_date: z.string().optional(),
    due_date: z.string().optional(),
    priority: z.string().refine((v) => (REQUEST_PRIORITIES as readonly string[]).includes(v)),
    status: z.string().refine((v) => (REQUEST_STATUSES as readonly string[]).includes(v)),
  })
  .superRefine((data, ctx) => {
    if (data.due_date && data.requested_date && data.due_date < data.requested_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['due_date'],
        message: 'Due date must be on or after requested date',
      });
    }
    if (data.request_type === 'customer' && !data.customer_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customer_id'], message: 'Pick a customer' });
    }
    if (data.request_type === 'supplier' && !data.supplier_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['supplier_id'], message: 'Pick a supplier' });
    }
    if (
      ['incoming_goods', 'internal_qa', 'production_issue', 'rd_trial'].includes(data.request_type) &&
      !data.internal_department?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['internal_department'],
        message: 'Department is required for internal requests',
      });
    }
    // Smart conditional: incoming goods needs PO or delivery note for traceability
    if (
      data.request_type === 'incoming_goods' &&
      !data.po_number?.trim() &&
      !data.delivery_note_number?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['delivery_note_number'],
        message: 'Incoming goods need a PO or delivery note number',
      });
    }
  });

type Values = z.infer<typeof schema>;

const defaults = (): Values => ({
  request_type: 'customer',
  customer_id: '',
  supplier_id: '',
  internal_department: '',
  test_program_id: '',
  description: '',
  po_number: '',
  sku: '',
  batch_number: '',
  sales_order_number: '',
  delivery_note_number: '',
  customer_reference: '',
  requested_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  priority: 'Normal',
  status: 'Requested',
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultCustomerId?: string;
  defaultSupplierId?: string;
  defaultRequestType?: RequestType;
}

export function QuickTestRequestDialog({
  open,
  onOpenChange,
  defaultCustomerId,
  defaultSupplierId,
  defaultRequestType,
}: Props) {
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers();
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers();
  const { data: programs = [] } = useTestPrograms();
  const create = useCreateTestRequest();
  const [customerSearch, setCustomerSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults(),
    mode: 'onBlur',
  });
  const { register, control, handleSubmit, reset, watch, setValue, formState } = form;
  const { errors } = formState;
  const requestType = watch('request_type');

  useEffect(() => {
    if (!open) return;
    const initial = defaults();
    if (defaultRequestType) initial.request_type = defaultRequestType;
    if (defaultCustomerId) {
      initial.request_type = 'customer';
      initial.customer_id = defaultCustomerId;
    }
    if (defaultSupplierId) {
      initial.request_type = 'supplier';
      initial.supplier_id = defaultSupplierId;
    }
    reset(initial);
    setCustomerSearch('');
    setSupplierSearch('');
  }, [open, defaultCustomerId, defaultSupplierId, defaultRequestType, reset]);

  // Clear origin fields when type changes so we never violate the trigger
  useEffect(() => {
    if (requestType !== 'customer') setValue('customer_id', '');
    if (requestType !== 'supplier') setValue('supplier_id', '');
    if (requestType === 'customer' || requestType === 'supplier') setValue('internal_department', '');
  }, [requestType, setValue]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    const active = customers.filter((c) => c.status !== 'Inactive');
    if (!q) return active.slice(0, 100);
    return active
      .filter((c) => c.name?.toLowerCase().includes(q) || c.customer_code?.toLowerCase().includes(q))
      .slice(0, 100);
  }, [customers, customerSearch]);

  const filteredSuppliers = useMemo(() => {
    const q = supplierSearch.trim().toLowerCase();
    const active = (suppliers as any[]).filter((s) => s.status !== 'Inactive');
    if (!q) return active.slice(0, 100);
    return active
      .filter((s) => s.name?.toLowerCase().includes(q) || s.supplier_code?.toLowerCase().includes(q))
      .slice(0, 100);
  }, [suppliers, supplierSearch]);

  const onSubmit = handleSubmit(async (data) => {
    const payload: Omit<DbTestRequestInsert, 'request_number'> = {
      request_type: data.request_type,
      customer_id: data.request_type === 'customer' ? (data.customer_id || null) : null,
      supplier_id: data.request_type === 'supplier' ? (data.supplier_id || null) : null,
      internal_department:
        ['incoming_goods', 'internal_qa', 'production_issue', 'rd_trial'].includes(data.request_type)
          ? (data.internal_department?.trim() || null)
          : null,
      test_program_id: data.test_program_id || null,
      description: data.description.trim(),
      po_number: data.po_number?.trim() || null,
      requested_date: data.requested_date || null,
      due_date: data.due_date || null,
      priority: data.priority,
      status: data.status,
      currency: 'USD',
    } as DbTestRequestInsert;
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            New test request
          </DialogTitle>
          <DialogDescription>
            Pick the origin, then set scope and logistics. You can refine methods and materials on the request page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {/* Step 1 — Origin */}
          <FormSection title="1. Origin" description="Who is this request for?" bare>
            <Controller
              control={control}
              name="request_type"
              render={({ field }) => (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {REQUEST_TYPES.map((opt) => {
                    const Icon = ORIGIN_ICON[opt.value];
                    const active = field.value === opt.value;
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => field.onChange(opt.value)}
                        className={cn(
                          'text-left rounded-lg border px-3 py-2.5 transition-colors',
                          active
                            ? 'border-primary bg-primary-soft/60 ring-1 ring-primary/40'
                            : 'border-border hover:bg-muted/40',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')} />
                          <span className="text-sm font-semibold">{opt.label}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {opt.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            />

            {/* Origin-specific picker */}
            <div className="mt-3">
              {requestType === 'customer' && (
                <FormField label="Customer" required error={errors.customer_id?.message} span="full">
                  <Controller
                    control={control}
                    name="customer_id"
                    render={({ field }) => (
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={loadingCustomers ? 'Loading…' : 'Select a customer'} />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2 sticky top-0 bg-popover border-b border-border">
                            <input
                              autoFocus
                              value={customerSearch}
                              onChange={(e) => setCustomerSearch(e.target.value)}
                              placeholder="Search by name or code…"
                              className="w-full h-8 px-2 rounded-sm border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                          {filteredCustomers.length === 0 ? (
                            <div className="px-3 py-3 text-xs text-muted-foreground">No customers match.</div>
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
              )}

              {requestType === 'supplier' && (
                <FormField label="Supplier" required error={errors.supplier_id?.message} span="full">
                  <Controller
                    control={control}
                    name="supplier_id"
                    render={({ field }) => (
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={loadingSuppliers ? 'Loading…' : 'Select a supplier'} />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2 sticky top-0 bg-popover border-b border-border">
                            <input
                              autoFocus
                              value={supplierSearch}
                              onChange={(e) => setSupplierSearch(e.target.value)}
                              placeholder="Search by name or code…"
                              className="w-full h-8 px-2 rounded-sm border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                          {filteredSuppliers.length === 0 ? (
                            <div className="px-3 py-3 text-xs text-muted-foreground">No suppliers match.</div>
                          ) : (
                            filteredSuppliers.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{s.name}</span>
                                  {s.supplier_code && (
                                    <span className="text-[10px] font-mono text-muted-foreground">
                                      {s.supplier_code}
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
              )}

              {['incoming_goods', 'internal_qa', 'production_issue', 'rd_trial'].includes(requestType) && (
                <FormField
                  label="Department / Owner"
                  required
                  error={errors.internal_department?.message}
                  span="full"
                  hint="e.g. Production, QA, R&D, Warehouse"
                >
                  <FormInput
                    {...register('internal_department')}
                    error={!!errors.internal_department}
                    placeholder="Production line A"
                    maxLength={200}
                  />
                </FormField>
              )}
            </div>
          </FormSection>

          {/* Step 2 — Scope */}
          <FormSection title="2. Scope" description="What needs to be tested?" bare>
            <FormGrid cols={2}>
              <FormField label="Description" required error={errors.description?.message} span="full">
                <FormTextarea
                  rows={3}
                  maxLength={2000}
                  {...register('description')}
                  error={!!errors.description}
                  placeholder="What should be tested and why?"
                />
              </FormField>
              <FormField
                label="Default test program"
                hint="Methods auto-pulled from the program. You can add ad-hoc methods later."
                span="full"
              >
                <Controller
                  control={control}
                  name="test_program_id"
                  render={({ field }) => (
                    <Select
                      value={field.value || 'none'}
                      onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="No program — pick methods manually" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None (pick methods manually)</SelectItem>
                        {(programs as any[]).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </FormGrid>
          </FormSection>

          {/* Step 3 — Logistics */}
          <FormSection title="3. Logistics" description="Tracking, dates, priority" bare>
            <FormGrid cols={2}>
              <FormField label="PO number" error={errors.po_number?.message}>
                <FormInput {...register('po_number')} error={!!errors.po_number} maxLength={100} />
              </FormField>
              <FormField label="Requested date" error={errors.requested_date?.message}>
                <FormInput type="date" {...register('requested_date')} error={!!errors.requested_date} />
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
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {REQUEST_PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
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
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {REQUEST_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </FormGrid>
          </FormSection>

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
