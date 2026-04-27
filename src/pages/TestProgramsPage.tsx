import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTestItems } from '@/hooks/useTestData';
import { useCreateTestProgram } from '@/hooks/useTestPrograms';
import { Plus, Loader2, Search, FileCheck2, FileClock, FileX2, Archive } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProgramStatusBadge, ProgramVersionBadge, ProgramLockBadge } from '@/components/test-programs/ProgramBadges';

const STATUSES = ['All', 'Draft', 'In Review', 'Approved', 'Active', 'Superseded', 'Archived'] as const;
type StatusFilter = typeof STATUSES[number];

function useProgramsList() {
  return useQuery({
    queryKey: ['test-programs-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_programs')
        .select(`
          id, name, program_code, version_number, status, is_locked, material_type, category,
          updated_at, approver_name, approved_at,
          test_program_items(count),
          program_supplier_links(count),
          material_test_programs(count),
          program_sku_patterns(count)
        `)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function TestProgramsPage() {
  const navigate = useNavigate();
  const { data: programs = [], isLoading } = useProgramsList();
  const { data: allTestItems = [] } = useTestItems();
  const createProgram = useCreateTestProgram();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({
    name: '', description: '', material_type: '', category: '',
    purpose: '', scope_notes: '', intended_use: '',
  });
  const [newSelectedItems, setNewSelectedItems] = useState<Set<number>>(new Set());

  const counts = useMemo(() => {
    const c: Record<string, number> = { Draft: 0, 'In Review': 0, Approved: 0, Active: 0, Superseded: 0, Archived: 0 };
    programs.forEach(p => { c[p.status] = (c[p.status] || 0) + 1; });
    return c;
  }, [programs]);

  const filtered = useMemo(() => {
    return programs.filter(p => {
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(s) &&
          !(p.program_code || '').toLowerCase().includes(s) &&
          !(p.material_type || '').toLowerCase().includes(s)
        ) return false;
      }
      return true;
    });
  }, [programs, statusFilter, search]);

  const categorizedItems = useMemo(() => {
    const cats = new Map<string, typeof allTestItems>();
    allTestItems.forEach(item => {
      const list = cats.get(item.category) || [];
      list.push(item);
      cats.set(item.category, list);
    });
    return cats;
  }, [allTestItems]);

  const handleCreate = async () => {
    if (!newForm.name.trim()) { toast.error('Name is required'); return; }
    try {
      const created = await createProgram.mutateAsync({
        program: {
          name: newForm.name,
          description: newForm.description || undefined,
          material_type: newForm.material_type || undefined,
        },
        testItemIds: Array.from(newSelectedItems),
      });
      // Set extended fields
      if (newForm.category || newForm.purpose || newForm.scope_notes || newForm.intended_use) {
        await supabase.from('test_programs').update({
          category: newForm.category || null,
          purpose: newForm.purpose || null,
          scope_notes: newForm.scope_notes || null,
          intended_use: newForm.intended_use || null,
        }).eq('id', created.id);
      }
      toast.success('Program created — opening detail page');
      setShowNew(false);
      setNewForm({ name: '', description: '', material_type: '', category: '', purpose: '', scope_notes: '', intended_use: '' });
      setNewSelectedItems(new Set());
      navigate(`/test-programs/${created.id}`);
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Lab Resources"
        title="Test Programs"
        description="Governed templates linking test methods, report layout, suppliers, materials and SKU patterns. Versioned with approval workflow."
        actions={
          <Button size="sm" onClick={() => setShowNew(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Program
          </Button>
        }
      />

      <div className="px-6 py-5 space-y-4">
        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <KpiCard label="Draft" value={counts.Draft} icon={<FileClock className="h-3.5 w-3.5" />} tone="muted" active={statusFilter === 'Draft'} onClick={() => setStatusFilter(statusFilter === 'Draft' ? 'All' : 'Draft')} />
          <KpiCard label="In Review" value={counts['In Review']} icon={<FileClock className="h-3.5 w-3.5" />} tone="warning" active={statusFilter === 'In Review'} onClick={() => setStatusFilter(statusFilter === 'In Review' ? 'All' : 'In Review')} />
          <KpiCard label="Approved" value={counts.Approved} icon={<FileCheck2 className="h-3.5 w-3.5" />} tone="success" active={statusFilter === 'Approved'} onClick={() => setStatusFilter(statusFilter === 'Approved' ? 'All' : 'Approved')} />
          <KpiCard label="Active" value={counts.Active} icon={<FileCheck2 className="h-3.5 w-3.5" />} tone="success" active={statusFilter === 'Active'} onClick={() => setStatusFilter(statusFilter === 'Active' ? 'All' : 'Active')} />
          <KpiCard label="Superseded" value={counts.Superseded} icon={<FileX2 className="h-3.5 w-3.5" />} tone="muted" active={statusFilter === 'Superseded'} onClick={() => setStatusFilter(statusFilter === 'Superseded' ? 'All' : 'Superseded')} />
          <KpiCard label="Archived" value={counts.Archived} icon={<Archive className="h-3.5 w-3.5" />} tone="muted" active={statusFilter === 'Archived'} onClick={() => setStatusFilter(statusFilter === 'Archived' ? 'All' : 'Archived')} />
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, code, material…" className="h-8 pl-8 text-sm" />
          </div>
          {statusFilter !== 'All' && (
            <Button variant="ghost" size="sm" onClick={() => setStatusFilter('All')} className="h-8 text-xs">
              Clear filter
            </Button>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} of {programs.length}</span>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-lg border shadow-card p-8 text-center text-muted-foreground text-sm">
            {programs.length === 0 ? 'No test programs yet. Create one to get started.' : 'No programs match the current filter.'}
          </div>
        ) : (
          <div className="bg-card rounded-lg border shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5">Code</th>
                  <th className="text-left px-4 py-2.5">Name</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                  <th className="text-left px-4 py-2.5">Material</th>
                  <th className="text-right px-4 py-2.5">Methods</th>
                  <th className="text-right px-4 py-2.5">Suppliers</th>
                  <th className="text-right px-4 py-2.5">Materials</th>
                  <th className="text-right px-4 py-2.5">SKU rules</th>
                  <th className="text-left px-4 py-2.5">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any) => (
                  <tr key={p.id} className="border-t hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/test-programs/${p.id}`)}>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{p.program_code || '—'}</td>
                    <td className="px-4 py-2.5">
                      <Link to={`/test-programs/${p.id}`} className="font-medium text-foreground hover:text-primary" onClick={e => e.stopPropagation()}>
                        {p.name}
                      </Link>
                      {p.category && <div className="text-[11px] text-muted-foreground mt-0.5">{p.category}</div>}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <ProgramStatusBadge status={p.status} />
                        <ProgramVersionBadge version={p.version_number} />
                        <ProgramLockBadge locked={p.is_locked} />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.material_type || '—'}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-xs">{p.test_program_items?.[0]?.count ?? 0}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-xs">{p.program_supplier_links?.[0]?.count ?? 0}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-xs">{p.material_test_programs?.[0]?.count ?? 0}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-xs">{p.program_sku_patterns?.[0]?.count ?? 0}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(p.updated_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Program Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Test Program</DialogTitle>
            <DialogDescription>Define the foundation. You can refine methods, suppliers, materials and SKU rules on the detail page after creation.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Program Name *" value={newForm.name} onChange={v => setNewForm(p => ({ ...p, name: v }))} />
              <Field label="Category" value={newForm.category} onChange={v => setNewForm(p => ({ ...p, category: v }))} placeholder="e.g. Performance / Compliance" />
              <Field label="Material Type" value={newForm.material_type} onChange={v => setNewForm(p => ({ ...p, material_type: v }))} placeholder="e.g. Poly-Cotton Canvas" />
              <Field label="Intended Use" value={newForm.intended_use} onChange={v => setNewForm(p => ({ ...p, intended_use: v }))} placeholder="Tent fabric, awning…" />
            </div>
            <FieldArea label="Description" value={newForm.description} onChange={v => setNewForm(p => ({ ...p, description: v }))} />
            <FieldArea label="Purpose" value={newForm.purpose} onChange={v => setNewForm(p => ({ ...p, purpose: v }))} placeholder="Why does this program exist?" />
            <FieldArea label="Scope Notes" value={newForm.scope_notes} onChange={v => setNewForm(p => ({ ...p, scope_notes: v }))} placeholder="What's in / out of scope?" />

            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Initial Test Methods ({newSelectedItems.size} selected)</div>
              <div className="max-h-56 overflow-y-auto border rounded-md p-2 bg-background space-y-2">
                {Array.from(categorizedItems.entries()).map(([cat, items]) => (
                  <div key={cat}>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{cat}</div>
                    <div className="grid grid-cols-2 gap-1">
                      {items.map(item => (
                        <label key={item.id} className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded cursor-pointer transition-colors ${newSelectedItems.has(item.id) ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
                          <input type="checkbox" checked={newSelectedItems.has(item.id)} onChange={() => {
                            setNewSelectedItems(prev => {
                              const next = new Set(prev);
                              if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                              return next;
                            });
                          }} />
                          <span className="font-medium">{item.name}</span>
                          {item.unit && <span className="text-muted-foreground">({item.unit})</span>}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={createProgram.isPending || !newForm.name.trim()}>
              {createProgram.isPending ? 'Creating…' : 'Create & Open'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({ label, value, icon, tone, active, onClick }: { label: string; value: number; icon: React.ReactNode; tone: 'muted' | 'warning' | 'success'; active: boolean; onClick: () => void }) {
  const toneCls = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-muted-foreground';
  return (
    <button onClick={onClick}
      className={`text-left bg-card rounded-lg border shadow-card px-3 py-2.5 transition-all hover:shadow-md ${active ? 'ring-2 ring-primary/40 border-primary/40' : ''}`}>
      <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${toneCls}`}>
        {icon} {label}
      </div>
      <div className="text-2xl font-bold tabular-nums mt-0.5">{value}</div>
    </button>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="h-8 text-sm" />
    </div>
  );
}

function FieldArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      <Textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2} className="text-sm" />
    </div>
  );
}
