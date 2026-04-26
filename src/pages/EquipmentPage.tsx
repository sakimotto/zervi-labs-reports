import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEquipment, useCreateEquipment } from '@/hooks/useEquipment';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, AlertTriangle, Cpu, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  EquipmentFormFields,
  blankEquipmentForm,
  equipmentFormToPayload,
  validateEquipmentForm,
  type EquipmentFormState,
} from '@/components/equipment/EquipmentFormFields';
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_STATUSES,
  CAL_STATUSES,
  deriveCalStatus,
} from '@/lib/equipment-constants';
import { PageHeader, PageBody } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { EmptyState, TableSkeleton } from '@/components/data/EmptyState';
import { BulkActionBar } from '@/components/data/BulkActionBar';
import { useSavedViews } from '@/hooks/useSavedViews';

type Eq = ReturnType<typeof useEquipment>['data'] extends (infer T)[] | undefined ? T : never;

export default function EquipmentPage() {
  const navigate = useNavigate();
  const { data: equipment = [], isLoading } = useEquipment();
  const createEquipment = useCreateEquipment();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<EquipmentFormState>(blankEquipmentForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [q, setQ] = useState('');
  const [fCategory, setFCategory] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [fCalStatus, setFCalStatus] = useState('all');
  const [fLocation, setFLocation] = useState('all');

  const locations = useMemo(
    () => Array.from(new Set(equipment.map((e) => e.location).filter(Boolean))) as string[],
    [equipment],
  );

  const filtered = useMemo(() => {
    return equipment.filter((e) => {
      if (fCategory !== 'all' && e.category !== fCategory) return false;
      if (fStatus !== 'all' && e.status !== fStatus) return false;
      if (fLocation !== 'all' && e.location !== fLocation) return false;
      if (fCalStatus !== 'all') {
        const s = deriveCalStatus(e.next_calibration_due);
        if (s !== fCalStatus) return false;
      }
      if (q.trim()) {
        const t = q.toLowerCase();
        const hay = [e.name, e.asset_tag, e.model, e.serial_number, e.manufacturer, e.sub_type, e.location]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
  }, [equipment, q, fCategory, fStatus, fCalStatus, fLocation]);

  const dueCount = useMemo(
    () =>
      equipment.filter((e) => {
        const s = deriveCalStatus(e.next_calibration_due);
        return s === 'Due Soon' || s === 'Out of Cal';
      }).length,
    [equipment],
  );

  const handleCreate = async () => {
    const errs = validateEquipmentForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      const payload = equipmentFormToPayload(form);
      const created = await createEquipment.mutateAsync(payload as any);
      toast.success('Equipment added');
      setForm(blankEquipmentForm);
      setShowAdd(false);
      if (created?.id) navigate(`/equipment/${created.id}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to add');
    }
  };

  const columns: Column<Eq>[] = [
    {
      key: 'name',
      header: 'Name',
      sortValue: (r) => r.name,
      cell: (eq) => <span className="font-medium">{eq.name}</span>,
    },
    {
      key: 'asset_tag',
      header: 'Asset Tag',
      sortValue: (r) => r.asset_tag ?? '',
      hideBelow: 'sm',
      cell: (eq) => (
        <span className="font-mono text-xs text-muted-foreground">{eq.asset_tag || '—'}</span>
      ),
    },
    {
      key: 'category',
      header: 'Category / Sub-type',
      sortValue: (r) => r.category,
      hideBelow: 'md',
      cell: (eq) => (
        <div className="text-xs">
          <div className="text-foreground">{eq.category}</div>
          {eq.sub_type && <div className="text-muted-foreground">{eq.sub_type}</div>}
        </div>
      ),
    },
    {
      key: 'manufacturer',
      header: 'Manufacturer',
      sortValue: (r) => r.manufacturer ?? '',
      hideBelow: 'lg',
      cell: (eq) => (
        <div className="text-xs">
          <div className="text-foreground">{eq.manufacturer || '—'}</div>
          {eq.model && <div className="text-muted-foreground">{eq.model}</div>}
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      sortValue: (r) => r.location ?? '',
      hideBelow: 'lg',
      cell: (eq) => (
        <span className="text-xs text-muted-foreground">
          {eq.location || '—'}
          {eq.room ? ` · ${eq.room}` : ''}
          {eq.bench ? ` · ${eq.bench}` : ''}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.status,
      cell: (eq) => (
        <Badge
          variant={
            eq.status === 'Active' ? 'default' : eq.status === 'Retired' ? 'secondary' : 'destructive'
          }
          className="text-[10px]"
        >
          {eq.status}
        </Badge>
      ),
    },
    {
      key: 'cal_status',
      header: 'Calibration',
      sortValue: (r) => deriveCalStatus(r.next_calibration_due) ?? '',
      cell: (eq) => {
        const s = deriveCalStatus(eq.next_calibration_due);
        const tone =
          s === 'In Cal'
            ? 'bg-success-soft text-success border-success/30'
            : s === 'Due Soon'
              ? 'bg-warning-soft text-warning border-warning/30'
              : s === 'Out of Cal'
                ? 'bg-destructive/10 text-destructive border-destructive/30'
                : '';
        return s ? (
          <Badge variant="outline" className={`text-[10px] ${tone}`}>
            {s}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      key: 'next_due',
      header: 'Next Due',
      sortValue: (r) => r.next_calibration_due ?? '',
      hideBelow: 'md',
      cell: (eq) => (
        <span className="text-xs font-mono tabular-nums">
          {eq.next_calibration_due || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Lab Resources"
        title="Equipment Registry"
        description="Manage lab equipment, calibration program, and maintenance across all benches."
        actions={
          <>
            {dueCount > 0 && (
              <Badge variant="outline" className="bg-warning-soft text-warning border-warning/30 h-8 px-3">
                <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> {dueCount} due / overdue
              </Badge>
            )}
            <Dialog
              open={showAdd}
              onOpenChange={(o) => {
                setShowAdd(o);
                if (!o) {
                  setForm(blankEquipmentForm);
                  setErrors({});
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 shadow-card">
                  <Plus className="h-4 w-4 mr-1" /> Add Equipment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Equipment</DialogTitle>
                </DialogHeader>
                <EquipmentFormFields form={form} setForm={setForm} errors={errors} />
                <Button
                  onClick={handleCreate}
                  disabled={createEquipment.isPending}
                  className="w-full"
                >
                  Save
                </Button>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <PageBody className="space-y-4">
        <FilterBar
          search={q}
          onSearchChange={setQ}
          searchPlaceholder="Search name, tag, model, S/N…"
          summary={`${filtered.length} of ${equipment.length} units`}
          filters={[
            {
              key: 'category',
              label: 'Category',
              value: fCategory,
              onChange: setFCategory,
              options: [
                { value: 'all', label: 'All categories' },
                ...EQUIPMENT_CATEGORIES.map((c) => ({ value: c, label: c })),
              ],
            },
            {
              key: 'status',
              label: 'Status',
              value: fStatus,
              onChange: setFStatus,
              options: [
                { value: 'all', label: 'All statuses' },
                ...EQUIPMENT_STATUSES.map((s) => ({ value: s, label: s })),
              ],
            },
            {
              key: 'cal',
              label: 'Cal Status',
              value: fCalStatus,
              onChange: setFCalStatus,
              options: [
                { value: 'all', label: 'All cal statuses' },
                ...CAL_STATUSES.map((s) => ({ value: s, label: s })),
              ],
            },
            ...(locations.length > 0
              ? [
                  {
                    key: 'location',
                    label: 'Location',
                    value: fLocation,
                    onChange: setFLocation,
                    options: [
                      { value: 'all', label: 'All locations' },
                      ...locations.map((l) => ({ value: l, label: l })),
                    ],
                  },
                ]
              : []),
          ]}
        />

        {isLoading ? (
          <TableSkeleton columns={8} rows={6} />
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/equipment/${r.id}`)}
            defaultSort={{ key: 'name', direction: 'asc' }}
            emptyState={
              <EmptyState
                icon={Cpu}
                title={equipment.length === 0 ? 'No equipment registered' : 'No matches'}
                description={
                  equipment.length === 0
                    ? 'Add your first piece of lab equipment to start tracking calibration and maintenance.'
                    : 'Try adjusting your search or filters.'
                }
                action={
                  equipment.length === 0 && (
                    <Button size="sm" onClick={() => setShowAdd(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Add Equipment
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
