import { useState, useMemo } from 'react';
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '@/hooks/useCustomers';
import { Plus, Pencil, Trash2, X, Check, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, PageBody } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DataTable, RowActions, type Column } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { EmptyState, TableSkeleton } from '@/components/data/EmptyState';

const TYPES = ['OEM', 'Client'] as const;

type Customer = {
  id: string;
  name: string;
  customer_type: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

export default function CustomersPage() {
  const { data: customers = [], isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    customer_type: 'OEM',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return customers.filter((c) => {
      if (typeFilter !== 'all' && c.customer_type !== typeFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.contact_person || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      );
    });
  }, [customers, search, typeFilter]);

  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    customers.forEach((c) => (map[c.customer_type] = (map[c.customer_type] || 0) + 1));
    return map;
  }, [customers]);

  const startEdit = (c: Customer) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      customer_type: c.customer_type,
      contact_person: c.contact_person || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateCustomer.mutateAsync({ id: editingId, ...form });
      setEditingId(null);
      toast.success('Customer updated');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      await createCustomer.mutateAsync(form);
      setShowNew(false);
      setForm({ name: '', customer_type: 'OEM', contact_person: '', email: '', phone: '', address: '' });
      toast.success('Customer created');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await deleteCustomer.mutateAsync(id);
      toast.success('Customer deleted');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Name',
      sortValue: (r) => r.name,
      cell: (c) =>
        editingId === c.id ? (
          <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="h-7" />
        ) : (
          <span className="font-medium">{c.name}</span>
        ),
    },
    {
      key: 'type',
      header: 'Type',
      sortValue: (r) => r.customer_type,
      cell: (c) =>
        editingId === c.id ? (
          <Select value={form.customer_type} onValueChange={(v) => setForm((p) => ({ ...p, customer_type: v }))}>
            <SelectTrigger className="h-7"><SelectValue /></SelectTrigger>
            <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        ) : (
          <Badge
            variant="outline"
            className={
              c.customer_type === 'OEM'
                ? 'bg-primary-soft text-primary border-primary/20 text-[10px]'
                : 'bg-muted text-muted-foreground border-border text-[10px]'
            }
          >
            {c.customer_type}
          </Badge>
        ),
    },
    {
      key: 'contact',
      header: 'Contact',
      sortValue: (r) => r.contact_person ?? '',
      cell: (c) =>
        editingId === c.id ? (
          <Input value={form.contact_person} onChange={(e) => setForm((p) => ({ ...p, contact_person: e.target.value }))} className="h-7" />
        ) : (
          <span className="text-muted-foreground">{c.contact_person || '—'}</span>
        ),
    },
    {
      key: 'email',
      header: 'Email',
      hideBelow: 'md',
      cell: (c) =>
        editingId === c.id ? (
          <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="h-7" />
        ) : (
          <span className="text-muted-foreground text-xs">{c.email || '—'}</span>
        ),
    },
    {
      key: 'phone',
      header: 'Phone',
      hideBelow: 'lg',
      cell: (c) =>
        editingId === c.id ? (
          <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="h-7" />
        ) : (
          <span className="text-muted-foreground text-xs font-mono">{c.phone || '—'}</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '120px',
      cell: (c) => (
        <RowActions>
          {editingId === c.id ? (
            <>
              <Button size="icon" variant="ghost" onClick={saveEdit} className="h-7 w-7 text-success">
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="h-7 w-7">
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button size="icon" variant="ghost" onClick={() => startEdit(c)} className="h-7 w-7">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)} className="h-7 w-7 text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </RowActions>
      ),
    },
  ];

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Directory"
        title="Customers"
        description="OEM brands and direct clients with contact information."
        actions={
          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8">
                <Plus className="h-4 w-4 mr-1" /> Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Customer</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Name *" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
                <div className="space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select value={form.customer_type} onValueChange={(v) => setForm((p) => ({ ...p, customer_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <FormField label="Contact Person" value={form.contact_person} onChange={(v) => setForm((p) => ({ ...p, contact_person: v }))} />
                <FormField label="Email" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} />
                <FormField label="Phone" value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} />
                <FormField label="Address" value={form.address} onChange={(v) => setForm((p) => ({ ...p, address: v }))} />
              </div>
              <Button onClick={handleCreate} disabled={createCustomer.isPending} className="w-full mt-2">
                {createCustomer.isPending ? 'Creating…' : 'Create Customer'}
              </Button>
            </DialogContent>
          </Dialog>
        }
      />

      <PageBody className="space-y-4">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search customers…"
          summary={`${filtered.length} of ${customers.length} customers`}
          filters={[
            {
              key: 'type',
              label: 'Type',
              value: typeFilter,
              onChange: setTypeFilter,
              options: [
                { value: 'all', label: 'All types' },
                ...TYPES.map((t) => ({ value: t, label: t, count: typeCounts[t] || 0 })),
              ],
            },
          ]}
        />

        {isLoading ? (
          <TableSkeleton columns={6} rows={6} />
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            rowKey={(r) => r.id}
            defaultSort={{ key: 'name', direction: 'asc' }}
            emptyState={
              <EmptyState
                icon={Users}
                title={customers.length === 0 ? 'No customers yet' : 'No matches'}
                description={
                  customers.length === 0
                    ? 'Add your first OEM or client to start linking samples.'
                    : 'Try a different search or clear your filters.'
                }
                action={
                  customers.length === 0 && (
                    <Button size="sm" onClick={() => setShowNew(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Add Customer
                    </Button>
                  )
                }
              />
            }
          />
        )}
      </PageBody>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
