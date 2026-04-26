import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestItems } from '@/hooks/useTestData';
import { useStandards } from '@/hooks/useReferenceData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Plus, Trash2, ExternalLink, TestTubes } from 'lucide-react';
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

type TestItem = {
  id: number;
  name: string;
  category: string;
  unit?: string | null;
  method_code?: string | null;
  status?: string | null;
  version?: number | null;
};

export default function TestMethodsPage() {
  const navigate = useNavigate();
  const { data: items = [], isLoading } = useTestItems();
  const { data: standards = [] } = useStandards();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({
    name: '',
    category: 'Physical',
    unit: '',
    standard_id: '',
    summary: '',
  });

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
    return (items as TestItem[]).filter((item) => {
      const primary = primaryStandardByItem.get(item.id) || '';
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.method_code || '').toLowerCase().includes(search.toLowerCase()) ||
        primary.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [items, search, categoryFilter, statusFilter, primaryStandardByItem]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((i: any) => counts.set(i.category, (counts.get(i.category) || 0) + 1));
    return counts;
  }, [items]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this test method? All versions and detail data will be removed.')) return;
    const { error } = await supabase.from('test_items').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Test method deleted');
    qc.invalidateQueries({ queryKey: ['test-items'] });
  };

  const handleCreate = async () => {
    if (!newForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    const method_code = buildMethodCode(
      newForm.category,
      items.map((i: any) => i.method_code).filter(Boolean),
    );
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
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Created ${method_code}`);
    setShowNew(false);
    setNewForm({ name: '', category: 'Physical', unit: '', standard_id: '', summary: '' });
    qc.invalidateQueries({ queryKey: ['test-items'] });
    if (data) navigate(`/test-methods/${data.id}`);
  };

  const statusBadge = (status?: string | null) => {
    const cls =
      status === 'Active'
        ? 'bg-success-soft text-success border-success/30'
        : status === 'Archived'
          ? 'bg-muted text-muted-foreground border-border'
          : 'bg-warning-soft text-warning border-warning/30';
    return (
      <Badge variant="outline" className={`text-[10px] ${cls}`}>
        {status || 'Draft'}
      </Badge>
    );
  };

  const columns: Column<TestItem>[] = [
    {
      key: 'method_code',
      header: 'Code',
      sortValue: (r) => r.method_code ?? `#${r.id}`,
      width: '120px',
      cell: (i) => (
        <span className="font-mono text-xs text-primary font-medium">
          {i.method_code || `#${i.id}`}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortValue: (r) => r.name,
      cell: (i) => <span className="font-medium">{i.name}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      sortValue: (r) => r.category,
      hideBelow: 'sm',
      cell: (i) => (
        <Badge variant="outline" className="text-[10px] bg-muted/50 border-border font-normal">
          {i.category}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.status ?? '',
      cell: (i) => statusBadge(i.status),
    },
    {
      key: 'version',
      header: 'Ver',
      sortValue: (r) => r.version ?? 0,
      hideBelow: 'md',
      cell: (i) => (
        <span className="text-xs text-muted-foreground font-mono">v{i.version || 1}</span>
      ),
    },
    {
      key: 'unit',
      header: 'Unit',
      hideBelow: 'lg',
      cell: (i) => <span className="text-muted-foreground text-xs">{i.unit || '—'}</span>,
    },
    {
      key: 'standard',
      header: 'Standard',
      hideBelow: 'md',
      cell: (i) => {
        const std = primaryStandardByItem.get(i.id);
        return std ? (
          <Badge
            variant="outline"
            className="text-[10px] bg-primary-soft text-primary border-primary/20 font-mono"
          >
            {std}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '90px',
      cell: (i) => (
        <RowActions>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/test-methods/${i.id}`);
            }}
            className="h-7 w-7"
            title="Open"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => handleDelete(i.id, e)}
            className="h-7 w-7 text-destructive hover:text-destructive"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </RowActions>
      ),
    },
  ];

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Lab Resources"
        title="Test Methods Library"
        description="ISO/IEC 17025-aligned method definitions with versioned standards and procedures."
        actions={
          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8">
                <Plus className="h-4 w-4 mr-1" /> Add Method
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>New Test Method</DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground">
                Create a basic record, then open the detail page to add standards, equipment,
                procedure steps, and acceptance criteria.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  label="Name *"
                  value={newForm.name}
                  onChange={(v) => setNewForm((p) => ({ ...p, name: v }))}
                />
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={newForm.category}
                    onValueChange={(v) => setNewForm((p) => ({ ...p, category: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <FormField
                  label="Unit"
                  value={newForm.unit}
                  onChange={(v) => setNewForm((p) => ({ ...p, unit: v }))}
                />
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Primary Standard</Label>
                  <Select
                    value={newForm.standard_id || 'none'}
                    onValueChange={(v) =>
                      setNewForm((p) => ({ ...p, standard_id: v === 'none' ? '' : v }))
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="— None —" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {standards.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.code}
                          {s.version ? `:${s.version}` : ''} ({s.organization})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <FormField
                  label="Summary"
                  value={newForm.summary}
                  onChange={(v) => setNewForm((p) => ({ ...p, summary: v }))}
                />
              </div>
              <Button onClick={handleCreate} className="w-full mt-2">
                Create &amp; Open
              </Button>
            </DialogContent>
          </Dialog>
        }
      />

      <PageBody className="space-y-4">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, code, or standard…"
          summary={`${filtered.length} of ${items.length} methods`}
          filters={[
            {
              key: 'category',
              label: 'Category',
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: [
                { value: 'all', label: 'All categories' },
                ...Array.from(categoryCounts.entries()).map(([cat, count]) => ({
                  value: cat,
                  label: cat,
                  count,
                })),
              ],
            },
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'all', label: 'All statuses' },
                ...STATUSES.map((s) => ({ value: s, label: s })),
              ],
            },
          ]}
        />

        {isLoading ? (
          <TableSkeleton columns={7} rows={8} />
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/test-methods/${r.id}`)}
            defaultSort={{ key: 'method_code', direction: 'asc' }}
            emptyState={
              <EmptyState
                icon={TestTubes}
                title={items.length === 0 ? 'No test methods yet' : 'No matches'}
                description={
                  items.length === 0
                    ? 'Add your first test method to start building the library.'
                    : 'Try adjusting your search or filters.'
                }
                action={
                  items.length === 0 && (
                    <Button size="sm" onClick={() => setShowNew(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Add Method
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
