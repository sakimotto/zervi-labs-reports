import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestItems } from '@/hooks/useTestData';
import { useStandards } from '@/hooks/useReferenceData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Search, Plus, Trash2, Filter, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['Physical', 'Mechanical', 'Durability', 'Chemical', 'Safety', 'Visual', 'Other'];
const STATUSES = ['Draft', 'Active', 'Archived'];

function buildMethodCode(category: string, existingCodes: string[]): string {
  const prefix = (category.replace(/[^A-Za-z]/g, '').slice(0, 3) || 'GEN').toUpperCase();
  const used = existingCodes
    .filter((c) => c?.startsWith(prefix + '-'))
    .map((c) => parseInt(c.split('-')[1], 10))
    .filter((n) => !Number.isNaN(n));
  const next = (used.length ? Math.max(...used) : 0) + 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

export default function TestMethodsPage() {
  const navigate = useNavigate();
  const { data: items = [], isLoading } = useTestItems();
  const { data: standards = [] } = useStandards();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({
    name: '', category: 'Physical', unit: '',
    standard_id: '', summary: '',
  });

  // Pull primary standards from method_standards (canonical source).
  const { data: primaryStandards = [] } = useQuery({
    queryKey: ['method-primary-standards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('method_standards')
        .select('test_item_id, standard_id, standard_text, year, is_primary')
        .eq('is_primary', true);
      if (error) throw error;
      return data ?? [];
    },
  });

  const standardsMap = useMemo(() => {
    const map = new Map<string, string>();
    standards.forEach((s) => map.set(s.id, `${s.code}${s.version ? `:${s.version}` : ''}`));
    return map;
  }, [standards]);

  // Map test_item_id -> primary standard label (from method_standards).
  const primaryStandardByItem = useMemo(() => {
    const map = new Map<number, string>();
    primaryStandards.forEach((row: any) => {
      const label = row.standard_id
        ? standardsMap.get(row.standard_id) || row.standard_text || ''
        : `${row.standard_text || ''}${row.year ? `:${row.year}` : ''}`;
      if (label && !map.has(row.test_item_id)) map.set(row.test_item_id, label);
    });
    return map;
  }, [primaryStandards, standardsMap]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const primary = primaryStandardByItem.get(item.id) || '';
      const matchSearch = !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.method_code || '').toLowerCase().includes(search.toLowerCase()) ||
        primary.toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoryFilter || item.category === categoryFilter;
      const matchStatus = !statusFilter || (item as any).status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [items, search, categoryFilter, statusFilter, primaryStandardByItem]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((i) => counts.set(i.category, (counts.get(i.category) || 0) + 1));
    return counts;
  }, [items]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this test method? All versions and detail data will be removed.')) return;
    const { error } = await supabase.from('test_items').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Test method deleted');
    qc.invalidateQueries({ queryKey: ['test-items'] });
  };

  const handleCreate = async () => {
    if (!newForm.name.trim()) { toast.error('Name is required'); return; }
    const method_code = buildMethodCode(newForm.category, items.map((i) => (i as any).method_code).filter(Boolean));
    const { standard_id, ...rest } = newForm;
    const payload = {
      ...rest,
      method_code,
      status: 'Draft',
      version: 1,
      standard_id: standard_id || null,
      direction_required: false,
      multiple_samples: true,
      sample_count: 3,
      display_order: items.length + 1,
    };
    const { data, error } = await supabase.from('test_items').insert(payload).select().single();
    if (error) { toast.error(error.message); return; }
    toast.success(`Created ${method_code}`);
    setShowNew(false);
    setNewForm({ name: '', category: 'Physical', unit: '', standard_id: '', summary: '' });
    qc.invalidateQueries({ queryKey: ['test-items'] });
    if (data) navigate(`/test-methods/${data.id}`);
  };

  const statusBadge = (status?: string | null) => {
    const cls = status === 'Active' ? 'bg-success/15 text-success'
      : status === 'Archived' ? 'bg-muted text-muted-foreground'
      : 'bg-warning/15 text-warning-foreground';
    return <span className={`text-xs px-1.5 py-0.5 rounded-sm font-medium ${cls}`}>{status || 'Draft'}</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Test Methods Library</h1>
          <p className="text-sm text-muted-foreground">{items.length} methods · ISO/IEC 17025 method definitions</p>
        </div>
        <button onClick={() => setShowNew(true)} className="h-9 px-3 flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Method
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md min-w-[240px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, code, or standard..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-sm bg-card border rounded-md shadow-card focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-9 px-3 text-sm bg-card border rounded-md shadow-card focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">All Categories</option>
            {Array.from(categories.entries()).map(([cat, count]) => (
              <option key={cat} value={cat}>{cat} ({count})</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 text-sm bg-card border rounded-md shadow-card focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {showNew && (
        <div className="bg-card rounded-lg shadow-card p-4 border-2 border-primary/20">
          <div className="text-sm font-semibold mb-3">New Test Method</div>
          <p className="text-xs text-muted-foreground mb-3">Create a basic record, then open the detail page to add standards, equipment, procedure steps, and acceptance criteria.</p>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Name *" value={newForm.name} onChange={(v) => setNewForm((p) => ({ ...p, name: v }))} />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Category</label>
              <select value={newForm.category} onChange={(e) => setNewForm((p) => ({ ...p, category: e.target.value }))} className="w-full h-9 px-3 text-sm bg-background border rounded-md">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <FormField label="Unit" value={newForm.unit} onChange={(v) => setNewForm((p) => ({ ...p, unit: v }))} />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Primary Standard</label>
              <select value={newForm.standard_id} onChange={(e) => setNewForm((p) => ({ ...p, standard_id: e.target.value }))} className="w-full h-9 px-3 text-sm bg-background border rounded-md">
                <option value="">— None —</option>
                {standards.map((s) => <option key={s.id} value={s.id}>{s.code}{s.version ? `:${s.version}` : ''} ({s.organization})</option>)}
              </select>
            </div>
            <FormField label="Standard (free text)" value={newForm.testing_standard} onChange={(v) => setNewForm((p) => ({ ...p, testing_standard: v }))} />
            <FormField label="Summary" value={newForm.summary} onChange={(v) => setNewForm((p) => ({ ...p, summary: v }))} />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleCreate} className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Create & Open</button>
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
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Code</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ver</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Standard</th>
                <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => navigate(`/test-methods/${item.id}`)}
                  className="border-b last:border-b-0 hover:bg-muted/30 transition-colors h-10 cursor-pointer"
                >
                  <td className="px-3 py-1 font-mono text-xs text-primary">{(item as any).method_code || `#${item.id}`}</td>
                  <td className="px-3 py-1 font-medium">{item.name}</td>
                  <td className="px-3 py-1"><span className="text-xs px-1.5 py-0.5 rounded-sm bg-muted font-medium">{item.category}</span></td>
                  <td className="px-3 py-1">{statusBadge((item as any).status)}</td>
                  <td className="px-3 py-1 text-xs text-muted-foreground font-mono">v{(item as any).version || 1}</td>
                  <td className="px-3 py-1 text-muted-foreground">{item.unit || '—'}</td>
                  <td className="px-3 py-1 text-xs text-muted-foreground">
                    {(item as any).standard_id ? (
                      <span className="px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary font-mono">{standardsMap.get((item as any).standard_id) || item.testing_standard}</span>
                    ) : (
                      item.testing_standard || '—'
                    )}
                  </td>
                  <td className="px-3 py-1 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/test-methods/${item.id}`); }}
                      className="p-1 text-muted-foreground hover:bg-muted rounded"
                      title="Open detail"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1 text-destructive hover:bg-destructive/10 rounded ml-1"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
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
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
  );
}
