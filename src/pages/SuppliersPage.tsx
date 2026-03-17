import { useState } from 'react';
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '@/hooks/useSuppliers';
import { Search, Plus, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SuppliersPage() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '' });

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact_person || '').toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (s: typeof suppliers[0]) => {
    setEditingId(s.id);
    setForm({ name: s.name, contact_person: s.contact_person || '', email: s.email || '', phone: s.phone || '' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateSupplier.mutateAsync({ id: editingId, ...form });
      setEditingId(null);
      toast.success('Supplier updated');
    } catch (e: any) { toast.error(e.message); }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    try {
      await createSupplier.mutateAsync(form);
      setShowNew(false);
      setForm({ name: '', contact_person: '', email: '', phone: '' });
      toast.success('Supplier created');
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this supplier?')) return;
    try {
      await deleteSupplier.mutateAsync(id);
      toast.success('Supplier deleted');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground">{suppliers.length} suppliers</p>
        </div>
        <button onClick={() => { setShowNew(true); setForm({ name: '', contact_person: '', email: '', phone: '' }); }}
          className="h-9 px-3 flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" /> Add Supplier
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input type="text" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full h-9 pl-8 pr-3 text-sm bg-card border rounded-md shadow-card focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {showNew && (
        <div className="bg-card rounded-lg shadow-card p-4 border-2 border-primary/20">
          <div className="text-sm font-semibold mb-3">New Supplier</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name *" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} />
            <Field label="Contact Person" value={form.contact_person} onChange={v => setForm(p => ({ ...p, contact_person: v }))} />
            <Field label="Email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
            <Field label="Phone" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleCreate} disabled={createSupplier.isPending} className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
              {createSupplier.isPending ? 'Creating...' : 'Create'}
            </button>
            <button onClick={() => setShowNew(false)} className="h-8 px-3 text-xs font-medium text-muted-foreground hover:bg-muted rounded-md">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg shadow-card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</th>
                <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors h-10">
                  {editingId === s.id ? (
                    <>
                      <td className="px-3 py-1"><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full h-7 px-2 text-sm bg-background border rounded-sm" /></td>
                      <td className="px-3 py-1"><input value={form.contact_person} onChange={e => setForm(p => ({ ...p, contact_person: e.target.value }))} className="w-full h-7 px-2 text-sm bg-background border rounded-sm" /></td>
                      <td className="px-3 py-1"><input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full h-7 px-2 text-sm bg-background border rounded-sm" /></td>
                      <td className="px-3 py-1"><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full h-7 px-2 text-sm bg-background border rounded-sm" /></td>
                      <td className="px-3 py-1 text-right">
                        <button onClick={saveEdit} className="p-1 text-success hover:bg-success/10 rounded"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:bg-muted rounded ml-1"><X className="h-3.5 w-3.5" /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-1 font-medium">{s.name}</td>
                      <td className="px-3 py-1 text-muted-foreground">{s.contact_person || '—'}</td>
                      <td className="px-3 py-1 text-muted-foreground">{s.email || '—'}</td>
                      <td className="px-3 py-1 text-muted-foreground">{s.phone || '—'}</td>
                      <td className="px-3 py-1 text-right">
                        <button onClick={() => startEdit(s)} className="p-1 text-muted-foreground hover:bg-muted rounded"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(s.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded ml-1"><Trash2 className="h-3.5 w-3.5" /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No suppliers found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-9 px-3 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50" />
    </div>
  );
}
