import { useState, useMemo } from 'react';
import { useTestItems } from '@/hooks/useTestData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Trash2, X, Check, Filter, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['Physical', 'Mechanical', 'Durability', 'Chemical', 'Safety', 'Visual', 'Other'];

export default function TestMethodsPage() {
  const { data: items = [], isLoading } = useTestItems();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({
    name: '', category: 'Physical', unit: '', direction_required: false,
    multiple_samples: true, sample_count: 3, testing_standard: '', equipment_required: '',
    aging_condition: '', display_order: 0,
  });

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.testing_standard || '').toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoryFilter || item.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [items, search, categoryFilter]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach(i => counts.set(i.category, (counts.get(i.category) || 0) + 1));
    return counts;
  }, [items]);

  const startEdit = (item: typeof items[0]) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name, category: item.category, unit: item.unit || '',
      direction_required: item.direction_required, multiple_samples: item.multiple_samples,
      sample_count: item.sample_count, testing_standard: item.testing_standard || '',
      equipment_required: item.equipment_required || '', aging_condition: item.aging_condition || '',
      display_order: item.display_order || 0,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase.from('test_items').update(editForm).eq('id', editingId);
    if (error) { toast.error(error.message); return; }
    toast.success('Test method updated');
    setEditingId(null);
    qc.invalidateQueries({ queryKey: ['test-items'] });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this test method?')) return;
    const { error } = await supabase.from('test_items').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Test method deleted');
    qc.invalidateQueries({ queryKey: ['test-items'] });
  };

  const handleCreate = async () => {
    if (!newForm.name.trim()) { toast.error('Name is required'); return; }
    const { error } = await supabase.from('test_items').insert(newForm);
    if (error) { toast.error(error.message); return; }
    toast.success('Test method created');
    setShowNew(false);
    setNewForm({ name: '', category: 'Physical', unit: '', direction_required: false, multiple_samples: true, sample_count: 3, testing_standard: '', equipment_required: '', aging_condition: '', display_order: 0 });
    qc.invalidateQueries({ queryKey: ['test-items'] });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Test Methods Library</h1>
          <p className="text-sm text-muted-foreground">{items.length} test methods configured</p>
        </div>
        <button onClick={() => setShowNew(true)} className="h-9 px-3 flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Method
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input type="text" placeholder="Search methods..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-sm bg-card border rounded-md shadow-card focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="h-9 px-3 text-sm bg-card border rounded-md shadow-card focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">All Categories</option>
            {Array.from(categories.entries()).map(([cat, count]) => (
              <option key={cat} value={cat}>{cat} ({count})</option>
            ))}
          </select>
        </div>
      </div>

      {/* New form */}
      {showNew && (
        <div className="bg-card rounded-lg shadow-card p-4 border-2 border-primary/20">
          <div className="text-sm font-semibold mb-3">New Test Method</div>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Name *" value={newForm.name} onChange={v => setNewForm(p => ({ ...p, name: v }))} />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Category</label>
              <select value={newForm.category} onChange={e => setNewForm(p => ({ ...p, category: e.target.value }))}
                className="w-full h-9 px-3 text-sm bg-background border rounded-md">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <FormField label="Unit" value={newForm.unit} onChange={v => setNewForm(p => ({ ...p, unit: v }))} />
            <FormField label="Testing Standard" value={newForm.testing_standard} onChange={v => setNewForm(p => ({ ...p, testing_standard: v }))} />
            <FormField label="Equipment Required" value={newForm.equipment_required} onChange={v => setNewForm(p => ({ ...p, equipment_required: v }))} />
            <FormField label="Aging Condition" value={newForm.aging_condition} onChange={v => setNewForm(p => ({ ...p, aging_condition: v }))} />
          </div>
          <div className="flex items-center gap-4 mt-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newForm.direction_required} onChange={e => setNewForm(p => ({ ...p, direction_required: e.target.checked }))} />
              Direction Required (Warp/Filling)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newForm.multiple_samples} onChange={e => setNewForm(p => ({ ...p, multiple_samples: e.target.checked }))} />
              Multiple Samples
            </label>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleCreate} className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Create</button>
            <button onClick={() => setShowNew(false)} className="h-8 px-3 text-xs font-medium text-muted-foreground hover:bg-muted rounded-md">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-lg shadow-card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">#</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Standard</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Equipment</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dir.</th>
                <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors h-10">
                  {editingId === item.id ? (
                    <>
                      <td className="px-3 py-1 text-xs text-muted-foreground">{item.id}</td>
                      <td className="px-3 py-1"><input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="w-full h-7 px-2 text-sm bg-background border rounded-sm" /></td>
                      <td className="px-3 py-1">
                        <select value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} className="h-7 px-2 text-sm bg-background border rounded-sm">
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-1"><input value={editForm.unit} onChange={e => setEditForm(p => ({ ...p, unit: e.target.value }))} className="w-full h-7 px-2 text-sm bg-background border rounded-sm" /></td>
                      <td className="px-3 py-1"><input value={editForm.testing_standard} onChange={e => setEditForm(p => ({ ...p, testing_standard: e.target.value }))} className="w-full h-7 px-2 text-sm bg-background border rounded-sm" /></td>
                      <td className="px-3 py-1"><input value={editForm.equipment_required} onChange={e => setEditForm(p => ({ ...p, equipment_required: e.target.value }))} className="w-full h-7 px-2 text-sm bg-background border rounded-sm" /></td>
                      <td className="px-3 py-1"><input type="checkbox" checked={editForm.direction_required} onChange={e => setEditForm(p => ({ ...p, direction_required: e.target.checked }))} /></td>
                      <td className="px-3 py-1 text-right">
                        <button onClick={saveEdit} className="p-1 text-success hover:bg-success/10 rounded"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:bg-muted rounded ml-1"><X className="h-3.5 w-3.5" /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-1 text-xs text-muted-foreground font-mono">{item.display_order || item.id}</td>
                      <td className="px-3 py-1 font-medium">{item.name}</td>
                      <td className="px-3 py-1"><span className="text-xs px-1.5 py-0.5 rounded-sm bg-muted font-medium">{item.category}</span></td>
                      <td className="px-3 py-1 text-muted-foreground">{item.unit || '—'}</td>
                      <td className="px-3 py-1 text-xs text-muted-foreground">{item.testing_standard || '—'}</td>
                      <td className="px-3 py-1 text-xs text-muted-foreground">{item.equipment_required || '—'}</td>
                      <td className="px-3 py-1 text-xs text-muted-foreground">{item.direction_required ? '↕ Yes' : '—'}</td>
                      <td className="px-3 py-1 text-right">
                        <button onClick={() => startEdit(item)} className="p-1 text-muted-foreground hover:bg-muted rounded"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded ml-1"><Trash2 className="h-3.5 w-3.5" /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">No test methods found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function FormField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-9 px-3 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50" />
    </div>
  );
}
