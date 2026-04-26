import { useState, useMemo } from 'react';
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '@/hooks/useSuppliers';
import { Plus, Pencil, Trash2, X, Check, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, PageBody } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DataTable, RowActions, type Column } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { EmptyState, TableSkeleton } from '@/components/data/EmptyState';

type Supplier = {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
};

export default function SuppliersPage() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '' });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.contact_person || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q),
    );
  }, [suppliers, search]);

  const startEdit = (s: Supplier) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      contact_person: s.contact_person || '',
      email: s.email || '',
      phone: s.phone || '',
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateSupplier.mutateAsync({ id: editingId, ...form });
      setEditingId(null);
      toast.success('Supplier updated');
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
      await createSupplier.mutateAsync(form);
      setShowNew(false);
      setForm({ name: '', contact_person: '', email: '', phone: '' });
      toast.success('Supplier created');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this supplier?')) return;
    try {
      await deleteSupplier.mutateAsync(id);
      toast.success('Supplier deleted');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const columns: Column<Supplier>[] = [
    {
      key: 'name',
      header: 'Name',
      sortValue: (r) => r.name,
      cell: (s) =>
        editingId === s.id ? (
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="h-7"
          />
        ) : (
          <span className="font-medium">{s.name}</span>
        ),
    },
    {
      key: 'contact_person',
      header: 'Contact',
      sortValue: (r) => r.contact_person ?? '',
      cell: (s) =>
        editingId === s.id ? (
          <Input
            value={form.contact_person}
            onChange={(e) => setForm((p) => ({ ...p, contact_person: e.target.value }))}
            className="h-7"
          />
        ) : (
          <span className="text-muted-foreground">{s.contact_person || '—'}</span>
        ),
    },
    {
      key: 'email',
      header: 'Email',
      hideBelow: 'md',
      cell: (s) =>
        editingId === s.id ? (
          <Input
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="h-7"
          />
        ) : (
          <span className="text-muted-foreground text-xs">{s.email || '—'}</span>
        ),
    },
    {
      key: 'phone',
      header: 'Phone',
      hideBelow: 'lg',
      cell: (s) =>
        editingId === s.id ? (
          <Input
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="h-7"
          />
        ) : (
          <span className="text-muted-foreground text-xs font-mono">{s.phone || '—'}</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '120px',
      cell: (s) => (
        <RowActions>
          {editingId === s.id ? (
            <>
              <Button size="icon" variant="ghost" onClick={saveEdit} className="h-7 w-7 text-success">
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setEditingId(null)}
                className="h-7 w-7"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button size="icon" variant="ghost" onClick={() => startEdit(s)} className="h-7 w-7">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(s.id)}
                className="h-7 w-7 text-destructive hover:text-destructive"
              >
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
        title="Suppliers"
        description="Manage material suppliers and primary contacts."
        actions={
          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8">
                <Plus className="h-4 w-4 mr-1" /> Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Supplier</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreate();
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Name *" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} autoFocus />
                  <FormField
                    label="Contact Person"
                    value={form.contact_person}
                    onChange={(v) => setForm((p) => ({ ...p, contact_person: v }))}
                  />
                  <FormField label="Email" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} type="email" />
                  <FormField label="Phone" value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setShowNew(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createSupplier.isPending}>
                    {createSupplier.isPending ? 'Creating…' : 'Create Supplier'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <PageBody className="space-y-4">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search suppliers by name, contact, or email…"
          summary={`${filtered.length} of ${suppliers.length} suppliers`}
        />

        {isLoading ? (
          <TableSkeleton columns={5} rows={6} />
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            rowKey={(r) => r.id}
            defaultSort={{ key: 'name', direction: 'asc' }}
            emptyState={
              <EmptyState
                icon={Truck}
                title={suppliers.length === 0 ? 'No suppliers yet' : 'No matches'}
                description={
                  suppliers.length === 0
                    ? 'Add your first supplier to start tracking materials.'
                    : 'Try a different search.'
                }
                action={
                  suppliers.length === 0 && (
                    <Button size="sm" onClick={() => setShowNew(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Add Supplier
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
  type = 'text',
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} autoFocus={autoFocus} />
    </div>
  );
}
